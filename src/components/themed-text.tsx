import { Text, type TextProps } from 'react-native';

import { Type, type ThemeColor, type TypeRole } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The app's single text primitive.
 *
 * Screens never set a font size or family directly; they name a *role*, which is
 * what keeps an editorial scale consistent across 15 routes. All three faces —
 * Playfair Display, Source Sans 3 and JetBrains Mono — are reached through the
 * roles in `Type`.
 */

export type ThemedTextType = TypeRole;

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = 'default',
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'] }, Type[type], style]}
      {...rest}
    />
  );
}
