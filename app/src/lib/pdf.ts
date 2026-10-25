// "Save a summary for my doctor": one-page black-and-white PDF (design: pdf-summary-letter) plus a
// technical appendix that is the only place the raw model score appears.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { BANDS, PDF_CONTACT } from '@/lib/copy';
import { fmtLong } from '@/lib/format';
import type { TestRecord } from '@/lib/store';
import { TASKS } from '@/lib/tasks';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const num = (v: number | null | undefined, d = 2) => (typeof v === 'number' ? v.toFixed(d) : 'not measured');

export function buildHtml(r: TestRecord, firstName: string): string {
  const b = BANDS[r.band];
  const label = r.band[0].toUpperCase() + r.band.slice(1);
  const cell = (name: 'low' | 'borderline' | 'elevated') => {
    const on = name === r.band;
    const t = name[0].toUpperCase() + name.slice(1);
    return `<div class="cell${on ? ' on' : ''}">${t}${on ? ' ◄ this check' : ''}</div>`;
  };
  const rows = TASKS.map(
    (t, i) => `<div class="row"><span>${i + 1}. ${esc(t.pdfName)}</span><span class="mid">${esc(t.pdfNote)}</span></div>`,
  );
  const warnings = Object.entries(r.qualityWarnings);
  const m = r.metrics;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0 }
  body { margin:0; font-family: Georgia, serif; color:#111; }
  .p { box-sizing:border-box; width:816px; min-height:1056px; padding:64px 72px 56px; display:flex; flex-direction:column; gap:22px; page-break-after:always; font-family: -apple-system, Helvetica, Arial, sans-serif; }
  h1 { font-family: Georgia, serif; font-weight:500; font-size:36px; margin:0; line-height:42px }
  h2 { font-family: Georgia, serif; font-weight:500; font-size:22px; margin:0 0 6px }
  .top { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #111; padding-bottom:14px }
  .k { font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#333 }
  .meta { text-align:right; font-size:16px; line-height:24px }
  .band { display:flex; align-items:center; gap:24px }
  .bandbox { border:4px solid #111; border-radius:16px; padding:10px 24px 12px }
  .bandbox .w { font-family: Georgia, serif; font-weight:600; font-size:44px; line-height:50px }
  .scale { display:flex; gap:8px }
  .cell { flex:1; height:40px; box-sizing:border-box; border:1px solid #777; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; color:#333 }
  .cell.on { border:4px solid #111; background:#EDEDED; font-weight:700; color:#111 }
  .two { display:flex; gap:32px } .two > div { flex:1; font-size:16px; line-height:24px }
  .grid { display:grid; grid-template-columns:1fr 1fr; column-gap:32px; border-top:1px solid #777; font-size:16px }
  .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #BBB } .mid { color:#333 }
  .notes { flex:1; min-height:120px; border:1px solid #777; border-radius:10px; background-image: repeating-linear-gradient(transparent 0 31px, #BBB 31px 32px) }
  .foot { border-top:2px solid #111; padding-top:12px; font-size:14px; line-height:20px; color:#222 }
  .foot b { display:block; font-size:16px; color:#111 }
  table { border-collapse:collapse; width:100%; font-size:16px } td { border-bottom:1px solid #BBB; padding:6px 0 } td:last-child { text-align:right }
  </style></head><body>
  <div class="p">
    <div class="top"><div><div class="k">Voice Check</div><h1>Voice check summary</h1></div>
      <div class="meta"><div><b>Name:</b> ${esc(firstName || '')}</div><div><b>Date of check:</b> ${fmtLong(r.createdAt)}</div><div><b>Tasks recorded:</b> 8 of 8</div></div></div>
    <div class="band"><div class="bandbox"><div class="k" style="font-size:13px">Voice pattern band</div><div class="w">${label}</div></div>
      <div style="font-size:20px;line-height:28px">${esc(b.headline)}</div></div>
    <div class="scale">${cell('low')}${cell('borderline')}${cell('elevated')}</div>
    <div class="two">
      <div><h2>What this means</h2>${esc(b.means)} Voice Check looks at patterns in speech sounds. It cannot tell what is causing them.</div>
      <div><h2>Suggested next step</h2>${esc(b.next)}</div></div>
    <div><h2>Recordings in this check</h2><div class="grid">${rows.join('')}</div></div>
    <div style="flex:1;display:flex;flex-direction:column"><h2>Notes for my doctor</h2><div class="notes"></div></div>
    <div class="foot"><b>This is a screening, not a diagnosis.</b>Voice Check is a high-school research prototype. It does not diagnose ALS or any other condition and should not replace advice from a doctor. Audio is analysed and discarded; only results are kept.<br>${esc(PDF_CONTACT)}</div>
  </div>
  <div class="p">
    <div class="top"><div><div class="k">Voice Check</div><h1>Technical appendix</h1></div><div class="meta">${fmtLong(r.createdAt)}</div></div>
    <p style="font-size:16px;line-height:24px;margin:0">For clinicians and researchers. These numbers come from one screening session and are not a diagnostic test. The model output is a research score, not a probability of disease.</p>
    <table>
      <tr><td>Model output (research score)</td><td>${num(r.modelScore, 3)}</td></tr>
      <tr><td>Model version</td><td>${esc(r.modelVersion || 'unknown')}</td></tr>
      <tr><td>Median pitch (Hz)</td><td>${num(m.pitch_hz, 1)}</td></tr>
      <tr><td>Pitch variability (semitones)</td><td>${num(m.pitch_variability_semitones)}</td></tr>
      <tr><td>Jitter (%)</td><td>${num(m.jitter_percent)}</td></tr>
      <tr><td>Shimmer (%)</td><td>${num(m.shimmer_percent)}</td></tr>
      <tr><td>Harmonics-to-noise ratio (dB)</td><td>${num(m.hnr_db, 1)}</td></tr>
      <tr><td>Sustained vowel duration (s)</td><td>${num(m.vowel_duration_s, 1)}</td></tr>
      <tr><td>Syllable rate (per s)</td><td>${num(m.syllable_rate_per_s, 1)}</td></tr>
      <tr><td>Syllable regularity (CV)</td><td>${num(m.syllable_regularity_cv)}</td></tr>
      <tr><td>Pause ratio</td><td>${num(m.pause_ratio)}</td></tr>
    </table>
    ${warnings.length ? `<div><h2>Recording quality notes</h2>${warnings.map(([k, v]) => `<div class="row"><span>${esc(TASKS.find((t) => t.key === k)?.pdfName ?? k)}</span><span class="mid">${esc(String(v))}</span></div>`).join('')}</div>` : ''}
    ${r.preScreen && Object.values(r.preScreen).some(Boolean) ? `<p style="font-size:16px;margin:0"><b>Reported before the check:</b> ${[r.preScreen.sedatives && 'alcohol or sedative in the last 4 hours', r.preScreen.soreThroat && 'cold, sore throat or hoarse voice', r.preScreen.tired && 'very tired or unwell', r.preScreen.noisyPlace && 'noisy place'].filter(Boolean).join('; ')}.</p>` : ''}
  </div></body></html>`;
}

export async function exportSummary(r: TestRecord, firstName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(r, firstName), width: 816, height: 1056 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Voice Check summary' });
  }
}
