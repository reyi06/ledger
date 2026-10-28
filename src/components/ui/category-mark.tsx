import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Fonts, Radius } from '@/constants/theme';
import { categoryCode } from '@/domain/categories';
import { useTheme } from '@/hooks/use-theme';

/**
 * Category mark — a numbered editorial index.
 *
 * The app carries 18 categories and cannot tell them apart by hue, so each gets
 * a two-digit index. It was a ruled square set in mono; it is now a soft sage
 * pebble set in the interface face, which keeps the information and the sort
 * order while dropping the two things this system does not use — hard corners and
 * a monospace.
 *
 * `inverted` is the over-budget variant: a terracotta pebble rather than a solid
 * black one, so the state reads as a state rather than as emphasis.
 */
export function CategoryMark({
  categoryId,
  size = 40,
  inverted = false,
  style,
}: {
  categoryId: string;
  size?: number;
  inverted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: Radius.md,
          backgroundColor: inverted ? theme.terracottaText : theme.tintMuted,
        },
        style,
      ]}>
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: Math.max(10, Math.round(size * 0.3)),
          letterSpacing: 0.4,
          color: inverted ? theme.onInverted : theme.sageText,
        }}>
        {categoryCode(categoryId)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
