"""Mean-pooled hidden states of pretrained speech models for every VOC-ALS clip.

Output: data/emb_<model>.npz with `ids`, `tasks` and `x` of shape
(n_clips, n_layers + 1, hidden). Middle layers usually carry the most
voice-quality information, so all layers are saved and the choice of layer is
made inside cross-validation (see experiments_v3.py), not here.
"""
import re
import sys
from pathlib import Path

import librosa
import numpy as np
import torch
from transformers import AutoModel

HERE = Path(__file__).parent
RAW = HERE / "data" / "raw"
MODELS = {"wav2vec2": "facebook/wav2vec2-base", "wavlm": "microsoft/wavlm-base-plus"}
FILE_RE = re.compile(r"^([A-Za-z]+\d+)_(phonation[AEIOU]|rhythm(?:PA|TA|KA))$")
MAX_SECONDS = 20  # longest clips are ~20 s; cap to bound memory


def main(name: str):
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = AutoModel.from_pretrained(MODELS[name]).to(device).eval()
    ids, tasks, feats = [], [], []
    wavs = sorted(RAW.rglob("*.wav"))
    for i, p in enumerate(wavs, 1):
        m = FILE_RE.match(p.stem)
        if not m:
            continue
        y, _ = librosa.load(p, sr=16000, mono=True)  # model expects 16 kHz; clips are 8 kHz
        y = y[: MAX_SECONDS * 16000]
        y = (y - y.mean()) / (y.std() + 1e-7)
        with torch.no_grad():
            hs = model(torch.from_numpy(y)[None].to(device), output_hidden_states=True).hidden_states
        feats.append(torch.stack([h[0].mean(0) for h in hs]).cpu().numpy())
        ids.append(m[1]); tasks.append(m[2])
        if i % 100 == 0:
            print(f"{name}: {i}/{len(wavs)}", flush=True)
    np.savez(HERE / "data" / f"emb_{name}.npz", ids=ids, tasks=tasks, x=np.stack(feats))
    print(f"{name}: saved {len(ids)} clips", flush=True)


if __name__ == "__main__":
    for n in sys.argv[1:] or MODELS:
        main(n)
