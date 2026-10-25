# Voice Check handoff (Steps 2 to 5)

Covers: the design system, the recording flow (Step 2), and login, sign-up, forgot password, welcome, consent and microphone (Step 3).
Also covers the result and home screens (Step 4) and the past result, Results list, Learn, settings, privacy, delete, finishing screens and the PDF summary (Step 5). The six early draft screens are not exported.

- design-system/theme.ts   drop-in for app/theme.ts: colors light and dark (incl. result bands), fonts, type scale, spacing, radii, sizes, recording thresholds, and `auth` sizes for Step 3, and `result`, `home`, `step5` and `pdf` sizes for Steps 4 and 5
- design-system/tokens.json / tokens.css   same values as JSON and CSS
- motion/motion-spec.md / motion.json   every animation for Steps 2 to 5: what moves, duration, easing, Reduce Motion alternative
- screens-png/step2-recording/   18 PNGs (9 screens x light and dark), 780x1688 = 390x844 @2x
- screens-png/step3-account/     16 PNGs (8 screens x light and dark), same size
- screens-png/step4-result-home/ 10 PNGs (result low, borderline, elevated, home, home first time; light and dark)
- screens-png/step5-results-learn-settings/ 16 PNGs (results list, Learn, settings, privacy and data, delete confirmation, looking at recordings, all done, past result; light and dark)
- screens-png/step5-pdf-report/ the PDF summary page, 1632x2112 = Letter at 2x (print, black and white)
- screens-html/   static HTML snapshots of each screen at 390 wide with computed layout. Use for exact spacing, not as code to ship
- source-dc-html/ the original design files (.dc.html and canvas.json). They need the Claude Design runtime to open
- screens-png/INDEX.md   list of every screen name
- fonts/   Fraunces 500/600 and Atkinson Hyperlegible 400/700 (latin woff2, SIL Open Font License)

Icons and images: none. Mic shape, stop square, check marks, waveform, tick ring, logo mark and progress bar are all plain Views.

Step 2 screens: 01 instruction (vowel), 02 instruction (syllables), 03 countdown, 04 recording-active, 05 too quiet, 06 too loud, 07 too noisy, 08 too short, 09 too short second try.
Step 3 screens: 01 log in, 02 log in wrong password, 03 sign up with consent, 04 forgot password, 05 check your email, 06 welcome, 07 consent, 08 allow microphone.
The countdown and recording PNGs are single frozen frames (at "2" and 7.2 s).

Step 4 screens: 01 to 03 result Low, Borderline, Elevated (fully revealed), 04 home, 05 home first time.
Step 5: the Learn topic articles (text) are not designed; the five Learn cards open to plain text pages using the same type scale.

Open items: result wording needs clinician review. Sample data (Margaret, dates) is placeholder. PDF has [SURNAME] and [CONTACT / STUDY INFO] placeholders. The delete dialog and privacy screen have [DATA HANDLING: ...] placeholders.
Earlier open items: consent screen text for "Your recordings" is a placeholder [DATA HANDLING: ...]. Coach thresholds are placeholders to calibrate.
