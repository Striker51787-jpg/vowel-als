"""v5: add per-task late-fusion candidates to the v3 search.

Late fusion: one logistic regression per task (using only that task's features), then the
8 predicted probabilities are averaged. Four candidates are defined up front (clinical vs
clinical+MFCC, C in {0.01, 0.1}); nothing is picked by score. The nested-selection AUC
covers the whole search (v3 candidates + these four).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold

import experiments_v3 as v3
from features import TASKS

HERE = Path(__file__).parent
SEED, N_REPEATS = 7, v3.N_REPEATS
df, y = v3.df, v3.y
FS, MODELS = v3.FEATURE_SETS, v3.MODELS

PER_TASK = {}
for t in TASKS:
    clin = [c for c in df.columns if c.startswith(f"{t}__") and "__mfcc" not in c]
    mf = [c for c in df.columns if c.startswith(f"{t}__mfcc")]
    PER_TASK[t] = (clin, clin + mf)

FUSION = {
    "fusion_clinical_C0.01": (0, "logreg_C0.01"), "fusion_clinical_C0.1": (0, "logreg_C0.1"),
    "fusion_clinical+mfcc_C0.01": (1, "logreg_C0.01"), "fusion_clinical+mfcc_C0.1": (1, "logreg_C0.1"),
}
CONFIGS = list(v3.CONFIGS) + [("FUSION", n) for n in FUSION]


def score_cfg(cfg, tr, te):
    if cfg[0] == "FUSION":
        which, model = FUSION[cfg[1]]
        return np.mean([v3.score(MODELS[model], PER_TASK[t][which], tr, te) for t in TASKS], axis=0)
    return v3.score(MODELS[cfg[1]], FS[cfg[0]], tr, te)


def inner_auc(cfg, tr, seed):
    aucs = []
    for itr, ite in StratifiedKFold(5, shuffle=True, random_state=seed).split(tr, y[tr]):
        aucs.append(roc_auc_score(y[tr][ite], score_cfg(cfg, tr[itr], tr[ite])))
    return float(np.mean(aucs))


def main():
    plain = {}
    for name in FUSION:
        oof = np.zeros((N_REPEATS, len(y)))
        for r in range(N_REPEATS):
            for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEED + r).split(df, y):
                oof[r, te] = score_cfg(("FUSION", name), tr, te)
        plain[name] = float(np.mean([roc_auc_score(y, o) for o in oof]))
        print(f"plain CV AUC {plain[name]:.3f}  {name}", flush=True)

    nested, chosen = [], []
    for r in range(N_REPEATS):
        oof = np.zeros(len(y))
        for k, (tr, te) in enumerate(StratifiedKFold(5, shuffle=True, random_state=100 + r).split(df, y)):
            best = max(CONFIGS, key=lambda c: inner_auc(c, tr, seed=r * 10 + k))
            chosen.append(" | ".join(best))
            oof[te] = score_cfg(best, tr, te)
        nested.append(float(roc_auc_score(y, oof)))
        print(f"nested repeat {r}: AUC {nested[-1]:.3f}", flush=True)

    out = {"n_configs_tried": len(CONFIGS), "repeats": N_REPEATS, "fusion_plain_cv_auc": plain,
           "nested_selection_auc_mean": float(np.mean(nested)), "nested_selection_auc_repeats": nested,
           "selected_config_counts": pd.Series(chosen).value_counts().to_dict()}
    (HERE / "models" / "experiments_v5.json").write_text(json.dumps(out, indent=2))
    print(f"\n{len(CONFIGS)} candidates. NESTED-SELECTION AUC = {np.mean(nested):.3f} {np.round(nested, 3)}", flush=True)


if __name__ == "__main__":
    main()
