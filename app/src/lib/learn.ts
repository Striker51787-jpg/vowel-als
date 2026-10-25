import { evaluation, f2 } from '@/lib/evaluation';

export type Topic = { id: string; title: string; blurb: string; sections: { heading?: string; body: string }[] };

const e = evaluation;
const als = e.risk_bands.counts_out_of_fold.als;
const ctl = e.risk_bands.counts_out_of_fold.controls;

export const TOPICS: Topic[] = [
  {
    id: 'als', title: 'About ALS and the voice', blurb: 'What ALS is, and why a voice can change.',
    sections: [
      { body: 'ALS (amyotrophic lateral sclerosis) is a condition that gradually affects the nerves that control muscles. That can include the muscles we use to speak and swallow.' },
      { heading: 'Why the voice can change', body: 'Speaking needs fast, well-timed movements of the lips, tongue, throat and breathing muscles. When those muscles weaken or slow down, speech can sound slower, a little slurred, breathy or strained. Holding a steady sound, or repeating “pa-ta-ka” quickly, can show small changes before they are easy to hear.' },
      { heading: 'Many other things change a voice too', body: 'Colds, tiredness, dry air, medicines, alcohol, stress and getting older can all change how a voice sounds. A change in your voice is much more often caused by one of these than by ALS.' },
      { body: 'To learn more, the ALS Association (als.org) has clear, trustworthy information.' },
    ],
  },
  {
    id: 'limits', title: 'What Vowel can and cannot do', blurb: 'A screening is not a diagnosis.',
    sections: [
      { heading: 'What it does', body: 'Vowel records eight short sounds, measures things like how steady and how fast your voice is, and compares them with voices from a research study. It then shows one of three bands: Low, Borderline or Elevated.' },
      { heading: 'What it cannot do', body: 'It cannot tell you whether you have ALS or any other condition. It can miss real changes, and it can flag a normal voice. Treat it as a prompt to think, not an answer.' },
      { heading: 'How well did it work in testing?', body: `We tested it on ${e.dataset.n_participants} people from the ${e.dataset.name} research dataset: ${e.dataset.n_als} with ALS and ${e.dataset.n_controls} without. We measure how well a model separates the two groups with a number called ROC-AUC. A score of 1.0 would be perfect and 0.5 is no better than a coin toss. Our most honest estimate is ${f2(e.headline.overall_estimate_auc)}. That is better than chance, but modest.` },
      { heading: 'What the bands mean in practice', body: `In testing, ${als.low} of the ${e.dataset.n_als} people with ALS landed in Low, and ${ctl.elevated} of the ${e.dataset.n_controls} people without ALS landed in Elevated. So a result can be wrong in either direction. Borderline means the model could not tell.` },
      { heading: 'Why we test carefully', body: 'We checked the model with nested cross-validation. In plain words: the model is always scored on people it has never seen, and the choices we made along the way were tested the same way, so the number is not flattered by trying many models and keeping the best. It has not yet been tested on new people recorded on their own phones.' },
    ],
  },
  {
    id: 'recording', title: 'Getting a good recording', blurb: 'Where to sit and how to hold the phone.',
    sections: [
      { heading: 'Find a quiet room', body: 'Close doors and windows and turn off fans, TVs and music. Background noise is the most common reason a recording is not clear.' },
      { heading: 'Hold the phone about 20 cm (8 in) away', body: 'That is about the length of your hand from wrist to fingertip, plus a little. Point the bottom of the phone at your mouth. Too close and the sound gets loud and flat; too far and it gets quiet.' },
      { heading: 'Speak at a normal volume', body: 'You do not need to shout. For long sounds, take a normal breath and hold the sound steadily for as long as is comfortable. For “pa-pa-pa”, say it fast and evenly in one breath.' },
      { heading: 'If a recording is not clear', body: 'We will tell you, and you can record it again. You can also use it anyway.' },
    ],
  },
  {
    id: 'doctor', title: 'Talking with your doctor', blurb: 'What to bring and what to ask.',
    sections: [
      { heading: 'What to bring', body: 'Tap “Save a summary for my doctor” on a result to make a one-page PDF. Add a note about anything you have noticed: when it started, whether it is getting better or worse, and whether you have trouble swallowing or with your hands.' },
      { heading: 'What you could ask', body: 'Could this be something simple, like a throat or breathing problem? Should I see a speech therapist or a neurologist? What else should we check?' },
      { body: 'Vowel is not a medical test, so your doctor will decide what, if anything, to do next.' },
    ],
  },
  {
    id: 'about', title: 'About this project', blurb: 'A high-school research study.',
    sections: [
      { body: 'Vowel is a high-school research project, built for the Congressional App Challenge. It explores whether a short voice recording on a phone can give an early hint of speech changes linked to ALS.' },
      { heading: 'Your privacy', body: 'Your voice is analysed and then discarded. We keep only your results: your band, a few measurements and the date. Only you can see them, and you can delete them at any time in Settings.' },
      { heading: 'The model', body: `The scoring model (version ${e.model_version}) was trained on the public ${e.dataset.name} dataset. It is a prototype and has not been approved for medical use.` },
    ],
  },
];
