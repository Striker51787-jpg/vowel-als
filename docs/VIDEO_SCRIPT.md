# Video script: Voice Check (about 3 minutes)

Say it in your own words. Anything in [brackets] is for you to fill in or confirm before recording.
Keep the numbers exactly as written; they come from `ml/models/evaluation_report.json`.

## 1. The problem (0:00 - 0:25) — face camera or title card
"ALS is a disease that slowly takes away a person's control of their muscles, including the ones used for speaking.
In one study of 1,405 patients, the typical wait from the first symptom to a diagnosis was 11 months, and some waited much longer.
Voice changes can be one of the early signs, and recording a voice takes a minute on a phone.
So I asked: how much of that signal can a simple phone screen actually pick up?"

[One sentence on why this matters to you personally, if it does.]

## 2. Demo (0:25 - 1:15) — screen recording of your iPhone
Show, with a short line each:
- Sign up (use a throwaway account), consent, and the "not a diagnosis" line.
- The recording screen: "I say 'ahhh' and the bars follow my voice." Hold it long enough to show the timer and the waveform.
- The quality coach: record once too quietly (or covering the mic) so the "too quiet" card appears, then fix it.
- One syllable task: "pa-pa-pa as fast and evenly as I can".
- The result: "It never shows a percentage. It shows one of three bands: Low, Borderline or Elevated."
- The history on Home, and the PDF "summary for my doctor" if it works.

Say: "My voice is healthy, so I'm not expecting anything unusual. What matters is how it works and how honest it is."

## 3. How it works (1:15 - 2:00) — simple diagram or your face
"The app records eight short sounds: five vowels and three syllables.
My server measures things speech scientists already use: how steady the pitch is, how rough the voice sounds, and how fast and even the syllables are.
A logistic regression model turns those measurements into a score, and I group that score into three bands.
I trained it on a public dataset called VOC-ALS: 153 people in a hospital in Italy, 102 with ALS and 51 without."

## 4. The hard part, and what I learned (2:00 - 2:50)
"I started this project over the summer, and the first version reported an accuracy of 0.76.
This fall I rebuilt it from scratch, and I tested it much more strictly.
I measure accuracy with something called AUC. A coin flip is 0.5 and a perfect model is 1.0.
My honest result is about 0.68. The deployed model scores 0.71 in cross-validation, but I picked it from many candidates, so 0.68 is the number I trust.
The old 0.76 came from testing on just 31 people. At that size, the real answer could be anywhere from 0.4 to 0.8.
I tried many things to push it higher: better voice measurements, speech AI models, combining models. Every method landed between 0.67 and 0.72.
When different methods hit the same ceiling, the limit is usually the data, not the method. Many people in the dataset have only mild speech changes.
I also checked that the model isn't just picking up age or sex. A model using only age and sex scores at chance, so it isn't."

## 5. Limits, honesty, and AI (2:50 - 3:20)
"This is not a diagnostic tool. It was only compared against healthy people, not against other conditions. It was trained on one phone in one quiet room, and I haven't validated it on other phones.
Next, I'd want more data and testing with people on their own phones.
I used Claude Code, an AI coding assistant, to write much of the code. I made the decisions: the project, the dataset, how to test it honestly, and what to do when the results were lower than I'd hoped.
The full record of what the AI did is in the project's AI usage log."

## Before you record
- [x] Diagnosis-delay source: Falcão de Campos et al., "Trends in the diagnostic delay and pathway for amyotrophic lateral sclerosis patients across different countries", Frontiers in Neurology, 2023 (1,405 patients, median 11 months, interquartile range 6 to 20 months). Show it on screen or in the description.
- [ ] You can explain AUC and cross-validation in plain words without notes
- [ ] The scoring server is running and the phone is on the same Wi-Fi
- [ ] Phone Do Not Disturb on, and use a quiet room for the demo
- [ ] Screen-record the demo first, then record the voice-over
