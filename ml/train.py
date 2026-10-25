"""Train and evaluate the ALS voice-screen model. Writes:

  models/model.joblib            the deployed model (what the API loads)
  models/split.json              which participants are in the locked held-out set
  models/evaluation_report.json  every number the app, README and video may quote

Evaluation design (decided before looking at any results):
  * One row per participant, so no person can appear in both train and test.
  * 20% of participants are locked away as a held-out set, used exactly once.
  * On the other 80%, repeated nested cross-validation gives the headline AUC:
    the inner loop tunes regularisation, the outer loop scores unseen people.
  * Scaling and imputation live inside the sklearn Pipeline, so they are only
    ever fit on training folds.
  * PRIMARY model = all 8 tasks, clinical features. Everything else is a
    comparison, reported but never swapped in because it scored higher.
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
from sklearn.metrics import brier_score_loss, confusion_matrix, roc_auc_score, roc_curve
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from features import TASKS, feature_columns

SEED = 42
N_REPEATS = 10
HERE = Path(__file__).parent
MODELS = HERE / "models"
MODEL_VERSION = "1.0.0"

VARIANTS = {
    "primary_8task_clinical": dict(tasks=TASKS, mfcc=False, demo=False),
    "8task_clinical_plus_mfcc": dict(tasks=TASKS, mfcc=True, demo=False),
    "single_vowel_A_clinical": dict(tasks=["phonationA"], mfcc=False, demo=False),
    "single_vowel_A_plus_mfcc": dict(tasks=["phonationA"], mfcc=True, demo=False),
    "age_sex_only_baseline": dict(tasks=[], mfcc=False, demo=True),
}
PRIMARY = "primary_8task_clinical"


def columns(v: dict) -> list[str]:
    return feature_columns(v["tasks"], v["mfcc"]) + (["age", "male"] if v["demo"] else [])


def make_model(seed: int) -> GridSearchCV:
    pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=5000)),
    ])
    inner = StratifiedKFold(5, shuffle=True, random_state=seed)
    return GridSearchCV(pipe, {"clf__C": np.logspace(-3, 1, 9)}, cv=inner, scoring="roc_auc")


def nested_cv(X: pd.DataFrame, y: np.ndarray) -> tuple[list[float], np.ndarray]:
    """Repeated nested CV. Returns per-repeat AUCs and OOF scores averaged over repeats."""
    aucs, oof_all = [], np.zeros((N_REPEATS, len(y)))
    for r in range(N_REPEATS):
        outer = StratifiedKFold(5, shuffle=True, random_state=SEED + r)
        for tr, te in outer.split(X, y):
            m = make_model(SEED + r).fit(X.iloc[tr], y[tr])
            oof_all[r, te] = m.predict_proba(X.iloc[te])[:, 1]
        aucs.append(roc_auc_score(y, oof_all[r]))
    return aucs, oof_all.mean(axis=0)


def bootstrap_auc_ci(y, s, n=2000, seed=SEED) -> list[float]:
    rng = np.random.default_rng(seed)
    vals = []
    for _ in range(n):
        idx = rng.integers(0, len(y), len(y))
        if len(np.unique(y[idx])) == 2:
            vals.append(roc_auc_score(y[idx], s[idx]))
    return [float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))]


def sens_spec(y, s, t) -> dict:
    pred = (s >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {"threshold": float(t), "tp": int(tp), "fn": int(fn), "tn": int(tn), "fp": int(fp),
            "sensitivity": tp / (tp + fn) if tp + fn else None,
            "specificity": tn / (tn + fp) if tn + fp else None}


def choose_bands(y, s) -> dict:
    """Band cut-offs from development-set OOF scores (never from held-out data).

    Low/Borderline cut: highest threshold that still catches >= 90% of ALS.
    Borderline/Elevated cut: lowest threshold that keeps >= 80% of controls below it.
    """
    fpr, tpr, thr = roc_curve(y, s)
    thr = np.clip(thr, 0, 1)
    low = float(thr[np.argmax(tpr >= 0.90)])
    high = float(thr[np.argmax(1 - fpr <= 0.80) - 1]) if np.any(1 - fpr <= 0.80) else low
    if high < low:  # model can't separate that well: collapse to one cut
        low = high = (low + high) / 2
    return {"low_max": low, "elevated_min": high,
            "rule": "Low < low_max <= Borderline < elevated_min <= Elevated",
            "chosen_on": "development-set nested-CV out-of-fold scores"}


def band_of(score: float, bands: dict) -> str:
    if score < bands["low_max"]:
        return "low"
    return "elevated" if score >= bands["elevated_min"] else "borderline"


def main(features_csv: Path, out_dir: Path):
    global MODELS
    MODELS = out_dir
    df = pd.read_csv(features_csv)
    y_all = df["als"].to_numpy()

    dev_idx, held_idx = train_test_split(np.arange(len(df)), test_size=0.2, stratify=y_all,
                                         random_state=SEED)
    dev, held = df.iloc[dev_idx].reset_index(drop=True), df.iloc[held_idx].reset_index(drop=True)
    assert set(dev.id).isdisjoint(held.id), "participant leak between dev and held-out"
    MODELS.mkdir(exist_ok=True)
    (MODELS / "split.json").write_text(json.dumps(
        {"seed": SEED, "dev_ids": sorted(dev.id), "heldout_ids": sorted(held.id)}, indent=1))

    report = {
        "model_version": MODEL_VERSION,
        "generated": date.today().isoformat(),
        "dataset": {"name": "VOC-ALS", "doi": "10.1038/s41597-024-03597-2",
                    "n_participants": len(df), "n_als": int(y_all.sum()),
                    "n_controls": int((1 - y_all).sum())},
        "split": {"development": {"n": len(dev), "als": int(dev.als.sum())},
                  "heldout": {"n": len(held), "als": int(held.als.sum())},
                  "participant_overlap": 0},
        "method": {"classifier": "L2 logistic regression, class-balanced",
                   "tuning": "inner 5-fold CV over C in logspace(-3, 1, 9)",
                   "headline": f"outer 5-fold CV repeated {N_REPEATS}x on the development set",
                   "primary_model": PRIMARY, "seed": SEED},
        "variants": {},
        "environment": {"python": platform.python_version(), "sklearn": sklearn.__version__},
    }

    for name, v in VARIANTS.items():
        cols = columns(v)
        print(f"\n== {name} ({len(cols)} features)")
        aucs, oof = nested_cv(dev[cols], dev.als.to_numpy())
        final = make_model(SEED).fit(dev[cols], dev.als.to_numpy())
        hs = final.predict_proba(held[cols])[:, 1]
        res = {
            "n_features": len(cols),
            "nested_cv_auc_mean": float(np.mean(aucs)),
            "nested_cv_auc_repeat_range": [float(min(aucs)), float(max(aucs))],
            "nested_cv_auc_95ci_bootstrap": bootstrap_auc_ci(dev.als.to_numpy(), oof),
            "heldout_auc": float(roc_auc_score(held.als, hs)),
            "heldout_auc_95ci_bootstrap": bootstrap_auc_ci(held.als.to_numpy(), hs),
        }
        print(json.dumps(res, indent=1))

        if name == PRIMARY:
            bands = choose_bands(dev.als.to_numpy(), oof)
            fpr, tpr, thr = roc_curve(held.als, hs)
            res.update({
                "chosen_C": float(final.best_params_["clf__C"]),
                "heldout_at_0.5": sens_spec(held.als.to_numpy(), hs, 0.5),
                "bands": bands,
                "heldout_at_low_max": sens_spec(held.als.to_numpy(), hs, bands["low_max"]),
                "heldout_at_elevated_min": sens_spec(held.als.to_numpy(), hs, bands["elevated_min"]),
                "heldout_band_counts": {
                    grp: pd.Series([band_of(s, bands) for s in hs[held.als.to_numpy() == lab]])
                    .value_counts().reindex(["low", "borderline", "elevated"], fill_value=0).to_dict()
                    for grp, lab in (("als", 1), ("controls", 0))},
                "heldout_brier": float(brier_score_loss(held.als, hs)),
                "heldout_roc_curve": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
                # Confound check: does the score still separate groups within each sex?
                "dev_oof_auc_by_sex": {
                    sex: float(roc_auc_score(dev.als[m], oof[m])) if dev.als[m].nunique() == 2 else None
                    for sex, m in (("male", dev.male == 1), ("female", dev.male == 0))},
                "dev_oof_score_age_correlation_controls":
                    float(np.corrcoef(dev.age[dev.als == 0], oof[dev.als == 0])[0, 1]),
            })
            clf = final.best_estimator_.named_steps["clf"]
            coefs = pd.Series(clf.coef_[0], index=cols).sort_values(key=abs, ascending=False)
            res["top_features"] = [{"feature": f, "std_coef": float(c)} for f, c in coefs.head(15).items()]
            joblib.dump({"pipeline": final.best_estimator_, "columns": cols, "tasks": v["tasks"],
                         "bands": bands, "version": MODEL_VERSION}, MODELS / "model.joblib")
        report["variants"][name] = res

    (MODELS / "evaluation_report.json").write_text(json.dumps(report, indent=2))
    p = report["variants"][PRIMARY]
    print(f"\nPRIMARY: nested-CV AUC {p['nested_cv_auc_mean']:.3f} "
          f"CI {p['nested_cv_auc_95ci_bootstrap']}, held-out AUC {p['heldout_auc']:.3f}")


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", type=Path, default=HERE / "data" / "features.csv")
    ap.add_argument("--out", type=Path, default=MODELS)
    a = ap.parse_args()
    main(a.features, a.out)
