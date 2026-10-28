import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Line, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  /** Optional leading glyph, set in muted ink rather than as a coloured adornment. */
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
}

/**
 * Text input.
 *
 * The brief allows either an underline or a pill with a very light ground; this
 * takes the second, because a filled field reads as softer against the grain and
 * gives the glyph somewhere to sit. Focus is the brief's prescribed treatment: a
 * sage border that eases in, never a harsh focus ring.
 */
export function TextField({
  label,
  error,
  hint,
  icon,
  multiline,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, style]}>
      {label ? (
        <ThemedText type="label" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}

      <View
        style={[
          styles.inputRow,
          // A multiline field is taller, so a centred glyph would drift below the
          // first line of text. Align it to the first line instead.
          multiline && styles.inputRowTop,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: error ? theme.terracotta : focused ? theme.sage : 'transparent',
          },
        ]}>
        {icon ? <Ionicons name={icon} size={18} color={theme.textTertiary} /> : null}
        <TextInput
          {...rest}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={theme.textTertiary}
          style={[Type.field, styles.input, { color: theme.text }]}
        />
      </View>

      {error ? (
        <ThemedText type="caption" style={{ color: theme.terracottaText }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="caption" themeColor="textTertiary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/**
 * Large numeric entry for transaction and budget amounts.
 *
 * Set in Playfair at display size: in this system the number *is* the graphic,
 * so entering an amount should feel like setting type rather than filling a
 * form. The currency symbol sits in muted ink so the figure carries the weight.
 */
export function AmountField({
  value,
  onChangeText,
  symbol,
  error,
  autoFocus,
  tone = 'neutral',
}: {
  value: string;
  onChangeText: (value: string) => void;
  symbol: string;
  error?: string | null;
  autoFocus?: boolean;
  /** Kept for call-site compatibility; direction is shown by sign, not hue. */
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  const theme = useTheme();
  void tone;

  return (
    <View style={styles.amountField}>
      <View style={styles.amountRow}>
        <ThemedText style={[Type.amountInput, { color: theme.textTertiary }]}>
          {symbol}
        </ThemedText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          inputMode="decimal"
          autoFocus={autoFocus}
          placeholder="0.00"
          placeholderTextColor={theme.textTertiary}
          accessibilityLabel="Amount"
          style={[Type.amountInput, styles.amountInput, { color: theme.text }]}
        />
      </View>

      {error ? (
        <ThemedText type="caption" style={{ color: theme.terracottaText }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: Line.thin,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
  inputRowTop: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    // Removes the default web focus ring; the container border is the treatment.
    // Zero-width rather than `outlineStyle: 'none'` — RN types only allow
    // solid/dotted/dashed, and this still removes the browser's focus ring.
    outlineWidth: 0,
  },
  amountField: {
    gap: Spacing.two,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  amountInput: {
    minWidth: 140,
    textAlign: 'center',
    padding: 0,
    // Zero-width rather than `outlineStyle: 'none'` — RN types only allow
    // solid/dotted/dashed, and this still removes the browser's focus ring.
    outlineWidth: 0,
  },
});
