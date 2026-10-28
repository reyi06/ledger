import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';
import { Divider } from '@/components/ui/surface';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Settings row.
 *
 * Handles the three shapes the settings screen needs: navigation (a chevron), an
 * inline control (a switch or value), and a destructive action.
 *
 * Danger used to be signalled by a heavier border, which was the only device
 * available without colour. Now it takes the terracotta wash — and the label
 * still says what the action does, so the state never depends on the hue alone.
 */
export function SettingsRow({
  icon,
  label,
  description,
  value,
  onPress,
  accessory,
  tone = 'default',
  showDivider = true,
}: {
  icon?: IoniconName;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  accessory?: ReactNode;
  tone?: 'default' | 'accent' | 'danger';
  showDivider?: boolean;
}) {
  const theme = useTheme();

  const disc = {
    default: { background: theme.tintMuted, glyph: theme.sageText },
    accent: { background: theme.tintMuted, glyph: theme.sageText },
    danger: { background: theme.negativeMuted, glyph: theme.negative },
  }[tone];

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: disc.background }]}>
          <Ionicons name={icon} size={18} color={disc.glyph} />
        </View>
      ) : null}

      <View style={styles.text}>
        <ThemedText type="heading">{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>

      {value ? (
        <ThemedText type="amount" themeColor="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </ThemedText>
      ) : null}

      {accessory ??
        (onPress ? <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} /> : null)}
    </View>
  );

  return (
    <View>
      {onPress ? (
        <PressableSurface
          onPress={onPress}
          accessibilityRole="button"
          style={styles.pressable}>
          {content}
        </PressableSurface>
      ) : (
        <View style={styles.pressable}>{content}</View>
      )}
      {showDivider ? <Divider inset={icon ? 56 : 0} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingVertical: Spacing.three,
    minHeight: 64,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  value: {
    maxWidth: 140,
    textAlign: 'right',
  },
});
