"""Acoustic feature extraction shared by training (ml/train.py) and the scoring API.

Every clip is converted to 8 kHz mono first, because that is how the VOC-ALS
recordings were made. Using one function for both training and the app means
the model always sees features computed the same way.
"""
from __future__ import annotations

import numpy as np
import librosa
import parselmouth
from parselmouth.praat import call

SR = 8000  # VOC-ALS sample rate

VOWEL_TASKS = ["phonationA", "phonationE", "phonationI", "phonationO", "phonationU"]
RHYTHM_TASKS = ["rhythmPA", "rhythmTA", "rhythmKA"]
TASKS = VOWEL_TASKS + RHYTHM_TASKS

# "Clinical" features are ones speech clinicians already use for dysarthria.
VOWEL_CLINICAL = ["f0_mean", "f0_sd_st", "jitter_local", "shimmer_local", "hnr", "duration"]
RHYTHM_CLINICAL = ["ddk_rate", "ddk_cv", "pause_ratio", "intensity_sd"]
N_MFCC = 13
MFCC = [f"mfcc{i}_{s}" for i in range(1, N_MFCC + 1) for s in ("mean", "sd")]


def load_audio(path_or_buffer) -> np.ndarray:
    """Load any audio file as float32 mono at 8 kHz."""
    y, _ = librosa.load(path_or_buffer, sr=SR, mono=True)
    return y.astype(np.float32)


def trim_silence(y: np.ndarray, top_db: float = 30) -> np.ndarray:
    """Cut leading/trailing silence. Returns the input unchanged if it is all silence."""
    trimmed, _ = librosa.effects.trim(y, top_db=top_db)
    return trimmed if trimmed.size > 0 else y


def _spectral_vowel_features(snd) -> dict[str, float]:
    """Cepstral peak prominence (CPPS), the first two formants and spectral tilt.

    CPPS is a standard marker of dysphonia. F1/F2 describe tongue position, so
    they shrink when articulation weakens, as in bulbar ALS.
    """
    out = {"cpps": np.nan, "f1": np.nan, "f2": np.nan, "tilt_db": np.nan}
    try:
        ceps = call(snd, "To PowerCepstrogram", 60, 0.002, 4000, 50)
        out["cpps"] = call(ceps, "Get CPPS", "no", 0.02, 0.0005, 60, 330, 0.05,
                           "Parabolic", 0.001, 0, "Straight", "Robust")
    except Exception:
        pass
    try:
        formant = snd.to_formant_burg(time_step=0.01, max_number_of_formants=4,
                                      maximum_formant=4000, window_length=0.025)
        out["f1"] = call(formant, "Get quantile", 1, 0, 0, "Hertz", 0.5)
        out["f2"] = call(formant, "Get quantile", 2, 0, 0, "Hertz", 0.5)
    except Exception:
        pass
    try:
        spec = snd.to_spectrum()
        low = call(spec, "Get band energy", 0, 1000)
        high = call(spec, "Get band energy", 1000, 4000)
        out["tilt_db"] = float(10 * np.log10((high + 1e-12) / (low + 1e-12)))
    except Exception:
        pass
    return {k: float(v) for k, v in out.items()}


def pool_features(feats: dict[str, float]) -> dict[str, float]:
    """Average each measure across the 5 vowels (and across pa/ta/ka).

    One person's jitter on 5 vowels is 5 noisy looks at the same thing; the
    mean is steadier, and it turns ~100 columns into ~20 for a 153-person study.
    """
    out = {}
    for name in ["f0_mean", "f0_sd_st", "jitter_local", "shimmer_local", "hnr", "duration",
                 "voiced_fraction", "cpps", "f1", "f2", "tilt_db"]:
        vals = [feats.get(f"{t}__{name}", np.nan) for t in VOWEL_TASKS]
        out[f"vowels__{name}"] = float(np.nanmean(vals)) if np.any(np.isfinite(vals)) else np.nan
    for name in ["ddk_rate", "ddk_cv", "pause_ratio", "intensity_sd", "duration"]:
        vals = [feats.get(f"{t}__{name}", np.nan) for t in RHYTHM_TASKS]
        out[f"rhythm__{name}"] = float(np.nanmean(vals)) if np.any(np.isfinite(vals)) else np.nan
    # Vowel-space measures (tongue range): triangle area of /a/, /i/, /u/ in F1-F2, and F2i/F2u.
    try:
        (a1, a2), (i1, i2), (u1, u2) = [(feats[f"phonation{v}__f1"], feats[f"phonation{v}__f2"]) for v in "AIU"]
        out["vowels__vsa"] = float(abs(i1 * (a2 - u2) + a1 * (u2 - i2) + u1 * (i2 - a2)) / 2)
        out["vowels__f2i_f2u"] = float(i2 / u2)
    except (KeyError, ZeroDivisionError):
        out["vowels__vsa"] = out["vowels__f2i_f2u"] = np.nan
    return out


def pool_mfcc(feats: dict[str, float]) -> dict[str, float]:
    """Average each MFCC statistic over all 8 tasks (26 columns)."""
    return {f"mfccpool__{c}": float(np.nanmean([feats[f"{t}__{c}"] for t in TASKS]))
            for c in MFCC}


def vowel_features(y: np.ndarray) -> dict[str, float]:
    """Pitch, voice-stability and voice-quality measures for a sustained vowel."""
    y = trim_silence(y)
    snd = parselmouth.Sound(y.astype(np.float64), sampling_frequency=SR)
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=60, pitch_ceiling=500)
    f0 = pitch.selected_array["frequency"]
    f0 = f0[f0 > 0]

    feats = {"duration": len(y) / SR, "voiced_fraction": float(f0.size / max(len(pitch.selected_array["frequency"]), 1))}
    feats.update(_spectral_vowel_features(snd))
    if f0.size < 5:  # essentially no voicing detected
        feats.update(f0_mean=np.nan, f0_sd_st=np.nan, jitter_local=np.nan,
                     shimmer_local=np.nan, hnr=np.nan)
    else:
        feats["f0_mean"] = float(np.mean(f0))
        # Pitch variability in semitones, so men and women are comparable.
        feats["f0_sd_st"] = float(np.std(12 * np.log2(f0 / np.mean(f0))))
        points = call(snd, "To PointProcess (periodic, cc)", 60, 500)
        feats["jitter_local"] = call(points, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
        feats["shimmer_local"] = call([snd, points], "Get shimmer (local)",
                                      0, 0, 0.0001, 0.02, 1.3, 1.6)
        harm = snd.to_harmonicity_cc(time_step=0.01, minimum_pitch=60)
        feats["hnr"] = call(harm, "Get mean", 0, 0)
    return {k: float(v) for k, v in feats.items()}


def rhythm_features(y: np.ndarray) -> dict[str, float]:
    """Diadochokinetic (pa-pa-pa) measures: syllable rate, regularity, pauses."""
    y = trim_silence(y)
    hop = 80  # 10 ms
    rms = librosa.feature.rms(y=y, frame_length=320, hop_length=hop)[0]
    if rms.max() <= 0:
        return {k: np.nan for k in RHYTHM_CLINICAL}
    db = librosa.amplitude_to_db(rms, ref=rms.max())

    # Each syllable is a burst of energy; find the bursts as envelope peaks
    # at least 80 ms apart (faster than ~12 syllables/s is not humanly possible).
    env = np.convolve(rms, np.ones(5) / 5, mode="same")
    peaks = librosa.util.peak_pick(env, pre_max=4, post_max=4, pre_avg=10, post_avg=10,
                                   delta=0.05 * env.max(), wait=8)
    duration = len(y) / SR
    if len(peaks) >= 3:
        intervals = np.diff(peaks) * hop / SR
        ddk_rate = (len(peaks) - 1) / (intervals.sum())
        ddk_cv = float(np.std(intervals) / np.mean(intervals))
    else:
        ddk_rate, ddk_cv = np.nan, np.nan

    return {
        "ddk_rate": float(ddk_rate),
        "ddk_cv": ddk_cv,
        # Share of the clip spent more than 25 dB below the loudest part.
        "pause_ratio": float(np.mean(db < -25)),
        "intensity_sd": float(np.std(db[db > -40])) if np.any(db > -40) else np.nan,
        "n_syllables": float(len(peaks)),
        "duration": duration,
    }


def mfcc_features(y: np.ndarray) -> dict[str, float]:
    """Mean and spread of 13 MFCCs (a generic summary of the sound's spectrum)."""
    y = trim_silence(y)
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=N_MFCC, n_fft=256, hop_length=80)
    out = {}
    for i in range(N_MFCC):
        out[f"mfcc{i + 1}_mean"] = float(m[i].mean())
        out[f"mfcc{i + 1}_sd"] = float(m[i].std())
    return out


def task_features(task: str, y: np.ndarray) -> dict[str, float]:
    """All features for one task's clip, keys prefixed with the task name."""
    if task in VOWEL_TASKS:
        feats = vowel_features(y)
    elif task in RHYTHM_TASKS:
        feats = rhythm_features(y)
    else:
        raise ValueError(f"unknown task {task!r}")
    feats.update(mfcc_features(y))
    return {f"{task}__{k}": v for k, v in feats.items()}


def feature_columns(tasks: list[str], include_mfcc: bool) -> list[str]:
    """Column names the model uses for a given task list and feature set."""
    cols = []
    for t in tasks:
        cols += [f"{t}__{f}" for f in (VOWEL_CLINICAL if t in VOWEL_TASKS else RHYTHM_CLINICAL)]
        if include_mfcc:
            cols += [f"{t}__{f}" for f in MFCC]
    return cols


def quality_check(y: np.ndarray, task: str) -> dict:
    """Fast checks the app runs on every clip before scoring.

    Returns {"ok": bool, "reason": str | None, ...measurements}.
    """
    duration = len(y) / SR
    peak = float(np.max(np.abs(y))) if y.size else 0.0
    voiced_dur = len(trim_silence(y)) / SR if y.size else 0.0

    # Noise floor = the first 0.3 s. The app starts recording ~0.5 s before it
    # tells the user to speak, so that stretch is room sound only. (Trimming
    # can't find the silence in a noisy room, which is exactly when it matters.)
    lead = int(0.3 * SR)
    snr_db = None
    if len(y) > 2 * lead:
        noise = np.sqrt(np.mean(y[:lead] ** 2)) + 1e-9
        frames = librosa.feature.rms(y=y[lead:], frame_length=320, hop_length=80)[0]
        signal = np.percentile(frames, 90) + 1e-9
        snr_db = float(20 * np.log10(signal / noise))

    min_dur = 3.0 if task in VOWEL_TASKS else 2.0
    reason = None
    if voiced_dur < min_dur:
        reason = f"Too short: we heard about {voiced_dur:.1f} s of sound. Aim for at least {min_dur:.0f} seconds."
    elif peak < 0.02:
        reason = "Too quiet. Hold the phone about 20 cm (8 inches) from your mouth and speak at a normal volume."
    elif np.mean(np.abs(y) > 0.99) > 0.001:
        reason = "Too loud: the sound is distorting. Move the phone a little farther away."
    elif snr_db is not None and snr_db < 15:
        reason = "Too much background noise. Try a quieter room."
    return {"ok": reason is None, "reason": reason, "duration": duration,
            "voiced_duration": voiced_dur, "peak": peak, "snr_db": snr_db}
