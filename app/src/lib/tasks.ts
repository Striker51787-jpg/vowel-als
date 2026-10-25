export type TaskKey =
  | 'phonationA' | 'phonationE' | 'phonationI' | 'phonationO' | 'phonationU'
  | 'rhythmPA' | 'rhythmTA' | 'rhythmKA';

export type TaskDef = {
  key: TaskKey;
  kind: 'vowel' | 'syllable';
  kicker: string;
  word: string; // large text on the instruction and recording screens
  say: string; // what to say, in quotes in the body copy
  pdfName: string;
  pdfNote: string;
};

export const TASKS: TaskDef[] = [
  { key: 'phonationA', kind: 'vowel', kicker: 'Hold a sound', word: 'aaaah', say: 'aaaah', pdfName: 'Vowel “ah”', pdfNote: 'long hold' },
  { key: 'phonationE', kind: 'vowel', kicker: 'Hold a sound', word: 'ehhhh', say: 'ehhhh', pdfName: 'Vowel “eh”', pdfNote: 'long hold' },
  { key: 'phonationI', kind: 'vowel', kicker: 'Hold a sound', word: 'eeee', say: 'eeee', pdfName: 'Vowel “ee”', pdfNote: 'long hold' },
  { key: 'phonationO', kind: 'vowel', kicker: 'Hold a sound', word: 'ohhhh', say: 'ohhhh', pdfName: 'Vowel “oh”', pdfNote: 'long hold' },
  { key: 'phonationU', kind: 'vowel', kicker: 'Hold a sound', word: 'oooo', say: 'oooo', pdfName: 'Vowel “oo”', pdfNote: 'long hold' },
  { key: 'rhythmPA', kind: 'syllable', kicker: 'Quick repeats', word: 'pa-pa-pa', say: 'pa', pdfName: 'Repeat “pa-pa-pa”', pdfNote: 'one breath' },
  { key: 'rhythmTA', kind: 'syllable', kicker: 'Quick repeats', word: 'ta-ta-ta', say: 'ta', pdfName: 'Repeat “ta-ta-ta”', pdfNote: 'one breath' },
  { key: 'rhythmKA', kind: 'syllable', kicker: 'Quick repeats', word: 'ka-ka-ka', say: 'ka', pdfName: 'Repeat “ka-ka-ka”', pdfNote: 'one breath' },
];

export function instructionBody(t: TaskDef): string {
  return t.kind === 'vowel'
    ? `Take a normal breath, then say “${t.say}” steadily for as long as you comfortably can. Aim for at least 5 seconds.`
    : `Take a deep breath, then repeat “${t.say}” as fast and evenly as you can in one breath, until you run out of air.`;
}
