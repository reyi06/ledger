import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Line, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';
import { Divider } from '@/components/ui/surface';

/**
 * The workhorse row: leading mark, title, metadata, trailing figure.
 *
 * Rows are divided by a hairline rather than separated by whitespace, so a long
 * ledger reads as a ruled table.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  onLongPress,
  showDivider = true,
  dividerInset = 0,
  style,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  showDivider?: boolean;
  dividerInset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const interactive = Boolean(onPress || onLongPress);

  return (
    <View>
      <PressableSurface
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={!interactive}
        // Without a role, React Native Web renders this as a plain div and a
        // screen reader never announces it as something you can tap. Every row in
        // the app was missing this.
        accessibilityRole={interactive ? 'button' : undefined}
        style={[styles.row, style]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}

        <View style={styles.text}>
          <ThemedText type="heading" numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>

        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </PressableSurface>

      {showDivider ? <Divider inset={dividerInset} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 64,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.half,
  },
});

export const listRowLine = Line.thin;
