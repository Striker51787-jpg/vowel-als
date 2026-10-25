# Vowel

**Vowel** is a phone app that records eight short voice tasks and reports whether the voice shows patterns
that are more common in people with ALS. It is a **research screening prototype, not a
diagnostic tool**. It cannot tell you whether you have ALS.

> Status: working prototype. The backend (feature extraction, model, scoring API) is tested, and the
> phone app (`app/`) has been run on an iPhone through Expo Go against a local scoring server.
> It is not deployed to a public server or the App Store.

## Why

In one study of 1,405 ALS patients, the median time from first symptom to diagnosis was 11 months
(interquartile range 6 to 20 months; Falcão de Campos et al., *Frontiers in Neurology*, 2023,
doi:10.3389/fneur.2022.1064619). Voice changes can be an early sign, and a recording takes a minute
on a phone. The question this project asks is how much of that signal a simple screen can actually
pick up.

## Data

[VOC-ALS](https://www.synapse.org/Synapse:syn53009474) — Dubbioso et al., *Scientific Data* 2024,
doi:10.1038/s41597-024-03597-2. 153 Italian speakers (102 ALS, 51 healthy controls), eight
recordings each: sustained vowels /a e i o u/ and the syllables /pa/, /ta/, /ka/ repeated as fast
as possible. Recorded on one smartphone, 8 kHz, in a quiet clinic room. The data is **not**
included in this repository (Synapse terms of use); download it with `ml/download.py`.

## How it works

1. **Features** (`ml/features.py`): pitch, pitch variability, jitter, shimmer, harmonics-to-noise,
   cepstral peak prominence, formants and vowel space, syllable rate and regularity, pause ratio,
   and MFCCs. Measures are averaged across the five vowels and the three syllable tasks.
2. **Model** (`ml/train_final.py`): logistic regression with the regularisation strength tuned
   inside cross-validation.
3. **Risk bands:** scores map to *Low*, *Borderline* or *Elevated*. The cut-offs come from
   out-of-fold predictions. The app never shows a percentage.
4. **Server** (`api/main.py`): a FastAPI service the app sends recordings to. It converts audio to
   8 kHz mono, checks quality, computes the same features as training and returns the band. Audio is
   processed in memory and never stored.

## Results

Every number below is from `ml/models/evaluation_report.json`.

- **Overall honest estimate: AUC ≈ 0.68.** This is the nested-cross-validation AUC of the whole
  search over 82 candidate models, where the best candidate is chosen inside each fold.
- The deployed model alone scores AUC 0.71 (95% CI 0.64–0.80) in repeated nested CV. Because it
  was picked from many candidates, the 0.68 figure is the one to trust.
- Age and sex alone give AUC 0.39 (chance), so the model is not just detecting age or sex.
- The pre-declared first model (all eight tasks, clinical features) scored 0.67 nested-CV and 0.58 on
  a 31-person held-out set (95% CI 0.37–0.78), too small to be informative.

AUC 0.5 is a coin flip and 1.0 is perfect. About 0.7 means the voice carries a real but weak
signal. It is not accurate enough to use medically.

## Limitations

- Only 153 people, from one hospital in Italy and in one language.
- ALS versus healthy controls only. It was not tested against other speech or neurological
  conditions, so it cannot say a voice change is *due to ALS*.
- All recordings used one phone in a quiet room. Other microphones, rooms and phone models are
  unvalidated.
- Accuracy was estimated by cross-validation on the same dataset, not on an independent cohort.
- Many participants with ALS have mild speech changes, which limits what any voice screen can detect.

## Privacy

Audio is sent to the scoring server only to be scored. The server reads it in memory (Android
`.m4a` files pass through a temporary file that is deleted immediately) and does not save it. The app
deletes its temporary upload copies after each request and stores only the band, the measurements and
the date in the user's own Firestore record, never audio. Security rules in
`firebase/firestore.rules` limit each user to their own records.

## Run it

```bash
cd ml && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python download.py     # needs a free Synapse token, see the file header
.venv/bin/python extract.py      # features from the recordings
.venv/bin/python train_final.py  # trains and writes models/evaluation_report.json
.venv/bin/python -m pytest tests # feature tests
```

Run the scoring server from the repo root (it needs `ffmpeg` for Android audio):

```bash
REQUIRE_AUTH=0 ml/.venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

`REQUIRE_AUTH=0` turns off the sign-in check and is only for testing on your own network. In production
set `FIREBASE_SERVICE_ACCOUNT_JSON` and leave `REQUIRE_AUTH` unset.

Run the phone app (Expo Go, iPhone and computer on the same Wi-Fi):

```bash
cd app && cp .env.example .env     # fill in your Firebase project's web config and the server address
npm install && npx expo start --clear
```

Firebase setup: create a project, enable Email/Password sign-in, create a Firestore database and
publish `firebase/firestore.rules`.

## AI use

See `docs/AI_USAGE_LOG.md` for a dated record of what Claude Code did and what the student decided.
