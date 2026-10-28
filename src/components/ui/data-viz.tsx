import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Line, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

/**
 * Charts.
 *
 * The two series in a grouped chart are separated by *fill*: the primary is a
 * solid sage block, the secondary the same footprint left hollow. That survives
 * grayscale, colour-blindness and a photocopier, which a two-colour palette does
 * not — and it means the chart still reads if the user has increased contrast on.
 *
 * Every bar is rounded at the crown, because nothing in this system has a hard
 * corner.
 */

export interface BarChartDatum {
  label: string;
  primary: number;
  secondary?: number;
}

function Bar({
  value,
  max,
  height,
  filled,
}: {
  value: number;
  max: number;
  height: number;
  filled: boolean;
}) {
  const theme = useTheme();
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  return (
    <View
      style={[
        styles.bar,
        {
          height: Math.max(3, ratio * height),
          backgroundColor: filled ? theme.sage : 'transparent',
          borderWidth: filled ? 0 : Line.thin,
          borderColor: theme.sage,
        },
      ]}
    />
  );
}

/** Grouped bars — typically income against expense, per month. */
export function BarChart({
  data,
  height = 120,
  formatValue,
  style,
}: {
  data: readonly BarChartDatum[];
  height?: number;
  formatValue?: (value: number) => string;
  style?: StyleProp<ViewStyle>;
}) {
  const max = Math.max(1, ...data.flatMap((datum) => [datum.primary, datum.secondary ?? 0]));

  return (
    <View style={style}>
      <View style={[styles.plot, { height }]}>
        {data.map((datum) => (
          <View key={datum.label} style={styles.group}>
            <Bar value={datum.primary} max={max} height={height} filled />
            {datum.secondary !== undefined ? (
              <Bar value={datum.secondary} max={max} height={height} filled={false} />
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.axis}>
        {data.map((datum) => (
          <ThemedText
            key={datum.label}
            type="caption"
            themeColor="textTertiary"
            style={styles.axisLabel}>
            {datum.label}
          </ThemedText>
        ))}
      </View>

      {formatValue ? (
        <ThemedText type="caption" themeColor="textTertiary" style={styles.scale}>
          Peak {formatValue(max)}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Compact normalized bars, used for daily spend and pace. */
export function MiniBars({
  values,
  height = 44,
  highlightIndex,
  style,
}: {
  values: readonly number[];
  height?: number;
  highlightIndex?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const max = Math.max(1, ...values);

  return (
    <View style={[styles.miniRow, { height }, style]}>
      {values.map((value, index) => {
        const highlighted = highlightIndex === index;
        return (
          <View
            key={index}
            style={[
              styles.miniBar,
              {
                height: Math.max(3, (value / max) * height),
                backgroundColor: highlighted ? theme.terracotta : theme.sage,
                opacity: highlighted ? 1 : 0.55,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/** A legend swatch: filled for the primary series, outlined for the secondary. */
export function LegendSwatch({ filled }: { filled: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.swatch,
        {
          backgroundColor: filled ? theme.sage : 'transparent',
          borderWidth: filled ? 0 : Line.thin,
          borderColor: theme.sage,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  group: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    flex: 1,
    maxWidth: 18,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  axis: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
  },
  scale: {
    marginTop: Spacing.two,
    textAlign: 'right',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  miniBar: {
    flex: 1,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
