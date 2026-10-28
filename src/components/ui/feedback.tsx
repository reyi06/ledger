import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/controls';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Empty states and progress.
 */

/**
 * Placeholder for an empty collection.
 *
 * The glyph sits in a soft pale disc rather than a ruled box, and there is no
 * rule above the title: in this system an empty state is a quiet, rounded pause,
 * not a framed notice.
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
}: {
  icon?: IoniconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.empty, compact && styles.emptyCompact]}>
      {icon ? (
        <View style={[styles.emptyIcon, { backgroundColor: theme.tintMuted }]}>
          <Ionicons name={icon} size={22} color={theme.sageText} />
        </View>
      ) : null}
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText type="body" themeColor="textSecondary">
          {body}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          fullWidth={false}
          style={styles.emptyAction}
        />
      ) : null}
    </View>
  );
}

/**
 * Progress, drawn as a soft pill.
 *
 * Sage while there is room, terracotta once the limit is passed. The colour is a
 * reinforcement rather than the message — the caller states the over-budget
 * condition in words as well, so the state survives a grayscale screen.
 */
export function ProgressBar({
  ratio,
  over = false,
  height = 8,
  style,
}: {
  ratio: number;
  over?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: theme.surfaceAlt },
        style,
      ]}>
      <View
        style={{
          height,
          width: `${clamped * 100}%`,
          borderRadius: height / 2,
          backgroundColor: over ? theme.terracotta : theme.sage,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  emptyCompact: {
    paddingVertical: Spacing.four,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: Spacing.three,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
