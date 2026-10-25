"""Train the deployed model and write the final evaluation report.

Model: logistic regression on pooled clinical + pooled MFCC features, trained
on all 153 participants. Chosen after the 82-candidate search in
experiments.py / experiments_v3.py. It was the best hand-built-feature
candidate, and it performs about as well as the pretrained-embedding
candidates without needing PyTorch on the server.

Honest numbers: repeated nested CV (the inner loop tunes C), so the AUC here
is for the whole "tune and fit" procedure on people it never saw. Because this
model was picked from many candidates, the report also carries the nested
AUC of the full candidate search (experiments_v3.json), which is the number
to quote as the overall estimate.
"""
import json
import platform
from datetime import date
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from features import MFCC, TASKS, pool_mfcc
from train import band_of, bootstrap_auc_ci, choose_bands, sens_spec

HERE = Path(__file__).parent
MODELS = HERE / "models"
SEED, N_REPEATS, VERSION = 11, 20, "2.0.0"

df = pd.read_csv(HERE / "data" / "features.csv")
y = df["als"].to_numpy()
for i, row in df.iterrows():
    for k, v in pool_mfcc(row.to_dict()).items():
        df.loc[i, k] = v
POOLED = [c for c in df.columns if c.startswith(("vowels__", "rhythm__"))]
COLS = POOLED + [f"mfccpool__{c}" for c in MFCC]


def make_model(seed):
    pipe = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler()),
                     ("clf", LogisticRegression(class_weight="balanced", max_iter=5000))])
    return GridSearchCV(pipe, {"clf__C": [0.003, 0.01, 0.03, 0.1]},
                        cv=StratifiedKFold(5, shuffle=True, random_state=seed), scoring="roc_auc")


def nested(cols, features=df):
    aucs, oof_all = [], np.zeros((N_REPEATS, len(y)))
    for r in range(N_REPEATS):
        for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEED + r).split(features, y):
            m = make_model(SEED + r).fit(features.iloc[tr][cols], y[tr])
            oof_all[r, te] = m.predict_proba(features.iloc[te][cols])[:, 1]
        aucs.append(roc_auc_score(y, oof_all[r]))
    return aucs, oof_all.mean(axis=0)


def main():
    aucs, oof = nested(COLS)
    ci = bootstrap_auc_ci(y, oof)
    bands = choose_bands(y, oof)
    final = make_model(SEED).fit(df[COLS], y)
    bands_counts = {grp: pd.Series([band_of(s, bands) for s in oof[y == lab]])
                    .value_counts().reindex(["low", "borderline", "elevated"], fill_value=0).to_dict()
                    for grp, lab in (("als", 1), ("controls", 0))}
    fpr, tpr, _ = roc_curve(y, oof)

    baselines = {}
    for name, cols in {"age_sex_only": ["age", "male"],
                       "single_vowel_A_clinical": ["phonationA__jitter_local", "phonationA__f0_sd_st",
                                                              "phonationA__hnr", "phonationA__shimmer_local",
                                                              "phonationA__duration", "phonationA__f0_mean"]}.items():
        a, _ = nested(cols)
        baselines[name] = {"nested_cv_auc_mean": float(np.mean(a))}

    v1 = json.load(open(MODELS / "evaluation_report_v1_predeclared.json"))["variants"]["primary_8task_clinical"]
    search = json.load(open(MODELS / "experiments_v3.json"))
    report = {
        "model_version": VERSION, "generated": date.today().isoformat(),
        "dataset": {"name": "VOC-ALS", "doi": "10.1038/s41597-024-03597-2", "n_participants": len(df),
                    "n_als": int(y.sum()), "n_controls": int((1 - y).sum())},
        "headline": {
            "overall_estimate_auc": search["nested_selection_auc_mean"],
            "overall_estimate_explained": f"Nested AUC of the whole search over {search['n_configs_tried']} candidate "
                                          "models (selection done inside each fold). Use this as the honest estimate.",
            "deployed_model_nested_cv_auc": float(np.mean(aucs)),
            "deployed_model_auc_95ci_bootstrap": ci,
            "deployed_model_auc_repeat_range": [float(min(aucs)), float(max(aucs))],
        },
        "deployed_model": {"features": "per-vowel and per-syllable clinical measures averaged across tasks + "
                                       "MFCC averaged across 8 tasks", "n_features": len(COLS),
                           "classifier": "L2 logistic regression, class-balanced", "chosen_C": float(final.best_params_["clf__C"]),
                           "training": f"all {len(df)} participants", "nested_cv_repeats": N_REPEATS},
        "risk_bands": {**bands, "counts_out_of_fold": bands_counts,
                       "at_low_max": sens_spec(y, oof, bands["low_max"]),
                       "at_elevated_min": sens_spec(y, oof, bands["elevated_min"]),
                       "at_0.5": sens_spec(y, oof, 0.5)},
        "roc_curve_out_of_fold": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
        "baselines": baselines,
        "history": {
            "v1_predeclared_8task_clinical": {"nested_cv_auc": v1["nested_cv_auc_mean"], "heldout_auc": v1["heldout_auc"],
                                              "heldout_n": 31, "heldout_95ci": v1["heldout_auc_95ci_bootstrap"],
                                              "note": "Declared before seeing results; the 31-person held-out test was too small to be informative."},
            "candidates_tried": search["n_configs_tried"],
            "best_single_candidate_plain_cv_auc": max(list(search["embedding_plain_cv_auc"].values())),
            "note": "Best-of-N plain-CV scores are optimistic; only the nested-selection AUC is quoted as the estimate.",
        },
        "environment": {"python": platform.python_version(), "sklearn": sklearn.__version__, "seed": SEED},
    }
    (MODELS / "evaluation_report.json").write_text(json.dumps(report, indent=2))
    joblib.dump({"pipeline": final.best_estimator_, "columns": COLS, "tasks": TASKS, "bands": bands,
                 "version": VERSION}, MODELS / "model.joblib")
    h = report["headline"]
    print(f"overall estimate {h['overall_estimate_auc']:.3f}; deployed model nested AUC "
          f"{h['deployed_model_nested_cv_auc']:.3f} CI {np.round(ci, 3)}; C={final.best_params_['clf__C']}")
    print("bands", {k: round(v, 3) for k, v in bands.items() if isinstance(v, float)}, bands_counts)
    print("baselines", baselines)


if __name__ == "__main__":
    main()
