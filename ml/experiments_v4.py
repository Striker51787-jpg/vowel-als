"""v4: add two ensemble candidates to the v3 search, defined by rule (not by winner).

  ens_all         = average probability of C=0.01 logistic regressions over the
                    hand-built feature set AND every embedding set (2 models x 4 layers)
  ens_embeddings  = the same, embeddings only

No component is picked by score; the rule is fixed here before any run. The
nested-selection AUC then covers the whole search (v3 candidates + these two).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold

import experiments_v3 as v3

HERE = Path(__file__).parent
SEED, N_REPEATS = 7, v3.N_REPEATS
df, y = v3.df, v3.y
FS, MODELS = v3.FEATURE_SETS, v3.MODELS

EMB = [(fs, "emb_logreg_C0.01") for fs in FS if fs.startswith("emb_")]
HAND = [("pooled_clinical+mfcc_pooled", "logreg_C0.01")]
ENS = {"ens_all": HAND + EMB, "ens_embeddings": EMB}
CONFIGS = list(v3.CONFIGS) + [("ENS", n) for n in ENS]


def score_cfg(cfg, tr, te):
    if cfg[0] == "ENS":
        return np.mean([v3.score(MODELS[m], FS[f], tr, te) for f, m in ENS[cfg[1]]], axis=0)
    return v3.score(MODELS[cfg[1]], FS[cfg[0]], tr, te)


def inner_auc(cfg, tr, seed):
    aucs = []
    for itr, ite in StratifiedKFold(5, shuffle=True, random_state=seed).split(tr, y[tr]):
        aucs.append(roc_auc_score(y[tr][ite], score_cfg(cfg, tr[itr], tr[ite])))
    return float(np.mean(aucs))


def main():
    plain = {}
    for name in ENS:
        oof = np.zeros((N_REPEATS, len(y)))
        for r in range(N_REPEATS):
            for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEED + r).split(df, y):
                oof[r, te] = score_cfg(("ENS", name), tr, te)
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

    out = {"n_configs_tried": len(CONFIGS), "repeats": N_REPEATS, "ensemble_plain_cv_auc": plain,
           "nested_selection_auc_mean": float(np.mean(nested)), "nested_selection_auc_repeats": nested,
           "selected_config_counts": pd.Series(chosen).value_counts().to_dict()}
    (HERE / "models" / "experiments_v4.json").write_text(json.dumps(out, indent=2))
    print(f"\n{len(CONFIGS)} candidates. NESTED-SELECTION AUC = {np.mean(nested):.3f} {np.round(nested, 3)}")


if __name__ == "__main__":
    main()
