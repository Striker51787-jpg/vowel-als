import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Card, T } from '@/components/ui';
import { fmtShort } from '@/lib/format';
import type { TestRecord } from '@/lib/store';
import { useAppTheme } from '@/lib/theme-context';
import { spacing } from '@/theme';

const SERIES = [
  { key: 'syllable_rate_per_s', title: 'Speaking rate (repeats)', unit: 'syllables per second', digits: 1 },
  { key: 'pitch_variability_semitones', title: 'Pitch variation', unit: 'semitones', digits: 1 },
] as const;

function Spark({ values, labels }: { values: number[]; labels: string[] }) {
  const { palette } = useAppTheme();
  const W = 300, H = 64, P = 8;
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [P + (i * (W - 2 * P)) / Math.max(values.length - 1, 1), H - P - ((v - lo) / span) * (H - 2 * P)] as const);
  return (
    <View accessible accessibilityLabel={`From ${labels[0]} to ${labels[labels.length - 1]}: ${values.map((v) => v.toFixed(1)).join(', ')}`}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={palette.primary} strokeWidth={3} strokeLinejoin="round" />
        {pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={4.5} fill={palette.primary} />)}
      </Svg>
    </View>
  );
}

/** Trends of two interpretable measurements. The model score itself is never charted. */
export function Trends({ results }: { results: TestRecord[] }) {
  const ordered = [...results].reverse(); // oldest first
  const blocks = SERIES.map((s) => {
    const rows = ordered.filter((r) => typeof r.metrics[s.key] === 'number');
    return { s, values: rows.map((r) => r.metrics[s.key] as number), labels: rows.map((r) => fmtShort(r.createdAt)) };
  }).filter((b) => b.values.length >= 2);
  if (!blocks.length) return null;
  return (
    <View style={{ gap: spacing.m }}>
      <T v="button" color="textSecondary" style={{ fontSize: 19 }}>Trends</T>
      <Card style={{ gap: spacing.xl, padding: spacing.l }}>
        {blocks.map(({ s, values, labels }) => (
          <View key={s.key} style={{ gap: spacing.s }}>
            <T v="body" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{s.title}</T>
            <Spark values={values} labels={labels} />
            <T v="caption" color="textSecondary">
              {`${labels[0]} to ${labels[labels.length - 1]}: ${values[0].toFixed(s.digits)} to ${values[values.length - 1].toFixed(s.digits)} ${s.unit}`}
            </T>
          </View>
        ))}
        <T v="caption" color="textSecondary">
          These are everyday measurements, not a score. They move around from day to day, so look at the shape over time, not one point.
        </T>
      </Card>
    </View>
  );
}
