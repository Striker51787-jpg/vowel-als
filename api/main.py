"""Scoring API for the ALS Voice Screen app.

Audio is processed in memory and never written to disk or stored. Only the
results go back to the phone, which saves them to the user's own Firestore.
"""
from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ml"))
from features import (RHYTHM_TASKS, SR, TASKS, VOWEL_TASKS, load_audio,  # noqa: E402
                      pool_features, pool_mfcc, quality_check, task_features)

MODEL_PATH = Path(os.environ.get("MODEL_PATH", ROOT / "ml" / "models" / "model.joblib"))
REQUIRE_AUTH = os.environ.get("REQUIRE_AUTH", "1") == "1"
MAX_BYTES = 5 * 1024 * 1024  # per clip; 8 tasks of ~5-10 s are far smaller

app = FastAPI(title="ALS Voice Screen API")
_model = None


def model() -> dict:
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise HTTPException(503, "Model not trained yet")
        _model = joblib.load(MODEL_PATH)
    return _model


def verify_user(authorization: str | None = Header(None)) -> str | None:
    """Only signed-in app users may call the API. Returns their Firebase uid."""
    if not REQUIRE_AUTH:
        return None
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing sign-in token")
    import firebase_admin
    from firebase_admin import auth, credentials
    if not firebase_admin._apps:
        # On a host that only offers secrets as env vars (e.g. Hugging Face Spaces), the
        # service-account JSON comes in FIREBASE_SERVICE_ACCOUNT_JSON; otherwise fall back
        # to GOOGLE_APPLICATION_CREDENTIALS.
        raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        firebase_admin.initialize_app(credentials.Certificate(json.loads(raw)) if raw else None)
    try:
        return auth.verify_id_token(authorization.removeprefix("Bearer "))["uid"]
    except Exception:
        raise HTTPException(401, "Invalid sign-in token")


async def read_clip(f: UploadFile) -> np.ndarray:
    data = await f.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Recording too large")
    try:
        return load_audio(io.BytesIO(data))
    except Exception:
        pass
    # Formats soundfile can't read (e.g. Android .m4a) are converted to WAV by
    # ffmpeg. MP4 files need a seekable input, so the upload goes in a temp file
    # that is deleted as soon as ffmpeg finishes.
    suffix = Path(f.filename or "").suffix or ".m4a"
    with tempfile.NamedTemporaryFile(suffix=suffix) as tmp:
        tmp.write(data)
        tmp.flush()
        proc = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", tmp.name, "-ac", "1", "-ar", str(SR), "-f", "wav", "pipe:1"],
            capture_output=True, timeout=30)
    if proc.returncode != 0 or not proc.stdout:
        raise HTTPException(400, f"Could not read audio file {f.filename!r}")
    return load_audio(io.BytesIO(proc.stdout))


@app.get("/health")
def health():
    return {"ok": True, "model_loaded": MODEL_PATH.exists()}


@app.post("/quality")
async def quality(task: str = Form(...), clip: UploadFile = File(...), _=Depends(verify_user)):
    if task not in TASKS:
        raise HTTPException(400, f"Unknown task {task!r}")
    return quality_check(await read_clip(clip), task)


def plain_metrics(feats: dict[str, float]) -> dict:
    """Interpretable per-task numbers for the result screen and trend charts."""
    def avg(name, tasks):
        vals = [feats.get(f"{t}__{name}") for t in tasks]
        vals = [v for v in vals if v is not None and np.isfinite(v)]
        return float(np.mean(vals)) if vals else None
    return {
        "pitch_hz": avg("f0_mean", VOWEL_TASKS),
        "pitch_variability_semitones": avg("f0_sd_st", VOWEL_TASKS),
        "jitter_percent": (lambda j: j * 100 if j is not None else None)(avg("jitter_local", VOWEL_TASKS)),
        "shimmer_percent": (lambda s: s * 100 if s is not None else None)(avg("shimmer_local", VOWEL_TASKS)),
        "hnr_db": avg("hnr", VOWEL_TASKS),
        "vowel_duration_s": avg("duration", VOWEL_TASKS),
        "syllable_rate_per_s": avg("ddk_rate", RHYTHM_TASKS),
        "syllable_regularity_cv": avg("ddk_cv", RHYTHM_TASKS),
        "pause_ratio": avg("pause_ratio", RHYTHM_TASKS),
    }


@app.post("/score")
async def score(clips: list[UploadFile] = File(...), _=Depends(verify_user)):
    """Clips must be named <task>.<ext>, one per task, e.g. phonationA.wav."""
    m = model()
    by_task = {Path(c.filename or "").stem: c for c in clips}
    missing = [t for t in m["tasks"] if t not in by_task]
    if missing:
        raise HTTPException(400, f"Missing recordings for: {', '.join(missing)}")

    feats, quality_notes = {}, {}
    for t in m["tasks"]:
        y = await read_clip(by_task[t])
        q = quality_check(y, t)
        if not q["ok"]:
            quality_notes[t] = q["reason"]
        feats.update(task_features(t, y))
    feats.update(pool_features(feats))
    feats.update(pool_mfcc(feats))

    X = pd.DataFrame([feats]).reindex(columns=m["columns"])
    pipe = m["pipeline"]
    s = float(pipe.predict_proba(X)[0, 1])
    b = m["bands"]
    band = "low" if s < b["low_max"] else ("elevated" if s >= b["elevated_min"] else "borderline")

    # Contribution of each feature = coefficient x standardised value.
    z = pipe.named_steps["scale"].transform(pipe.named_steps["impute"].transform(X))[0]
    contrib = pipe.named_steps["clf"].coef_[0] * z
    top = sorted(zip(m["columns"], contrib), key=lambda kv: -abs(kv[1]))[:6]

    return {
        "band": band,
        # The raw score is NOT a probability of having ALS (see README); the app
        # shows the band only. Returned for the PDF's technical appendix.
        "model_score": round(s, 3),
        "metrics": plain_metrics(feats),
        "top_factors": [{"feature": f, "direction": "toward_als" if c > 0 else "toward_typical",
                         "weight": round(float(c), 3)} for f, c in top],
        "quality_warnings": quality_notes,
        "model_version": m["version"],
        "sample_rate_hz": SR,
    }
