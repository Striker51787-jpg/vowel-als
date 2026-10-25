// Small in-memory hand-off between the questionnaire and the recording flow.
import type { PreScreen } from '@/lib/store';

export const session: { preScreen?: PreScreen } = {};
