"""v2 model search with honest evaluation.

Every candidate (feature set x model x hyperparameters) is listed in CONFIGS
below, up front. For each outer fold, the best candidate is chosen using ONLY
that fold's training people (inner 5-fold CV), refit, and scored on the
people it never saw. The outer AUC therefore measures the whole procedure
"search over all CONFIGS and pick the best", including the selection step,
so adding candidates cannot inflate it the way tuning on a test set would.

All 153 participants are used; there is no fixed held-out set, because the
v1 held-out set (31 people) was already looked at and is too small to be a
useful test anyway.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

from features import TASKS, feature_columns

HERE = Path(__file__).parent
SEED = 7
N_REPEATS = int(sys.argv[1]) if len(sys.argv) > 1 else 5

df = pd.read_csv(HERE / "data" / "features.csv")
y = df["als"].to_numpy()

pooled = [c for c in df.columns if c.startswith(("vowels__", "rhythm__"))]
mfcc_pool = []
for stat in ("mean", "sd"):
    for i in range(1, 14):
        col = f"mfcc{i}_{stat}_pooled"
        df[col] = df[[f"{t}__mfcc{i}_{stat}" for t in TASKS]].mean(axis=1)
        mfcc_pool.append(col)

FEATURE_SETS = {
    "pooled_clinical": pooled,
    "per_task_clinical": feature_columns(TASKS, False),
    "pooled+per_task": pooled + feature_columns(TASKS, False),
    "pooled_clinical+mfcc_pooled": pooled + mfcc_pool,
    "all_tasks_mfcc": feature_columns(TASKS, True),
}


def pipe(clf, scale=True):
    steps = [("impute", SimpleImputer(strategy="median"))]
    if scale:
        steps.append(("scale", StandardScaler()))
    return Pipeline(steps + [("clf", clf)])


MODELS = {}
for C in (0.01, 0.1, 1):
    MODELS[f"logreg_C{C}"] = pipe(LogisticRegression(C=C, class_weight="balanced", max_iter=5000))
for C in (0.3, 1, 3):
    MODELS[f"svm_rbf_C{C}"] = pipe(SVC(C=C, class_weight="balanced", probability=True, random_state=SEED))
for d in (3, None):
    MODELS[f"rf_depth{d}"] = pipe(RandomForestClassifier(
        300, max_depth=d, min_samples_leaf=3, class_weight="balanced", random_state=SEED, n_jobs=-1), scale=False)
    MODELS[f"extratrees_depth{d}"] = pipe(ExtraTreesClassifier(
        300, max_depth=d, min_samples_leaf=3, class_weight="balanced", random_state=SEED, n_jobs=-1), scale=False)

CONFIGS = [(f, m) for f in FEATURE_SETS for m in MODELS]


def score(model, cols, tr, te):
    m = clone(model).fit(df.iloc[tr][cols], y[tr])
    return m.predict_proba(df.iloc[te][cols])[:, 1]


def inner_auc(fs, mn, tr, seed):
    cols, aucs = FEATURE_SETS[fs], []
    for itr, ite in StratifiedKFold(5, shuffle=True, random_state=seed).split(tr, y[tr]):
        aucs.append(roc_auc_score(y[tr][ite], score(MODELS[mn], cols, tr[itr], tr[ite])))
    return float(np.mean(aucs))


def main():
    # 1) Plain cross-validated AUC of every candidate (for the report; NOT used to pick the headline).
    per_config = {}
    for fs, mn in CONFIGS:
        oof = np.zeros((N_REPEATS, len(y)))
        for r in range(N_REPEATS):
            for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEED + r).split(df, y):
                oof[r, te] = score(MODELS[mn], FEATURE_SETS[fs], tr, te)
        per_config[f"{fs} | {mn}"] = float(np.mean([roc_auc_score(y, o) for o in oof]))
        print(f"{per_config[f'{fs} | {mn}']:.3f}  {fs} | {mn}", flush=True)

    # 2) The honest number: select the best candidate inside each outer training set.
    nested, chosen = [], []
    for r in range(N_REPEATS):
        oof = np.zeros(len(y))
        for k, (tr, te) in enumerate(StratifiedKFold(5, shuffle=True, random_state=100 + r).split(df, y)):
            best = max(CONFIGS, key=lambda c: inner_auc(c[0], c[1], tr, seed=r * 10 + k))
            chosen.append(" | ".join(best))
            oof[te] = score(MODELS[best[1]], FEATURE_SETS[best[0]], tr, te)
        nested.append(float(roc_auc_score(y, oof)))
        print(f"nested repeat {r}: AUC {nested[-1]:.3f}", flush=True)

    out = {"n_configs_tried": len(CONFIGS), "repeats": N_REPEATS, "seed": SEED,
           "nested_selection_auc_mean": float(np.mean(nested)), "nested_selection_auc_repeats": nested,
           "plain_cv_auc_per_config": dict(sorted(per_config.items(), key=lambda kv: -kv[1])),
           "selected_config_counts": pd.Series(chosen).value_counts().to_dict()}
    (HERE / "models" / "experiments_v2.json").write_text(json.dumps(out, indent=2))
    print(f"\n{len(CONFIGS)} candidates. NESTED-SELECTION AUC = {np.mean(nested):.3f} (repeats {np.round(nested, 3)})")


if __name__ == "__main__":
    main()
