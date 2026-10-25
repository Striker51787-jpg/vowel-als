# Design brief: ALS Voice Screen (iPhone app)

## What it is
A phone app that guides a person through eight short voice recordings (about 2 minutes) and
returns a plain-language result about whether their voice shows patterns more common in people with
ALS (amyotrophic lateral sclerosis). It is a **research screening prototype for a high-school
Congressional App Challenge entry. It is not a diagnostic tool**, and the design must make that
unmistakable without being scary or preachy.

## Who uses it
- **Primary:** adults, many older (ALS is typically diagnosed in people in their 50s to 70s), possibly
  anxious, possibly already noticing speech or hand-motor changes. Some may have weak hands, so big
  targets and hands-free options matter.
- **Secondary:** judges and family members seeing a demo. It should look credible, calm and clinical-adjacent
  without looking like a hospital portal.

## Tone
Calm, warm, trustworthy, plain-spoken. No alarm colors for results, no medical jargon, no gamification,
no stock-photo clichés. Think "well-made health app", not "wellness app" and not "enterprise software".

## Hard content rules (design around these)
1. **Never show a percentage or probability.** The result is one of three bands: **Low**, **Borderline**,
   **Elevated** ("elevated" means "more ALS-like patterns than typical", never "you have ALS").
2. A visible "not a diagnosis" statement on the welcome, result and report screens. Result screen must
   also say what to do next (talk to a doctor if worried; link to the ALS Association).
3. Band colors must not read as a verdict. Avoid red/green. Use a calm single-hue scale or a neutral
   scale with clear text labels, so it is readable without color (accessibility).
4. Audio is never stored. Say so on the recording and privacy screens.
5. Honest about uncertainty: the model is a weak-to-moderate signal (about 0.7 AUC). The "Learn" screen
   explains this in plain words.

## Screens (priority order)
1. **Welcome / disclaimer / consent** (13+ age gate, "not a diagnosis").
2. **Sign up / log in** (email + password, reset).
3. **Home dashboard:** latest result, big "Start a screen" button, history list, small trend charts.
4. **Pre-screen questions** (alcohol or sedatives in last 4 h, cold or sore throat, etc.).
5. **Recording flow (8 tasks):** instructions, hold phone about 20 cm (8 in) away, countdown, live level
   meter, a "keep going" cue. Tasks: five sustained vowels held about 5 seconds each ("ah", "eh", "ee", "oh", "oo"),
   then three syllables "pa-pa-pa…", "ta-ta-ta…", "ka-ka-ka…" repeated fast and evenly in one breath.
   Includes a **quality coach** (too noisy / too quiet / too short, with a one-tap re-record) and a
   progress indicator (task 3 of 8).
6. **Result:** band, plain-language explanation, per-task breakdown, "what this means / doesn't mean",
   next steps.
7. **Past result detail + PDF report** (shareable with a doctor).
8. **Learn:** how it works, what AUC means, limitations.
9. **Settings:** accessibility mode (larger text, high contrast, hands-free auto start/stop), delete account and data.

## Data the result screens can show
Per test: band; pitch (Hz); pitch variability (semitones); jitter %, shimmer %, voice clarity (HNR, dB);
longest steady vowel (seconds); syllable rate (per second); rhythm regularity; pause ratio; date.
Trend charts should use the interpretable ones (syllable rate, pitch variability), never a model "score".

## Accessibility requirements
Large type (supports Dynamic Type), 44+ pt targets, high contrast option, never rely on color alone,
VoiceOver labels, hands-free recording mode, minimal typing.

## Technical constraints (so designs can be built)
- Built in React Native (Expo) for iPhone first; standard native-feeling components, no custom
  gestures that are hard to build.
- Portrait only. Design at 390 x 844 (iPhone 15/16).
- Light and dark mode.
- Deliverables wanted from design: a small design system (colors, type scale, spacing, corner radii,
  button/input/card styles) + the screens above.
