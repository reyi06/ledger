import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { Spacing, type ThemeColor } from '@/constants/theme';
import type { Cents } from '@/domain/money';
import { ThemedText, type ThemedTextType } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useMoney } from '@/store/hooks';

/**
 * Money, formatted for the active currency.
 *
 * Set in mono with tabular figures so a column of amounts aligns on the decimal.
 * Direction is stated twice — by the sign on the figure and by a drawn arrow —
 * because colour is unavailable and a ledger must still read correctly in
 * grayscale, in print, and with colour-vision deficiency.
 */
export function AmountText({
  value,
  showSign = false,
  arrow = false,
  type = 'amount',
  themeColor,
  style,
  numberOfLines = 1,
}: {
  value: Cents;
  showSign?: boolean;
  /** Prefix a drawn arrow stating direction. */
  arrow?: boolean;
  type?: ThemedTextType;
  themeColor?: ThemeColor;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { format } = useMoney();
  const theme = useTheme();
  const ink = theme[themeColor ?? 'text'];

  const figure = (
    <ThemedText type={type} themeColor={themeColor} numberOfLines={numberOfLines} style={style}>
      {format(value, { showSign })}
    </ThemedText>
  );

  if (!arrow) return figure;

  return (
    <View style={styles.row}>
      <Ionicons
        name={value < 0 ? 'arrow-down' : 'arrow-up'}
        size={12}
        color={ink}
        style={styles.arrow}
      />
      {figure}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  arrow: {
    opacity: 0.7,
  },
});
