"""API tests on synthetic clips. Set MODEL_PATH to any trained model.joblib."""
import io
import os
import sys
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

os.environ["REQUIRE_AUTH"] = "0"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "ml"))

from fastapi.testclient import TestClient  # noqa: E402
from main import app, MODEL_PATH  # noqa: E402
from tests.test_features import harmonic_tone, syllable_train, with_silence  # noqa: E402
from features import SR, TASKS, VOWEL_TASKS  # noqa: E402

client = TestClient(app)


def wav(y, sr=SR) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, y, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def clip(task):
    y = harmonic_tone(150, 4) if task in VOWEL_TASKS else syllable_train(6, 4)
    return with_silence(y)


def test_quality_endpoint_rejects_short_clip():
    r = client.post("/quality", data={"task": "phonationA"},
                    files={"clip": ("a.wav", wav(harmonic_tone(150, 1)), "audio/wav")})
    assert r.status_code == 200 and r.json()["ok"] is False


def test_quality_endpoint_accepts_44k_phone_audio():
    # Phones record at 44.1/48 kHz; the API must resample to 8 kHz itself.
    import librosa
    y = librosa.resample(clip("phonationA"), orig_sr=SR, target_sr=48000)
    r = client.post("/quality", data={"task": "phonationA"},
                    files={"clip": ("a.wav", wav(y, 48000), "audio/wav")})
    assert r.json()["ok"] is True


@pytest.mark.skipif(not MODEL_PATH.exists(), reason="no trained model")
def test_score_full_session():
    files = [("clips", (f"{t}.wav", wav(clip(t)), "audio/wav")) for t in TASKS]
    r = client.post("/score", files=files)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["band"] in {"low", "borderline", "elevated"}
    assert body["metrics"]["pitch_hz"] == pytest.approx(150, abs=3)
    assert body["metrics"]["syllable_rate_per_s"] == pytest.approx(6, abs=0.6)


@pytest.mark.skipif(not MODEL_PATH.exists(), reason="no trained model")
def test_score_missing_task_is_400():
    files = [("clips", ("phonationA.wav", wav(clip("phonationA")), "audio/wav"))]
    assert client.post("/score", files=files).status_code == 400


RAW = Path(__file__).resolve().parents[2] / "ml" / "data" / "raw" / "VOC-ALS_Audio"
FEATURES = Path(__file__).resolve().parents[2] / "ml" / "data" / "features.csv"


@pytest.mark.skipif(not (MODEL_PATH.exists() and RAW.exists() and FEATURES.exists()),
                    reason="needs trained model and the VOC-ALS data")
@pytest.mark.parametrize("pid", ["CT001", "PZ045"])
def test_api_matches_offline_pipeline_on_real_participants(pid):
    """Raw WAVs through the API must give the same score as the offline feature table."""
    import joblib
    import pandas as pd
    from features import MFCC, pool_mfcc

    files = [("clips", (f"{t}.wav", (RAW / f"{pid}_{t}.wav").read_bytes(), "audio/wav")) for t in TASKS]
    r = client.post("/score", files=files)
    assert r.status_code == 200, r.text

    row = pd.read_csv(FEATURES).set_index("id").loc[pid].to_dict()
    row.update(pool_mfcc(row))
    m = joblib.load(MODEL_PATH)
    X = pd.DataFrame([row]).reindex(columns=m["columns"])
    expected = float(m["pipeline"].predict_proba(X)[0, 1])
    assert r.json()["model_score"] == pytest.approx(expected, abs=0.002)
