# Voice Check motion spec

Use Reanimated shared values (opacity, scale, translate, height). No Lottie or video. Every row has a Reduce Motion alternative; read it with `useReducedMotion()`. Nothing shakes, bounces or celebrates, and errors never use red.

# Step 2: Recording flow

## Screen entry (all screens)

- **What moves:** On navigation push, content fades in and rises slightly: opacity 0 to 1, translateY 8 to 0.
- **Duration:** 300 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Opacity only, 150 ms, linear.

## Record button halo (instruction)

- **What moves:** Loops while the screen is idle: a soft ring behind the button breathes, opacity 0.45 to 0.85 and scale 1 to 1.06. Stops once the button is pressed.
- **Duration:** 4000 ms per breath
- **Easing:** inOut(sin), repeat, reverse
- **Reduce Motion:** No loop. Static halo at opacity 0.7.

## Button press

- **What moves:** Press in: the button scales to 0.96. Release: back to 1. Applies to every Pressable.
- **Duration:** 100 ms in, 160 ms out
- **Easing:** out(quad)
- **Reduce Motion:** Opacity dips to 0.8 instead of scale.

## Start to countdown

- **What moves:** Tap Start. The instruction content cross-fades to the countdown: opacity 1 to 0, then the next screen 0 to 1.
- **Duration:** 250 ms
- **Easing:** linear
- **Reduce Motion:** Same fade, 150 ms.

## Countdown ring (3-2-1 only)

- **What moves:** One shared progress value goes 0 to 1. Each of the 60 ticks changes from the primary color to the track color as progress passes it, clockwise from the top. This is the only countdown in the app.
- **Duration:** 3000 ms
- **Easing:** linear
- **Reduce Motion:** Ring stays full. Only the number changes.

## Countdown number

- **What moves:** Each second the number changes (3, 2, 1), then "Go" holds briefly. The new number fades up: opacity 0.2 to 1, scale 0.9 to 1. The microphone opens about 0.5 s before "Go" with no visual change.
- **Duration:** 250 ms per number, "Go" held 700 ms
- **Easing:** out(quad)
- **Reduce Motion:** Number swaps instantly, no scale.

## Countdown to recording

- **What moves:** After "Go" the ring fades out (opacity 1 to 0) while the waveform stage fades in. A single light haptic marks the start.
- **Duration:** 200 ms out, 300 ms in
- **Easing:** out(cubic)
- **Reduce Motion:** Same fade, 150 ms. Haptic stays.

## Live waveform

- **What moves:** Audio metering arrives about 20 times a second and is normalised to 0 to 1. Every bar height follows that value, multiplied by a fixed center-weighted shape so the middle bars move most. Rising is quick, falling is slower, so it looks calm and never jittery. For syllable tasks the bars simply pulse with each "pa".
- **Duration:** 80 ms rise, 220 ms fall
- **Easing:** out(quad)
- **Reduce Motion:** Bars stay at a fixed height. A text line reads "Voice level: good, low or high" and changes at most once a second with a 150 ms fade.

## Count-up timer

- **What moves:** Text only: shows 0.0 s counting up in tenths. No animation, no ring, no end point. Tabular numerals keep the digits steady.
- **Duration:** Updates every 100 ms
- **Easing:** none
- **Reduce Motion:** Updates once a second, in whole seconds.

## "Keep going" cue

- **What moves:** Vowels: "Steady and easy. Keep going." until 5 s, then it cross-fades to "Good. Stop whenever you are ready." Syllables: "Fast and even. Keep going." If the voice level drops for 1 s the cue fades up. It breathes gently: opacity 0.7 to 1.
- **Duration:** 400 ms swap, 1800 ms breath
- **Easing:** inOut(sin)
- **Reduce Motion:** No breathing. Text swaps instantly.

## Auto-stop (silence or 30 s cap)

- **What moves:** After 1.5 s of silence, or at the 30 s cap, the bars settle to their lowest height and the cue fades out. Then a short hold before the next screen. Nothing warns of the cap. Tapping Stop does the same.
- **Duration:** 400 ms settle, 600 ms hold
- **Easing:** out(cubic)
- **Reduce Motion:** Bars set to lowest height at once. Hold stays.

## Coach card (quiet, loud, noisy, short)

- **What moves:** After the hold the card and its two illustration rows fade in and rise: opacity 0 to 1, translateY 12 to 0. The "Your recording" bars then grow up from their baseline, one after another, left to right. Buttons are visible from the start, so no one waits to continue.
- **Duration:** 350 ms card, 600 ms bars, 12 ms stagger
- **Easing:** out(cubic)
- **Reduce Motion:** Card fades in 200 ms. Bars appear at full height, no stagger.

## Too short is a soft prompt

- **What moves:** First short try shows two equal buttons: "Use this recording" and "Try again". After the second short try the screen leads with "Use this recording" and "Try once more" is a text link. No timer, no auto-advance, nothing is blocked.
- **Duration:** Same as coach card
- **Easing:** out(cubic)
- **Reduce Motion:** Same as coach card.

## Record again

- **What moves:** One tap. Press feedback, cross-fade to a fresh 3-2-1 countdown. The task segment stays outlined.
- **Duration:** 250 ms fade
- **Easing:** linear
- **Reduce Motion:** 150 ms fade.

## Task accepted

- **What moves:** When a recording is accepted (passes the checks or "Use this recording") the current outlined segment fills solid, holds, then the next task’s instruction screen enters. A light success haptic plays. No check mark burst, no celebration.
- **Duration:** 400 ms fill, 300 ms hold, 300 ms enter
- **Easing:** out(cubic)
- **Reduce Motion:** Segment fills instantly, 150 ms fade.


Recording rules: count-up timer, auto-stop after 1.5 s of silence or at a 30 s cap, mic opens about 0.5 s before "Go". Coach thresholds (placeholders to calibrate): too quiet below about -34 dBFS, too loud above 0.1% clipped samples, too noisy under 15 dB over room noise, too short under 3 s (soft prompt only; after two short tries lead with "Use this recording").

# Step 3: Account, sign-up and consent

## Screen change

- **What moves:** On navigation push the new screen fades in and rises slightly: opacity 0 to 1, translateY 8 to 0. Going back reverses it.
- **Duration:** 300 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Opacity only, 150 ms, linear.

## Button press

- **What moves:** Press in: scale to 0.96. Release: back to 1. Applies to every Pressable.
- **Duration:** 100 ms in, 160 ms out
- **Easing:** out(quad)
- **Reduce Motion:** Opacity dips to 0.8 instead of scale.

## Field focus

- **What moves:** When a field gains focus its border grows from 2 pt to 3 pt and its color changes from the border color to the focus color. The border width change is a layout shift of 1 pt, so animate the color and swap the width.
- **Duration:** 150 ms
- **Easing:** out(quad)
- **Reduce Motion:** Instant change.

## Show or hide password

- **What moves:** Tap Show. The dots swap to the typed text and the button label swaps to "Hide". The text cross-fades.
- **Duration:** 100 ms
- **Easing:** linear
- **Reduce Motion:** Instant swap.

## Login error appears

- **What moves:** After a failed log in, the message box grows from height 0 to its measured height while fading in: height 0 to auto, opacity 0 to 1. The password border moves to 3 pt in the primary text color. Focus moves to the message so VoiceOver reads it. No shake, no red.
- **Duration:** 250 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Message appears at once. Border change is instant.

## Error clears

- **What moves:** When the person edits either field the message collapses: height auto to 0, opacity 1 to 0.
- **Duration:** 200 ms
- **Easing:** out(quad)
- **Reduce Motion:** Disappears at once.

## Checkbox

- **What moves:** Tap to check: the box fills with the primary color and the check mark scales 0.6 to 1 while fading in. Unchecking reverses it.
- **Duration:** 160 ms
- **Easing:** out(quad)
- **Reduce Motion:** Instant swap, no scale.

## Continue button enables

- **What moves:** On the consent screen, once both boxes are checked the grey disabled button cross-fades to the primary button (two stacked layers, opacity 0 to 1). Text color changes with it.
- **Duration:** 200 ms
- **Easing:** linear
- **Reduce Motion:** Instant swap.

## Welcome waveform

- **What moves:** Plays once when the screen first appears: each of the 27 bars grows from scaleY 0.4 to 1 while fading in, starting at the center bar and moving outward. Then it stays perfectly still. It is a picture of what the app listens to, not a loop.
- **Duration:** 600 ms total, 10 ms stagger
- **Easing:** out(cubic)
- **Reduce Motion:** Bars appear with a 200 ms fade, no stagger or scale.

## Reset link sent

- **What moves:** The check circle fades in and scales 0.9 to 1, then the heading and text fade in after it.
- **Duration:** 300 ms circle, 200 ms text, 100 ms gap
- **Easing:** out(cubic)
- **Reduce Motion:** All fade in together, 150 ms.

## Keyboard opens

- **What moves:** The flexible empty space above the primary button shrinks so the button stays above the keyboard. The content area scrolls the focused field into view.
- **Duration:** Match keyboard, about 250 ms
- **Easing:** iOS keyboard curve (KeyboardAvoidingView)
- **Reduce Motion:** Same. This follows the keyboard, not a decorative animation.


# Step 4: Result and home

## Result reveal: band

- **What moves:** About 0.3 s after the screen appears, the band card and the Low, Borderline, Elevated scale fade in together: opacity 0 to 1. Nothing else moves. No scale, no slide.
- **Duration:** 1200 ms
- **Easing:** inOut(sin)
- **Reduce Motion:** Shown immediately, no fade.

## Result reveal: explanation

- **What moves:** The "What this means" text fades in after the band has settled: opacity 0 to 1, starting 1400 ms after the band began.
- **Duration:** 800 ms
- **Easing:** inOut(sin)
- **Reduce Motion:** Shown immediately.

## Result reveal: next step

- **What moves:** The "Your next step" card fades in last, starting 2400 ms after the band began. Total reveal takes about 3 seconds.
- **Duration:** 600 ms
- **Easing:** inOut(sin)
- **Reduce Motion:** Shown immediately.

## Always visible

- **What moves:** The line "This is a screening, not a diagnosis." and the "Save a summary for my doctor" button are present from the first frame and never animate. No confetti, sound or haptic on any band.
- **Duration:** none
- **Easing:** none
- **Reduce Motion:** Same.

## Screen reader

- **What moves:** When the screen appears, VoiceOver focus goes to the band card and reads "Your result: Borderline. We noticed some patterns..." in full, without waiting for the fade.
- **Duration:** none
- **Easing:** none
- **Reduce Motion:** Same.

## Home entry

- **What moves:** On first load the screen fades in with the usual push: opacity 0 to 1, translateY 8 to 0.
- **Duration:** 300 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Opacity only, 150 ms.

## First-time waveform (home)

- **What moves:** The waveform picture in the empty state fades in once and then stays still.
- **Duration:** 400 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Shown immediately.

## Tab change

- **What moves:** The content cross-fades and the 4 pt underline under the tab label changes color. The underline does not slide.
- **Duration:** 150 ms
- **Easing:** linear
- **Reduce Motion:** Instant swap.

## Row and card press

- **What moves:** The latest-result card and each earlier-check row dim slightly on press: opacity 1 to 0.85, back on release.
- **Duration:** 100 ms in, 160 ms out
- **Easing:** out(quad)
- **Reduce Motion:** Same, it is a color-only change.

## Start button

- **What moves:** Press in: scale to 0.96. Release: back to 1. Then the normal push to the instruction screen.
- **Duration:** 100 ms in, 160 ms out
- **Easing:** out(quad)
- **Reduce Motion:** Opacity dips to 0.8 instead of scale.


The result reveal is opacity only: band 0-1200 ms, meaning from 1400 ms for 800 ms, next step from 2400 ms for 600 ms. The disclaimer and save button are visible from the first frame. No scale, slide, confetti, sound or haptic.

# Step 5: Past result, Learn, settings, finishing screens, PDF

## Past result opens

- **What moves:** Opened from the Results list. The band, scale, meaning and next step are shown at once with no reveal, because the person has already seen it. The screen pushes in like any other: opacity 0 to 1, translateX 12 to 0.
- **Duration:** 250 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Opacity only, 150 ms.

## Results list row press

- **What moves:** The row dims on press: opacity 1 to 0.85, back on release. No other movement.
- **Duration:** 100 ms in, 160 ms out
- **Easing:** out(quad)
- **Reduce Motion:** Same, it is a color-only change.

## Learn topic open

- **What moves:** Tapping a topic card pushes the article in: opacity 0 to 1, translateX 12 to 0. Cards dim on press like list rows.
- **Duration:** 250 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Opacity only, 150 ms.

## Appearance control

- **What moves:** Choosing iPhone, Light or Dark changes the selected fill color. The whole app cross-fades to the new theme once.
- **Duration:** 200 ms
- **Easing:** linear
- **Reduce Motion:** Instant swap.

## Delete dialog

- **What moves:** The scrim fades from 0 to 55% black and the dialog fades in at the same time. No slide, no bounce. Focus moves to the dialog title. The safe button, Keep my recordings, is the primary one.
- **Duration:** 200 ms
- **Easing:** out(quad)
- **Reduce Motion:** Both appear instantly.

## Delete dialog closes

- **What moves:** The scrim and dialog fade out together, then the list re-appears unchanged.
- **Duration:** 150 ms
- **Easing:** linear
- **Reduce Motion:** Instant.

## Looking at your recordings

- **What moves:** The microphone circle has a soft halo that slowly grows and shrinks: scale 1 to 1.06 and back, opacity 1 to 0.7 and back. The eight segments stay filled. Nothing says how long it will take beyond "a few seconds".
- **Duration:** 2400 ms loop
- **Easing:** inOut(sin)
- **Reduce Motion:** Halo stays still. The text alone shows that it is working.

## Ready, then result

- **What moves:** The check mark circle and text fade in once: opacity 0 to 1. Pressing See my result goes to the result screen and its slow reveal.
- **Duration:** 400 ms
- **Easing:** out(cubic)
- **Reduce Motion:** Shown immediately.

## Save summary (PDF)

- **What moves:** The button label changes to "Preparing…" with no spinner, then the iPhone share sheet opens. The PDF page itself is a still document.
- **Duration:** until ready
- **Easing:** none
- **Reduce Motion:** Same.

