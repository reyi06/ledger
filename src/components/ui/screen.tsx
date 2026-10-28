import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Line, MaxContentWidth, Spacing } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { AmbientWind } from '@/components/wind';
import { IconButton } from '@/components/ui/controls';
import { Rule } from '@/components/ui/surface';

/**
 * Screen shell.
 *
 * Owns safe areas, the tab-bar inset and the centred measure. Native tabs are
 * told not to adjust content insets automatically (see `app-tabs.tsx`), so this
 * is the single place padding is decided — which is why layouts match across
 * iOS, Android and web.
 */

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra bottom padding, for example to clear a floating action button. */
  bottomInset?: number;
  edges?: { top?: boolean; bottom?: boolean };
  centerContent?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  header?: ReactNode;
}

/**
 * Height of the on-screen keyboard, in points, or 0 when it is hidden.
 *
 * `KeyboardAvoidingView` is not used: under edge-to-edge (the SDK 58 default)
 * Android 15 ignores `adjustResize` and never resizes the window, so the
 * component's assumption breaks and the primary action ends up behind the
 * keyboard. Reading the height directly and padding by it works on both
 * platforms regardless of window behaviour. Shared with `Sheet`.
 */
export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  bottomInset = 0,
  edges = { top: true, bottom: true },
  centerContent = false,
  keyboardShouldPersistTaps = 'handled',
  header,
}: ScreenProps) {
  const insets = useScreenInsets();
  const theme = useTheme();
  const keyboardHeight = useKeyboardHeight();

  const paddingTop = (edges.top ? insets.top : 0) + Spacing.four;
  const paddingBottom =
    (edges.bottom ? insets.bottom : 0) + Spacing.five + bottomInset + keyboardHeight;

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <AmbientWind />
        <View
          style={[
            styles.flex,
            {
              paddingTop,
              paddingBottom,
              paddingHorizontal: Spacing.four,
            },
            centerContent && styles.centered,
            style,
          ]}>
          {header}
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AmbientWind />
      <ScrollView
        style={[styles.flex, style]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingTop,
            paddingBottom,
            paddingHorizontal: Spacing.four,
            gap: Spacing.four,
            width: '100%',
            maxWidth: MaxContentWidth,
            alignSelf: 'center',
          },
          contentContainerStyle,
        ]}>
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

/**
 * Screen title block.
 *
 * A tracked eyebrow over a display-serif headline. The rule beneath it is now a
 * hairline in stone rather than a 4px stroke: in this system a heavy line under
 * every title was the loudest thing on the page, and separation is the job of
 * space instead.
 */
export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <View style={styles.header}>
        {onBack ? (
          <IconButton icon="arrow-back" accessibilityLabel="Go back" onPress={onBack} />
        ) : null}

        <View style={styles.headerText}>
          <ThemedText type="title">{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="body" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>

        {right}
      </View>

      <Rule weight={Line.hairline} style={styles.headerRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.two,
  },
  headerRule: {
    marginTop: Spacing.four,
  },
});
