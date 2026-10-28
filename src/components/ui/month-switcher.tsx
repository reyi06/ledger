import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { addMonths, currentMonthKey, formatMonthLong, isFutureMonth } from '@/lib/date';
import type { MonthKey } from '@/domain/primitives';
import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui/controls';

/**
 * Prev / next month control.
 *
 * The month is set as a tracked mono label between two ruled square buttons.
 * The change is instant — no cross-fade on the label.
 */
export function MonthSwitcher({
  month,
  onChange,
  allowFuture = false,
  style,
}: {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
  allowFuture?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const canGoForward = allowFuture || !isFutureMonth(addMonths(month, 1));
  const isCurrent = month === currentMonthKey();

  return (
    <View style={[styles.container, style]}>
      <IconButton
        icon="arrow-back"
        accessibilityLabel="Previous month"
        onPress={() => onChange(addMonths(month, -1))}
      />

      <View style={styles.label}>
        <ThemedText type="label">{formatMonthLong(month)}</ThemedText>
        {isCurrent ? (
          <ThemedText type="caption" themeColor="textTertiary">
            CURRENT
          </ThemedText>
        ) : null}
      </View>

      <IconButton
        icon="arrow-forward"
        accessibilityLabel="Next month"
        onPress={() => canGoForward && onChange(addMonths(month, 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  label: {
    alignItems: 'center',
    gap: Spacing.half,
  },
});
