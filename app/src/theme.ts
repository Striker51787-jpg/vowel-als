// Vowel theme, generated from design system v1. Units are points.
// Fonts (expo-font / @expo-google-fonts): Fraunces_500Medium, Fraunces_600SemiBold,
// AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold

export type Palette = {
  bg: string; surface: string; border: string;
  text: string; textSecondary: string;
  primary: string; onPrimary: string; primaryText: string;
  soft: string; focus: string; ring: string; track: string; noise: string;
  band: Record<'low' | 'borderline' | 'elevated', { bg: string; ink: string }>;
};

export const light: Palette = {
  bg: '#F8F4EC', surface: '#FFFFFF', border: '#DDD5C6',
  text: '#1F2D3A', textSecondary: '#3E4B58',
  primary: '#2B5F75', onPrimary: '#FFFFFF', primaryText: '#1F4C60',
  soft: '#E6EFF2', focus: '#1F2D3A', ring: '#D6E5EA', track: '#DDD5C6', noise: '#9AA3AB',
  band: {
    low: { bg: '#D3E6EE', ink: '#1F2D3A' },
    borderline: { bg: '#E9BC62', ink: '#1F2D3A' },
    elevated: { bg: '#5A3D6E', ink: '#FFFFFF' },
  },
};

export const dark: Palette = {
  bg: '#141B21', surface: '#1E2830', border: '#3A4853',
  text: '#F1EEE8', textSecondary: '#BDC7CF',
  primary: '#8CC2D6', onPrimary: '#0E2530', primaryText: '#A9D4E3',
  soft: '#26404C', focus: '#F1EEE8', ring: '#2E4A58', track: '#3A4853', noise: '#7A8791',
  band: {
    low: { bg: '#3A6477', ink: '#FFFFFF' },
    borderline: { bg: '#E3B75F', ink: '#1A1405' },
    elevated: { bg: '#CDB4E0', ink: '#1E1428' },
  },
};

export const fonts = {
  display500: 'Fraunces_500Medium',
  display600: 'Fraunces_600SemiBold',
  body400: 'AtkinsonHyperlegible_400Regular',
  body700: 'AtkinsonHyperlegible_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.display500, fontSize: 42, lineHeight: 48 },
  title: { fontFamily: fonts.display500, fontSize: 34, lineHeight: 40 },
  prompt: { fontFamily: fonts.display500, fontSize: 28, lineHeight: 34 },
  button: { fontFamily: fonts.body700, fontSize: 22, lineHeight: 28 },
  bodyLarge: { fontFamily: fonts.body400, fontSize: 21, lineHeight: 30 },
  body: { fontFamily: fonts.body400, fontSize: 19, lineHeight: 28 },
  caption: { fontFamily: fonts.body400, fontSize: 17, lineHeight: 24 },
  // recording screens
  soundWord: { fontFamily: fonts.display500, fontSize: 56, lineHeight: 60 },
  soundWordSmall: { fontFamily: fonts.display500, fontSize: 40, lineHeight: 44 },
  countdownNumber: { fontFamily: fonts.display500, fontSize: 104, lineHeight: 110 },
  timer: { fontFamily: fonts.body700, fontSize: 44, lineHeight: 48, fontVariant: ['tabular-nums'] as const },
  headerLabel: { fontFamily: fonts.body700, fontSize: 20 },
  kicker: { fontFamily: fonts.body700, fontSize: 18 },
} as const;

export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { small: 14, field: 16, button: 20, card: 24, round: 9999, segment: 5 } as const;

export const size = {
  minTouch: 48, buttonHeight: 64, fieldHeight: 60, checkbox: 28,
  recordButton: 136, recordButtonBorder: 8, recordHalo: 184,
  countdownRing: 252, tick: { count: 60, width: 4, height: 18, radius: 2 },
  waveform: { bars: 27, barWidth: 7, gap: 5, stageHeight: 190, minBarHeight: 8, maxExtra: 160 },
  coachBars: { bars: 30, barWidth: 6, gap: 4, rowHeight: 56 },
  progress: { count: 8, height: 10, gap: 6, border: 2 },
  border: 1, focusRing: 3, screenPaddingH: 24,
} as const;

// Placeholders to calibrate on real phones
export const recording = {
  countdownSeconds: 3, micOpensBeforeGoSeconds: 0.5,
  autoStopSilenceSeconds: 1.5, hardCapSeconds: 30,
  tooQuietPeakDbfs: -34, clippedSampleFraction: 0.001, minSpeechOverNoiseDb: 15,
  tooShortSeconds: 3, vowelAimSeconds: 5, shortTryLimitBeforeOfferingUse: 2,
  // Added by the app (same status: placeholders to calibrate on real phones). Metering is in dB.
  speechAboveNoiseDb: 12, // level above the room-noise floor that counts as voice
  silenceAboveNoiseDb: 6, // level under this above the floor counts as silence
  noSpeechGiveUpSeconds: 8, // stop if nobody speaks for this long after Go
  clippedPeakDb: -1, // metering peak at or above this is treated as too loud
  meterFloorDb: -60, // level meter range (dB) mapped to 0..1
  sampleRateHz: 44100,
} as const;


// Step 3: account, sign-up and consent screens
export const auth = {
  inputBorder: 2, inputBorderFocused: 3, inputRadius: 16, inputPaddingH: 18,
  passwordRightPadding: 84, showButtonMinWidth: 64,
  label: { fontSize: 19 /* body700 */ }, helper: { fontSize: 17 },
  checkbox: { box: 28, radius: 8, uncheckedBorder: 3, check: { width: 15, height: 8, border: 3, rotateDeg: -45 } },
  errorBox: { border: 2, radius: 18, paddingV: 14, paddingH: 16, fontSize: 19 }, // border color = palette.primaryText
  softNote: { radius: 18, paddingV: 14, paddingH: 16 }, // background = palette.soft
  consentCard: { radius: 20, paddingV: 14, paddingH: 16, border: 1, gap: 10 },
  consentBox: { radius: 20, padding: 16 }, // background = palette.soft
  logoMark: { diameter: 48, barWidth: 4, barHeights: [10, 22, 30, 18, 8], gap: 3 },
  sentCircle: { diameter: 112, check: { width: 40, height: 22, border: 6, rotateDeg: -45 } },
  welcomeWaveform: { bars: 27, stageHeight: 120, minBarHeight: 8, maxExtra: 104 },
  micIllustration: { halo: 184, inner: 136, pill: { width: 22, height: 40, radius: 11 } },
  // disabled primary button: background = palette.track, text = palette.textSecondary
} as const;


// Step 4: result and home
export const result = {
  headerHeight: 48, paddingH: 24, gap: 12,
  bandCard: { radius: 24, paddingV: 18, paddingH: 20, border: 1 },
  bandWord: { fontFamily: fonts.display600, fontSize: 38, lineHeight: 38, radius: 16, paddingV: 10, paddingH: 20 },
  headline: { fontSize: 21, lineHeight: 30 },
  scale: { cellHeight: 52, cellRadius: 14, activeBorder: 3, gap: 6, pointer: { width: 18, height: 12 } }, // active cell border = palette.text, pointer = palette.text
  meaning: { title: { fontFamily: fonts.display500, fontSize: 24, lineHeight: 28 }, body: { fontSize: 19, lineHeight: 27 } },
  nextStepCard: { radius: 20, paddingV: 16, paddingH: 18 }, // background = palette.soft
  bottomBar: { paddingTop: 10, paddingBottom: 34, gap: 10, disclaimerFontSize: 18 }, // pinned, never scrolls
  reveal: { band: { delay: 0, duration: 1200 }, meaning: { delay: 1400, duration: 800 }, nextStep: { delay: 2400, duration: 600 }, easing: 'inOut(sin)' }, // opacity only
} as const;

export const home = {
  tabBar: { fontSize: 17, minTouch: 48, underlineHeight: 4 },
  disclaimerFontSize: 16,
} as const;

// Step 5: results list, Learn, settings, privacy, delete, finishing screens
export const step5 = {
  listRow: { radius: 20, minHeight: 72, gap: 12 },
  bandChip: { radius: 12, paddingV: 4, paddingH: 12, fontSize: 17 /* approximate: confirm against the HTML snapshot */ }, // same band colors as the result screen
  learnCard: { radius: 20, paddingV: 14, paddingH: 18, gap: 12 },
  segmented: { height: 56, radius: 16, gap: 8, selectedFill: 'primary', selectedText: 'onPrimary', unselectedBorder: 2 },
  deleteDialog: { radius: 28, paddingTop: 24, paddingH: 20, paddingBottom: 20, scrim: 'rgba(0,0,0,0.55)', primaryButton: 'Keep my recordings', secondaryButton: 'Delete my recordings (outlined, no red)' },
  finish: { circle: 120, checkWidth: 44, checkHeight: 24, checkBorder: 6, micInner: 120, micHalo: 184, halo: { duration: 2400, scaleTo: 1.06, opacityTo: 0.7 } },
} as const;

// PDF page (not a React Native screen: use for the PDF generator, Letter 816 x 1056 px or A4 794 x 1123 px)
export const pdf = {
  page: { width: 816, height: 1056 }, marginH: 72, marginTop: 64, marginBottom: 56,
  fontSizes: { body: 16, caption: 13, bandWord: 44, title: 36, section: 22 },
  colors: { ink: '#111111', mid: '#333333', rule: '#BBBBBB', fill: '#EDEDED' }, // black and white only
} as const;

export const theme = { light, dark, fonts, type, spacing, radius, size, recording, auth, result, home, step5, pdf };
