# Vowel: cinematic documentary script (target 2:40, hard limit 3:00)

Rules from the 2026 CAC rules (section 4): the video is 1 to 3 minutes and must be public on YouTube or Vimeo.
It must give (1) your name, (2) the app's name, (3) the purpose in ONE clear sentence, (4) the target audience,
(5) the tools and languages, and (6) show the app working. The rules say it is not a video-creation contest, so
the cinematic look is a bonus; the six items above are what count. Judges may penalise videos over 3 minutes.

Words in [brackets] are yours to fill in or confirm. The numbers come from `ml/models/evaluation_report.json`.

---

## Look and sound

**Colour grade.** Keep it simple and consistent.
- Cool teal-blue shadows with a warm skin tone and a warm practical light. The app's own colours (teal `#2B5F75`, cream `#F8F4EC`) match this, so the screen recordings will blend in.
- Slightly lifted blacks, low contrast, a little film grain. Not too much: the screen recordings must stay readable.
- Free tools: DaVinci Resolve (free) for the grade, or iMovie / CapCut filters if you're short on time.

**Sound.** Half the "cinematic" feel is audio.
- Open with **room tone and a breath**, no music for the first few seconds.
- One quiet ambient track (YouTube Audio Library or a Creative Commons track; **no copyrighted music**), low under your voice.
- The only loud moment is the waveform coming alive when you say "ahhh" in the demo.

**Voice-over.** Record it close to the microphone, in a quiet room, in one calm and steady pace. Don't read it like a trailer.

**Respect.** Do not use actors pretending to have ALS, and don't show real patients unless you have clear permission. Use hands, a phone, a dim room, silence and the waveform instead.

---

## Beat 1: Cold open (0:00 - 0:18)

| Time | Picture | Sound / Voice-over |
|---|---|---|
| 0:00 | Black. Room tone. A slow fade-in on a dim room at night; your phone face-down on a desk. | Room tone, one slow breath. |
| 0:04 | Slow push-in on the phone lighting up. Macro on the screen: the Vowel waveform, still. | Quiet low tone begins. |
| 0:08 | Cut to white text on black. | VO: "In one study of 1,405 people with ALS, the typical wait from the first symptom to a diagnosis was eleven months." |
| 0:14 | You, side-lit, close shot, speaking to the camera. | VO continues: "Voice changes can be one of the first signs." |
| 0:17 | Cut to black. Title card: **Vowel**. | A single soft note. |

Source for the on-screen text (put it in small type or in the video description): Falcão de Campos et al., "Trends in the diagnostic delay and pathway for amyotrophic lateral sclerosis patients across different countries", Frontiers in Neurology, 2023.

## Beat 2: Who, what and for whom (0:18 - 0:42)

Picture: you, a clean medium shot with the phone in hand, then the app's welcome screen.

"I'm [your full name]. This is Vowel, an iPhone app that records eight short voice tasks and gives people worried about their speech a plain-language screening result, not a diagnosis.
It's made for adults who notice changes in their speech, and for the doctors they talk to.
I built it with React Native and TypeScript for the app, Python and FastAPI for the server, and scikit-learn for the model, with Firebase for accounts."

On screen: a small lower-third naming the tools as you say them.
(That covers: your name, the app's name, one-sentence purpose, audience, and tools and languages.)

## Beat 3: Demo (0:42 - 1:35)

Screen recording of your iPhone, cut with close-ups of your hands and face. Say each line over the matching action.

1. **Sign up (3 s).** "You make an account, and every screen says this is a screening, not a diagnosis."
2. **Recording (15 s).** Record a vowel. Let the waveform move. "I say 'ahhh', and the bars follow my voice. The timer counts up. The recording stops when I do."
3. **Quality coach (12 s).** Cover the mic, or record too quietly. "If the recording is too quiet, too noisy or too short, the app tells me why and lets me try again."
4. **Syllables (8 s).** "For the syllables, I repeat 'pa-pa-pa' as fast and evenly as I can."
5. **Analyzing (5 s).** "Eight short recordings go to my server, which measures things like pitch stability, voice roughness and speech rhythm."
6. **Result (10 s).** Hold on the result screen. "It never shows a percentage. It shows one of three bands: Low, Borderline or Elevated, with a plain explanation and a next step."
7. **History and PDF (5 s).** "Past results are saved, and I can make a summary to share with a doctor."

Cinematic touch: during the result, slow the screen recording slightly and let the music swell, then drop to near silence under your next line.

## Beat 4: The hard part and what I learned (1:35 - 2:25)

Picture: a laptop at night with the evaluation numbers on screen, a slow slide across your desk; then you to camera.

"The hard part wasn't the app. It was telling the truth about the model.

My first version, over the summer, reported an accuracy of 0.76. This fall I rebuilt it and tested it much more strictly.
I measure accuracy with something called AUC. A coin flip is 0.5. A perfect model is 1.0.
My honest result is about 0.68.

The old 0.76 came from testing on just 31 people. With a group that small, the real answer could be almost anywhere.
So I tried to push it up: better voice measurements, pretrained speech AI models, combining models. Everything landed between 0.67 and 0.72.
When different methods hit the same ceiling, the limit is usually the data. The dataset has 153 people, and many of the people with ALS in it have only mild speech changes.

I also checked that the model isn't just picking up age or sex. A model using only age and sex scores at chance, so it isn't."

On screen: a simple bar chart from the real report: "age and sex only: 0.39", "Vowel: about 0.68", with the line "0.5 = coin flip".

## Beat 5: Limits, AI, and what's next (2:25 - 2:50)

"This is not a diagnostic tool. It was only compared against healthy people, it was trained on one phone in one quiet room, and I haven't tested it on other phones.
If I made a 2.0, I'd collect more data and test it on people's own phones.

I used Claude Code, an AI coding assistant, to help write the code. [Say, in your own words and accurately, what the AI did and what you did: for example, you chose the project and the dataset, designed the honest-testing approach, made the decisions when the results came back lower than hoped, and tested the app on your phone.] The full record is in my AI usage log, linked in the submission."

Picture: you on camera, then a final shot of the app on the desk, screen dim. Fade to black. End card (2 seconds): "Vowel. A screening, not a diagnosis."

---

## Before you record

- [ ] Say your **full name** out loud and show it on screen. The rules require it.
- [ ] The one-sentence purpose is spoken exactly as written in Beat 2.
- [ ] Scoring server running, phone on the same Wi-Fi, Do Not Disturb on.
- [ ] Record the demo screen first with the phone's screen recording, then the voice-over.
- [ ] Final video is **under 3:00**. Check the exported length, not the timeline.
- [ ] Upload to YouTube or Vimeo and set it to **Public**. Open the link in a private window to confirm.
- [ ] You can explain AUC and cross-validation without notes.

## Draft answers for the submission questions (edit into your own words)

These are from section 4 of the official rules.
1. **Title:** Vowel
2. **Purpose:** An iPhone app that records eight short voice tasks and gives a plain-language screening result about voice patterns linked to ALS. It is not a diagnosis.
3. **What inspired you:** [your own reason. The summer research project, and why ALS.]
4. **Technical difficulty:**
   - The model's honest accuracy was lower than my first version claimed. I rebuilt the evaluation so that every choice is made inside cross-validation, with no tuning on the test set.
   - Smaller problems: Expo's newer network layer rejected my audio uploads until I changed how files are attached; matching the training pipeline's audio (8 kHz) to phone recordings.
5. **Biggest takeaway:** Honest evaluation matters more than a high number, and a small test set can mislead you.
6. **A 2.0 version:** More data, testing on people's own phones, and checking whether it can tell ALS apart from other speech conditions.
