import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * PIN progress indicator.
 *
 * Round, because nothing in this system has a corner. Filled dots take the
 * primary tone; a wrong PIN turns the filled ones terracotta rather than
 * thickening a border, so the error state is legible at a glance instead of
 * being a subtle change in line weight.
 */
export function PinDots({
  length,
  filled,
  error = false,
}: {
  length: number;
  filled: number;
  error?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, index) => {
        const active = index < filled;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: active
                  ? error
                    ? theme.terracottaText
                    : theme.tint
                  : theme.surfaceAlt,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Radius.pill,
  },
});
