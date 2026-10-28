import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Elevation, Line, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';

/**
 * Structural surfaces — Botanical / Organic Serif.
 *
 * The system this replaced drew its structure with lines: a card was paper
 * bounded by a rule, and a section was opened by a heavy stroke. Here structure
 * comes from *soft elevation and space* instead. A card is a rounded plate
 * resting on the page, a section is separated by nothing at all, and the few
 * lines that remain are quiet enough to read as texture rather than structure.
 */

/**
 * A horizontal rule. Kept because a handful of screens still separate a header
 * from its content with one, but the default is now the hairline: in this system
 * a heavy stroke would be the loudest thing on the page.
 */
export function Rule({
  weight = Line.hairline,
  style,
}: {
  weight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return <View style={[{ height: weight, backgroundColor: theme.rule }, style]} />;
}

/** Hairline divider for rows inside a group. Decorative, so it stays light. */
export function Divider({ inset = 0, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height: Line.hairline, backgroundColor: theme.borderLight, marginLeft: inset },
        style,
      ]}
    />
  );
}

/**
 * A bounded block of content.
 *
 * Rounded generously, filled with true white against the alabaster ground, and
 * lifted on the brief's soft diffused shadow. `inverted` swaps to the
 * deep-forest plate, which is the one place the page raises its voice.
 */
export function Card({
  children,
  style,
  padded = true,
  onPress,
  inverted = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  inverted?: boolean;
}) {
  const theme = useTheme();

  const surface: StyleProp<ViewStyle> = [
    styles.card,
    inverted ? Elevation.lg : Elevation.md,
    {
      backgroundColor: inverted ? theme.inverted : theme.backgroundElement,
    },
    padded && styles.cardPadded,
    style,
  ];

  if (onPress) {
    return (
      <PressableSurface
        onPress={onPress}
        style={surface}
        pressedStyle={[
          styles.cardPressed,
          {
            backgroundColor: inverted ? theme.inverted : theme.backgroundSelected,
          },
        ]}>
        {children}
      </PressableSurface>
    );
  }

  return <View style={surface}>{children}</View>;
}

/** Tracked uppercase eyebrow with an optional text action on the right. */
export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.sectionHeader, style]}>
      <ThemedText type="label" themeColor="textSecondary">
        {title}
      </ThemedText>
      {action && onAction ? (
        <PressableSurface onPress={onAction} hitSlop={12}>
          <ThemedText type="label" style={{ color: theme.sageText }}>
            {action}
          </ThemedText>
        </PressableSurface>
      ) : null}
    </View>
  );
}

/**
 * Selection chip. A pill that fills with the primary tone when chosen, sitting
 * on the soft clay ground when it is not.
 */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <PressableSurface
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.tint : theme.surfaceAlt,
        },
      ]}>
      <ThemedText type="label" style={{ color: selected ? theme.onTint : theme.textSecondary }}>
        {label}
      </ThemedText>
    </PressableSurface>
  );
}

/**
 * Status badge.
 *
 * Tonal rather than inverted: each tone takes its own muted wash and its own
 * readable ink, so an alert reads as an alert without a black block.
 */
export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}) {
  const theme = useTheme();

  const palette = {
    neutral: { background: theme.surfaceAlt, label: theme.textSecondary },
    positive: { background: theme.positiveMuted, label: theme.positive },
    negative: { background: theme.negativeMuted, label: theme.negative },
    warning: { background: theme.warningMuted, label: theme.warning },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <ThemedText type="label" style={{ color: palette.label }}>
        {label}
      </ThemedText>
    </View>
  );
}

/**
 * A figure in a row of figures.
 *
 * No rules and no boxes: the columns are held apart by space alone, which is
 * what keeps a row of three numbers from reading as three competing cards.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  style,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const ink =
    tone === 'positive' ? theme.positive : tone === 'negative' ? theme.negative : theme.text;

  return (
    <View style={[styles.statTile, style]}>
      <ThemedText type="label" themeColor="textTertiary" numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText
        type="amountLarge"
        numberOfLines={1}
        // Safety net for unusually long values: shrink rather than truncate, so
        // a figure is never shown as "$3,44…".
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[styles.statValue, { color: ink }]}>
        {value}
      </ThemedText>
      {hint ? (
        <ThemedText type="caption" themeColor="textTertiary" numberOfLines={1}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/**
 * A one-line door to more.
 *
 * The pattern this system uses to keep a screen quiet: a screen states the
 * headline and then *names* its detail rather than showing it. A row is a label,
 * an optional figure, and a chevron — the content lives in the sheet it opens.
 */
export function SummaryRow({
  label,
  hint,
  value,
  onPress,
  showDivider = true,
}: {
  label: string;
  hint?: string;
  value?: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const theme = useTheme();

  return (
    <View>
      <PressableSurface onPress={onPress} accessibilityRole="button" style={styles.summaryRow}>
        <View style={styles.summaryText}>
          <ThemedText type="heading" numberOfLines={1}>
            {label}
          </ThemedText>
          {hint ? (
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {hint}
            </ThemedText>
          ) : null}
        </View>

        {value ? (
          <ThemedText type="amount" numberOfLines={1}>
            {value}
          </ThemedText>
        ) : null}

        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </PressableSurface>

      {showDivider ? <Divider /> : null}
    </View>
  );
}

export type { ThemeColor };

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardPadded: {
    padding: Spacing.four,
  },
  cardPressed: {
    opacity: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  statTile: {
    flex: 1,
    gap: Spacing.one,
  },
  statValue: {
    marginTop: Spacing.half,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 64,
  },
  summaryText: {
    flex: 1,
    gap: Spacing.half,
  },
});
