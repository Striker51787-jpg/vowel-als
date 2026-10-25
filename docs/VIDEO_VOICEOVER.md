# Vowel: final voice-over for two speakers (about 2:40, limit 3:00)

Speaker A and Speaker B are placeholders. Split the lines by who actually did the work, so each of you
speaks about the part you know. Judges look for each team member's real contribution and technical
understanding. Shot list, colour grade and sound notes are in `VIDEO_SCRIPT.md`.

Fill in the [brackets]. Say the numbers exactly as written. Show both full names on screen.

---

**[0:00] Cold open** *(black, a breath, the dim room)* — **A**

In one study of 1,405 people with ALS, the typical wait from the first symptom to a diagnosis was eleven months.

Voice changes can be one of the first signs.

*(title card)*

**[0:18] Who and what**

**A:** I'm [Speaker A full name].

**B:** And I'm [Speaker B full name]. This is Vowel.

**A:** It's an iPhone app that records eight short voice tasks and gives people who are worried about their speech a plain-language screening result. It is not a diagnosis.

**B:** It's made for adults who notice changes in how they speak, and for the doctors they talk to.

**A:** We built the app with React Native and TypeScript, the server with Python and FastAPI, the model with scikit-learn, and the accounts with Firebase.

**[0:44] Demo** *(screen recording)*

**B:** You make an account, and every screen reminds you this is a screening, not a diagnosis.

**A:** I say "ahhh," and the bars follow my voice. The timer counts up, and the recording stops when I do.

**B:** If a recording is too quiet, too noisy or too short, the app tells us why and lets us try again.

**A:** For the syllables, I repeat "pa-pa-pa" as fast and evenly as I can.

**B:** Then the eight recordings go to our server. It measures things like pitch stability, how rough the voice sounds, and the rhythm of speech.

**A:** The result never shows a percentage. It shows one of three bands: Low, Borderline or Elevated, with a plain explanation and a next step.

**B:** Past results are saved, and you can make a summary to share with a doctor.

**[1:35] The hard part**

**B:** The hardest part wasn't the app. It was telling the truth about the model.

**A:** Our first version, from this summer, reported an accuracy of 0.76. This fall we rebuilt it and tested it much more strictly.

**B:** We measure accuracy with something called AUC. A coin flip is 0.5. A perfect model is 1.0. Our honest result is about 0.68.

**A:** The old 0.76 came from testing on just 31 people. With a group that small, the real answer could be almost anywhere.

**B:** So we tried to push it higher. Better voice measurements, pretrained speech AI, combining models. Everything landed between 0.67 and 0.72.

**A:** When very different methods hit the same ceiling, the limit is usually the data. The dataset has 153 people, and many of the people with ALS in it have only mild speech changes.

**B:** We also checked that the model wasn't just picking up age or sex. A model using only those two scores at chance, so it isn't.

**[2:25] Limits, AI, and what's next**

**A:** This is not a diagnostic tool. It was only compared against healthy people, and it was trained on one phone in one quiet room.

**B:** If we built a 2.0, we'd collect more data and test it on people's own phones.

**A:** We used Claude Code, an AI coding assistant. [Say, in your own words and accurately, what the AI did and what each of you did. Don't understate how much the AI wrote.] The full record is in our AI usage log.

*(fade to black, end card: "Vowel. A screening, not a diagnosis.", then both names)*

---

## Checklist
- [ ] Both full names spoken AND shown on screen
- [ ] The AI sentence matches `docs/AI_USAGE_LOG.md` exactly in substance
- [ ] Each of you can explain your own lines without reading them
- [ ] Exported video is under 3:00, public on YouTube or Vimeo
