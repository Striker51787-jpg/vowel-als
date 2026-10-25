# AI usage log

The Congressional App Challenge requires full disclosure of AI use. This log
records what Claude Code (Anthropic's AI coding assistant) did, as it happened.
Its purpose is to make the final disclosure in the README accurate. Student
decisions are listed separately.

## Student decisions
- Project idea, choice of the VOC-ALS dataset, and the original summer 2026 research.
- Decision to rebuild from scratch as a phone app instead of a website.
- Feature list: accounts, history dashboard, quality coach, accessibility mode, PDF report.
- Platform (cross-platform, demo on iPhone) and backend (Firebase).

## Claude Code — 2026-10-20

**Research and planning**
- Reviewed the old app.
- Looked up the VOC-ALS paper for the recording protocol (8 kHz, Samsung S8+, 20 cm), metadata fields and access terms.
- Proposed the architecture: Expo app, FastAPI scoring server, sklearn pipeline.

**`ml/features.py`**
- Wrote the feature extractor shared by training and the API:
  - Praat-based pitch, jitter, shimmer and HNR for vowels.
  - Syllable rate, regularity and pause ratio for pa/ta/ka.
  - MFCCs.
  - Recording quality checks.
- Its tests (`ml/tests`) use synthetic signals with known answers. They caught a bug: the noise check was skipped in exactly the noisy rooms it was meant to catch. Claude fixed it by measuring noise from a 0.3 s lead-in before the user speaks.

**Data pipeline and training**
- Wrote `ml/download.py` (Synapse download) and `ml/extract.py` (feature table).
- Wrote `ml/train.py`:
  - Locked 20% held-out split, with a check that no participant appears in both sets.
  - Repeated nested cross-validation and bootstrap confidence intervals.
  - An age+sex-only baseline and sex-stratified AUC as confound checks.
  - Risk-band cut-offs chosen only from development-set predictions.
- Claude proposed pre-declaring the primary model (8 tasks, clinical features) before seeing any results.
- Smoke-tested on synthetic data only. No real results exist yet.

## Claude Code — 2026-10-21

**First real run on VOC-ALS (153 participants)**
- Fixed `ml/extract.py` for the real spreadsheet layout (placeholder header row, sheet name, "-" for missing values).
- Sanity check: our pitch and jitter agree with the dataset authors' own Praat values (correlation 0.975), so the feature extraction works.
- Trained with the pre-declared primary model (8 tasks, clinical features). Results are in `ml/models/evaluation_report.json`. They are modest, and the old app's numbers were not reproduced.
- Nothing was tuned or swapped after seeing the held-out result.

**Attempt to raise accuracy (student's goal: AUC 0.75)**
- Kept the v1 pre-declared result in `ml/models/evaluation_report_v1_predeclared.json`.
- Added stronger features: CPPS, formants, vowel-space area, and per-measure averages across the 5 vowels.
- Added pretrained speech-model embeddings (wav2vec2 and WavLM, via `ml/embed.py`).
- Evaluated 82 candidate pipelines. The best one is chosen inside each cross-validation fold, so the reported number includes the search itself (`ml/experiments.py`, `ml/experiments_v3.py`).
- Result: nested-selection AUC 0.678 (3 repeats: 0.685, 0.695, 0.656). The best single candidate scored about 0.72 in plain CV, but that is the best of 82 and therefore optimistic. The 0.75 target was **not** reached, and nothing was tuned against the held-out set to get closer.

**Ensembles (`ml/experiments_v4.py`)**
- At the student's request, tried averaging all hand-built and embedding models. The rule was fixed before any run, with no hand-picked winners.
- Plain-CV AUC was 0.697 for the full ensemble and 0.692 for embeddings only.
- Nested selection over 84 candidates gave AUC 0.678, identical to v3, so the search estimate stays at 0.68.

**Final model**
- Wrote `ml/train_final.py`:
  - Trains the deployed model on all 153 participants.
  - Writes the final evaluation report.
  - Quotes the nested-selection AUC (0.68) as the headline.
- Updated the API to compute the same pooled features as training.
- Added a test that raw WAVs through the API match the offline pipeline for real participants. All 10 tests pass.
- Wrote `firebase/firestore.rules` (owner-only, results are immutable) and the README. The rules are not yet tested against the Firebase emulator.
- Did not rebuild the Docker image after the model change, because Docker was not running. It must be re-tested before deploy.

**`api/`** (written 2026-10-20)
- Wrote the FastAPI server: `/quality` and `/score`, Firebase token check, in-memory audio only.
- Wrote API tests, pinned the requirements and wrote the Dockerfile.
- Verified the Docker image end to end. Two fixes came out of that:
  - The image now has a build stage, because parselmouth needs compiling on ARM Linux.
  - Android .m4a decoding now calls ffmpeg directly, because librosa 1.0 no longer falls back to it.

## 2026-10-21: Phone app (app/), built by Claude Code (Opus 5.5 / Sonnet 5.5)

What the AI did, at the student's direction:
- Scaffolded an Expo SDK 58 / TypeScript / expo-router project in `app/` and implemented every screen in the design handoff (`design/voice-check-handoff_1`): welcome, sign up, log in, forgot password, consent, microphone permission, pre-screen questions, 8-task guided recording, result (low/borderline/elevated), home, results list, Learn, settings, privacy and data, delete dialogs, past result.
- Wrote the API client (`app/src/lib/api.ts`) to match `api/main.py` (`/quality`, `/score`, Firebase ID token), with a mock mode for development.
- Recording uses `expo-audio`: 16-bit mono WAV on iOS, AAC on Android, mic opens 0.5 s before "Go", count-up timer, auto-stop after 1.5 s of silence, 30 s cap. Coach thresholds are placeholders in `src/theme.ts` (`recording`) and still need calibrating on real phones.
- Firestore saves band, measurements and date only. Audio is never stored. The raw model score is saved but only appears in the PDF technical appendix.
- Learn screen numbers are read from a bundled copy of `ml/models/evaluation_report.json`; none were typed by hand.
- PDF summary (expo-print + expo-sharing) and trend charts (react-native-svg) for syllable rate and pitch variation.

Human decisions and checks still needed: result wording needs clinician review; fill in `PDF_SURNAME` / `PDF_CONTACT` in `src/lib/copy.ts`; fill in `.env`; test on a real iPhone.

## Claude Code — 2026-10-22

**Firebase and Expo Go compatibility**
- Wrote `app/.env` from the Firebase config the student showed in a screenshot. `.env` is gitignored.
- The student's Expo Go on iPhone supports SDK 57 only, so the app was moved from Expo SDK 58 to SDK 57 with a clean reinstall.
- One code fix was needed: the custom tab bar used an SDK 58 navigation API, so it now uses the standard `navigation` object.
- Verified `tsc --noEmit` passes and `expo export --platform ios` bundles. The app has not yet been run on the phone.
- After the student tried the app on an iPhone, changed the recording waveform from "all bars scale together" to a travelling wave. New voice level enters at the centre bar and moves outward (`LiveWaveform` in `app/src/components/record-parts.tsx`). Also added a gentle looping wave to the welcome and home waveforms (`useWaveClock` in `app/src/components/ui.tsx`). All of it respects Reduce Motion. This departs from the designer's "perfectly still" welcome and home waveforms, at the student's request.
- The student's Expo Go updated to SDK 58, so the app was moved back to SDK 58 (original `package.json` restored, patch versions aligned with `expo install --fix`, tab bar reverted to the SDK 58 navigation API). `tsc` passes and the iOS bundle builds. The waveform changes were kept.
- Prepared `deploy/hf-space/` (Dockerfile, README with Hugging Face front matter, server code and model) and made the server read the Firebase key from the `FIREBASE_SERVICE_ACCOUNT_JSON` secret. Not yet built or deployed.
- First real-phone test against the local scoring server failed. Added logging to `app/src/lib/api.ts` and found the cause: Expo SDK 58's fetch rejects the old `{uri, name, type}` multipart file shape ("Unsupported FormDataPart implementation"). Fixed by copying each recording to a temporary `File` named `<task>.<ext>`, attaching that, and deleting the temporary copies after the request. Verified `tsc` only. Not yet re-tested on the phone.
- Late-fusion experiment (`ml/experiments_v5.py`, per-task models averaged): nested-selection AUC 0.686 over 86 candidates, the same as before within noise. No model change was made.
- First full run on the phone worked end to end against the local scoring server. Drafted `docs/VIDEO_SCRIPT.md`; numbers in it come from `ml/models/evaluation_report.json`.
