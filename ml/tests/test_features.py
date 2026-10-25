"""Sanity checks on synthetic signals whose correct answers we know in advance."""
import numpy as np
import pytest

from features import SR, quality_check, rhythm_features, vowel_features

rng = np.random.default_rng(0)


def harmonic_tone(f0, seconds, amp=0.3):
    t = np.arange(int(seconds * SR)) / SR
    y = sum(np.sin(2 * np.pi * f0 * k * t) / k for k in range(1, 6))
    return (amp * y / np.max(np.abs(y))).astype(np.float32)


def with_silence(y, seconds=0.5):
    pad = (rng.normal(0, 1e-4, int(seconds * SR))).astype(np.float32)
    return np.concatenate([pad, y, pad])


def syllable_train(rate, seconds):
    """Short 'pa' bursts: a 60 ms tone with a sharp attack, `rate` times per second."""
    y = np.zeros(int(seconds * SR), dtype=np.float32)
    burst = harmonic_tone(140, 0.06) * np.hanning(int(0.06 * SR)).astype(np.float32)
    for start in np.arange(0, seconds - 0.1, 1 / rate):
        i = int(start * SR)
        y[i:i + burst.size] += burst
    return y


def test_vowel_pitch_and_stability():
    f = vowel_features(harmonic_tone(150, 4))
    assert f["f0_mean"] == pytest.approx(150, abs=2)
    assert f["jitter_local"] < 0.005  # a perfect tone has almost no jitter
    assert f["hnr"] > 20               # and is almost all harmonic energy


def test_ddk_rate():
    f = rhythm_features(syllable_train(rate=6, seconds=4))
    assert f["ddk_rate"] == pytest.approx(6, abs=0.5)
    assert f["ddk_cv"] < 0.15  # evenly spaced syllables
    assert f["pause_ratio"] > 0.2  # gaps between the short bursts


def test_quality_passes_good_clip():
    assert quality_check(with_silence(harmonic_tone(150, 4)), "phonationA")["ok"]


def test_quality_rejects_short_quiet_and_noisy():
    assert not quality_check(with_silence(harmonic_tone(150, 1)), "phonationA")["ok"]
    assert not quality_check(with_silence(harmonic_tone(150, 4, amp=0.005)), "phonationA")["ok"]
    noisy = with_silence(harmonic_tone(150, 4))
    noisy = noisy + rng.normal(0, 0.08, noisy.size).astype(np.float32)
    assert not quality_check(noisy, "phonationA")["ok"]
