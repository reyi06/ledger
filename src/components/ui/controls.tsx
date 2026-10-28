import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Elevation, Line, Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { PressableScale, PressableSurface } from '@/components/motion';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

/**
 * The app's button.
 *
 * Pill-shaped, uppercase and widely tracked, exactly as the brief specifies for
 * controls. Emphasis comes from *tone* rather than the previous system's hard
 * inversion: the primary is a deep-forest plate that lifts on a soft shadow, the
 * secondary is sage on transparency, and the destructive borrows terracotta.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IoniconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const haptics = useHaptics();
  const [focused, setFocused] = useState(false);
  const inactive = disabled || loading;

  const palette = {
    primary: { background: theme.tint, border: 'transparent', label: theme.onTint },
    secondary: { background: 'transparent', border: theme.sage, label: theme.sageText },
    destructive: { background: 'transparent', border: theme.terracotta, label: theme.terracottaText },
    ghost: { background: 'transparent', border: 'transparent', label: theme.tint },
  }[variant];

  return (
    <PressableScale
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        variant === 'primary' && !inactive && Elevation.sm,
        {
          borderWidth: Line.thin,
          borderColor: palette.border,
          backgroundColor: palette.background,
          opacity: inactive ? 0.4 : 1,
        },
        focused && {
          outlineColor: theme.sage,
          outlineWidth: 2,
          outlineOffset: 3,
          outlineStyle: 'solid',
        },
        style,
      ]}
      pressedStyle={styles.buttonPressed}>
      {loading ? (
        <ActivityIndicator color={palette.label} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <Ionicons name={icon} size={16} color={palette.label} /> : null}
          <ThemedText
            type="label"
            style={[{ color: palette.label }, variant === 'ghost' && styles.ghostLabel]}>
            {title}
          </ThemedText>
        </View>
      )}
    </PressableScale>
  );
}

/**
 * Round icon button.
 *
 * The brief asks for glyphs that float or sit in soft pale circles rather than
 * heavy boxes, so this is a tinted disc with no border.
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 18,
  inverted = false,
  badge,
  style,
}: {
  icon: IoniconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  inverted?: boolean;
  badge?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <PressableSurface
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        styles.iconButton,
        {
          backgroundColor: inverted ? theme.inverted : theme.backgroundSelected,
        },
        style,
      ]}>
      <Ionicons
        name={icon}
        size={size}
        color={inverted ? theme.onInverted : theme.text}
        // Thin strokes keep the glyph in the same voice as the type.
        style={styles.iconGlyph}
      />
      {badge}
    </PressableSurface>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Segmented control.
 *
 * A pill track with a filled pill for the chosen segment. Selection eases into
 * place over the system's standard duration rather than snapping.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <View style={[styles.segmented, { backgroundColor: theme.surfaceAlt }, style]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableSurface
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.select();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected && [
                { backgroundColor: theme.backgroundElement },
                Elevation.sm,
              ],
            ]}>
            <ThemedText
              type="label"
              style={{ color: selected ? theme.text : theme.textSecondary }}>
              {option.label}
            </ThemedText>
          </PressableSurface>
        );
      })}
    </View>
  );
}

/**
 * Floating action button.
 *
 * A pill in the primary tone, lifted on the largest shadow in the system. The
 * brief's shapes are soft, so this reads as a pebble resting on the page.
 *
 * `variant="secondary"` is the paper version, for a second floating action that
 * must not compete with the primary one. `offset` lifts a button clear of another
 * so two can stack above the tab bar.
 */
export function Fab({
  onPress,
  icon = 'add',
  accessibilityLabel,
  variant = 'primary',
  offset = 0,
}: {
  onPress: () => void;
  icon?: IoniconName;
  accessibilityLabel: string;
  variant?: 'primary' | 'secondary';
  /** Extra distance above the tab bar, for stacking. */
  offset?: number;
}) {
  const theme = useTheme();
  const haptics = useHaptics();
  const insets = useScreenInsets();

  const surface = variant === 'primary' ? theme.tint : theme.backgroundElement;
  const glyph = variant === 'primary' ? theme.onTint : theme.sageText;

  return (
    <View
      style={[styles.fabContainer, { bottom: insets.bottom + Spacing.three + offset }]}
      pointerEvents="box-none">
      <PressableScale
        onPress={() => {
          haptics.press();
          onPress();
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={[styles.fab, Elevation.lg, { backgroundColor: surface }]}>
        <Ionicons name={icon} size={24} color={glyph} />
      </PressableScale>
    </View>
  );
}

/**
 * Switch.
 *
 * A rounded track with a round knob — the platform `Switch` is tinted with the
 * system accent, which would fight the palette, so the control is rebuilt in the
 * product's own tones. The knob slides rather than jumping.
 */
export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <PressableSurface
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        haptics.select();
        onChange(!value);
      }}
      style={[
        styles.toggleTrack,
        {
          backgroundColor: value ? theme.tint : theme.backgroundSelected,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <View
        style={[
          styles.toggleKnob,
          {
            backgroundColor: value ? theme.onTint : theme.backgroundElement,
            transform: [{ translateX: value ? 22 : 0 }],
          },
          Elevation.sm,
        ]}
      />
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    // Stretch across the container's width. Deliberately `alignSelf` and not
    // `flex: 1`: inside a bounded flex column, `flex: 1` also grows the button
    // vertically, which turned the error screen's Reload button into a
    // full-height block. Row layouts that need equal widths pass an explicit
    // `flex: 1` via `style` instead.
    alignSelf: 'stretch',
  },
  button: {
    minHeight: 52,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  ghostLabel: {
    textDecorationLine: 'underline',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    opacity: 0.92,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.four,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
  },
});
