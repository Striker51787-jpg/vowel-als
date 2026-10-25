"""v3 model search: v2 candidates + pretrained-embedding candidates.

Same honest design as experiments.py: all candidates are fixed in advance, and
the best one is chosen using only each outer fold's training people. The
reported AUC (nested_selection_auc) covers the whole search.

Embedding candidates: for each model (wav2vec2, wavlm) and layer in LAYERS,
average the clip embeddings over a person's 8 recordings, then standardise and
fit a strongly regularised logistic regression.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

import experiments as v2  # re-uses the data frame, v2 feature sets and models

HERE = Path(__file__).parent
SEED = 7
N_REPEATS = int(sys.argv[1]) if len(sys.argv) > 1 else 5
LAYERS = [3, 6, 9, 12]

df, y = v2.df, v2.y
FEATURE_SETS = dict(v2.FEATURE_SETS)
for name in ("wav2vec2", "wavlm"):
    z = np.load(HERE / "data" / f"emb_{name}.npz")
    ids, x = z["ids"], z["x"]
    for layer in LAYERS:
        per_person = pd.DataFrame(x[:, layer, :], index=ids).groupby(level=0).mean()
        per_person = per_person.reindex(df["id"]).to_numpy()
        cols = []
        for j in range(per_person.shape[1]):
            c = f"emb_{name}_L{layer}_{j}"
            df[c] = per_person[:, j]
            cols.append(c)
        FEATURE_SETS[f"emb_{name}_L{layer}"] = cols

MODELS = dict(v2.MODELS)
for C in (0.0003, 0.001, 0.003, 0.01):
    MODELS[f"emb_logreg_C{C}"] = Pipeline([("impute", SimpleImputer()), ("scale", StandardScaler()),
        ("clf", LogisticRegression(C=C, class_weight="balanced", max_iter=5000))])

# v2 candidates keep their v2 pairings; embeddings only meet the embedding models.
CONFIGS = list(v2.CONFIGS) + [(f, m) for f in FEATURE_SETS if f.startswith("emb_")
                              for m in MODELS if m.startswith("emb_logreg")]

# Rebind the shared helpers to the v3 tables.
v2.FEATURE_SETS, v2.MODELS = FEATURE_SETS, MODELS
score, inner_auc = v2.score, v2.inner_auc


def main():
    per_config = {}
    for fs, mn in CONFIGS:
        if not fs.startswith("emb_"):
            continue
        oof = np.zeros((N_REPEATS, len(y)))
        for r in range(N_REPEATS):
            for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEED + r).split(df, y):
                oof[r, te] = score(MODELS[mn], FEATURE_SETS[fs], tr, te)
        per_config[f"{fs} | {mn}"] = float(np.mean([roc_auc_score(y, o) for o in oof]))
        print(f"{per_config[f'{fs} | {mn}']:.3f}  {fs} | {mn}", flush=True)

    nested, chosen = [], []
    for r in range(N_REPEATS):
        oof = np.zeros(len(y))
        for k, (tr, te) in enumerate(StratifiedKFold(5, shuffle=True, random_state=100 + r).split(df, y)):
            best = max(CONFIGS, key=lambda c: inner_auc(c[0], c[1], tr, seed=r * 10 + k))
            chosen.append(" | ".join(best))
            oof[te] = score(MODELS[best[1]], FEATURE_SETS[best[0]], tr, te)
        nested.append(float(roc_auc_score(y, oof)))
        print(f"nested repeat {r}: AUC {nested[-1]:.3f}", flush=True)

    out = {"n_configs_tried": len(CONFIGS), "repeats": N_REPEATS,
           "nested_selection_auc_mean": float(np.mean(nested)), "nested_selection_auc_repeats": nested,
           "embedding_plain_cv_auc": dict(sorted(per_config.items(), key=lambda kv: -kv[1])),
           "selected_config_counts": pd.Series(chosen).value_counts().to_dict()}
    (HERE / "models" / "experiments_v3.json").write_text(json.dumps(out, indent=2))
    print(f"\n{len(CONFIGS)} candidates. NESTED-SELECTION AUC = {np.mean(nested):.3f} {np.round(nested, 3)}")


if __name__ == "__main__":
    main()
