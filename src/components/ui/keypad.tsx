import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/use-haptics';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';

/**
 * Numeric keypad for PIN entry.
 *
 * A custom pad rather than the system keyboard: it needs no keyboard-avoidance
 * work, it is far larger, and the digits can be set in the display serif so the
 * lock screen reads like a printed cover rather than a form.
 *
 * The keys are soft sage pebbles on the page rather than ruled cells. A grid of
 * bordered squares read as a spreadsheet; a grid of quiet discs reads as a pad of
 * buttons, which is what it is.
 */
export function Keypad({
  onDigit,
  onBackspace,
  leading,
  disabled = false,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  /** Optional action in the bottom-left slot, typically biometric unlock. */
  leading?: ReactNode;
  disabled?: boolean;
}) {
  const theme = useTheme();

  const rows: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.pad}>
      {rows.map((row) => (
        <View key={row.join()} style={styles.row}>
          {row.map((digit) => (
            <Key key={digit} disabled={disabled} onPress={() => onDigit(digit)}>
              <ThemedText type="subtitle">{digit}</ThemedText>
            </Key>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        {leading ? <View style={styles.keySlot}>{leading}</View> : <View style={styles.keySlot} />}

        <Key disabled={disabled} onPress={() => onDigit('0')}>
          <ThemedText type="subtitle">0</ThemedText>
        </Key>

        <Key disabled={disabled} onPress={onBackspace} accessibilityLabel="Delete digit">
          <Ionicons name="backspace-outline" size={22} color={theme.sageText} />
        </Key>
      </View>
    </View>
  );
}

function Key({
  children,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <PressableSurface
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        styles.key,
        {
          backgroundColor: theme.tintMuted,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      {children}
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  pad: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySlot: {
    flex: 1,
    height: 64,
  },
});
