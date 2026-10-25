// Shared wording. Audio is never stored: it is analysed in memory on the server and discarded.
export const DATA_HANDLING =
  'Your voice is analysed and then discarded. We never keep your audio. We keep only your results: your band, a few measurements and the date. Only you can see them, and you can delete them at any time in Settings.';

export const PRIVACY_BODY =
  'Your voice is analysed and then discarded. The scoring server works on your clips in memory and never saves them, and the app deletes them from your phone once they are scored.\n\nWe keep only your results: your band, a few measurements (such as speaking rate), the date, and your answers to the questions before a check. They are stored in your account, and only you can read them. You can delete them whenever you like.';

export const BANDS = {
  low: {
    headline: 'We did not notice voice patterns that are more common in ALS.',
    means: 'Your voice looked similar to most voices we compare against. This cannot rule anything out.',
    next: 'No action is needed. If you notice changes in your speech or swallowing, tell your doctor.',
    short: 'Nothing unusual noticed.',
  },
  borderline: {
    headline: 'We noticed some patterns that can be more common in ALS, but they were not clear.',
    means: 'Some tasks looked typical and some a little different. This is common and often has an everyday cause.',
    next: 'Try again another day in a quiet room. If you notice speech or swallowing changes, tell your doctor.',
    short: 'Some patterns were not clear.',
  },
  elevated: {
    headline: 'We noticed voice patterns that are more common in ALS. This does not mean you have it.',
    means: 'Several tasks looked different from most voices we compare against. Many common things can cause this.',
    next: 'Consider sharing this summary with your doctor. They can arrange proper testing if needed.',
    short: 'Some patterns stood out.',
  },
} as const;

export const ALS_ASSOCIATION_URL = 'https://www.als.org';

// Study details printed on the PDF footer. Add a contact email here if you want one on the page.
export const PDF_CONTACT = 'Voice Check is a high-school research prototype built for the 2026 Congressional App Challenge.';
