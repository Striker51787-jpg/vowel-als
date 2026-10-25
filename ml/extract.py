"""Build ml/data/features.csv: one row per participant, all task features + metadata.

Recordings are named <ID>_<task>.wav (e.g. PZ001_phonationA.wav) and the
metadata spreadsheet has one row per participant with ID, age, sex and
category (HC or ALS).
"""
import re
import sys
from pathlib import Path

import pandas as pd

from features import TASKS, load_audio, pool_features, task_features

RAW = Path(__file__).parent / "data" / "raw"
OUT = Path(__file__).parent / "data" / "features.csv"
FILE_RE = re.compile(rf"^(?P<id>[A-Za-z]+\d+)_(?P<task>{'|'.join(TASKS)})$")


def load_metadata() -> pd.DataFrame:
    sheets = list(RAW.rglob("*.xlsx"))
    if len(sheets) != 1:
        sys.exit(f"Expected exactly one .xlsx in {RAW}, found {sheets}")
    # Row 1 of the sheet is placeholder "Column-N" headers; the real ones are row 2.
    df = pd.read_excel(sheets[0], sheet_name="VOC-ALS_Data", header=1)
    df.columns = [c.strip() for c in df.columns]
    num = lambda c: pd.to_numeric(df[c], errors="coerce")  # "-" means not applicable
    return pd.DataFrame({
        "id": df["ID"].astype(str).str.strip(),
        "als": df["Category"].str.strip().eq("ALS").astype(int),
        "age": num("Age (years)"),
        "male": df["Sex"].str.strip().eq("M").astype(int),
        # Used only for analysis, never as model inputs:
        "alsfrs_speech": num("ALSFRS-R_SpeechSubscore"),   # 4 = normal speech ... 0 = none
        "ref_f0_A": num("meanF0Hz_A"),                     # the dataset authors' own Praat
        "ref_jitter_A": num("localJitter_A"),              # measurements, to cross-check ours
    })


def main():
    meta = load_metadata()
    rows: dict[str, dict] = {}
    wavs = sorted(RAW.rglob("*.wav"))
    for i, path in enumerate(wavs, 1):
        m = FILE_RE.match(path.stem)
        if not m:
            print(f"skipping unrecognised file {path.name}")
            continue
        feats = task_features(m["task"], load_audio(path))
        rows.setdefault(m["id"], {"id": m["id"]}).update(feats)
        if i % 100 == 0:
            print(f"{i}/{len(wavs)} clips processed")

    for r in rows.values():
        r.update(pool_features(r))
    feats = pd.DataFrame(rows.values())
    df = meta.merge(feats, on="id", how="inner")
    missing = set(meta.id) - set(df.id)
    if missing:
        print(f"warning: {len(missing)} participants in metadata have no audio: {sorted(missing)[:10]}")
    df.to_csv(OUT, index=False)
    print(f"Wrote {OUT}: {len(df)} participants ({df.als.sum()} ALS, {(1 - df.als).sum()} HC), "
          f"{df.shape[1]} columns")


if __name__ == "__main__":
    main()
