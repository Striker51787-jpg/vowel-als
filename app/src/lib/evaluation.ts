// Plain-language numbers for the Learn screen, read from the evaluation report bundled with the app
// (a copy of ml/models/evaluation_report.json). Nothing here is hand-typed: update the JSON, not this file.
import report from '../../assets/evaluation_report.json';

type Report = {
  model_version: string;
  dataset: { name: string; n_participants: number; n_als: number; n_controls: number };
  headline: { overall_estimate_auc: number; deployed_model_nested_cv_auc: number; deployed_model_auc_95ci_bootstrap: [number, number] };
  risk_bands: { counts_out_of_fold: { als: Record<'low' | 'borderline' | 'elevated', number>; controls: Record<'low' | 'borderline' | 'elevated', number> } };
};

export const evaluation = report as unknown as Report;
export const f2 = (n: number) => n.toFixed(2);
