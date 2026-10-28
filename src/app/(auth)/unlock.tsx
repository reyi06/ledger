import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { PIN_LENGTH } from '@/domain/auth';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { ThemedText } from '@/components/themed-text';
import { BotanicalMark } from '@/components/botanical-mark';
import { Block, Reveal } from '@/components/motion';
import { IconButton } from '@/components/ui/controls';
import { Keypad } from '@/components/ui/keypad';
import { Screen } from '@/components/ui/screen';
import { PinDots } from '@/components/pin-dots';

/**
 * Lock screen.
 *
 * A six-digit PIN pad plus an optional biometric shortcut. Verification fires the
 * moment the sixth digit lands — no confirm button, and no effect watching the
 * PIN length, which keeps the whole flow inside the touch handler.
 *
 * The greeting is the initials in a soft disc over the word "Welcome back", and
 * nothing else: the line that used to spell out the name and the PIN length told
 * the user something they had just been told twice on the previous two screens.
 */
export default function UnlockScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const profile = useAuthStore((state) => state.profile);
  const busy = useAuthStore((state) => state.busy);
  const lastError = useAuthStore((state) => state.lastError);
  const biometrics = useAuthStore((state) => state.biometrics);
  const unlock = useAuthStore((state) => state.unlock);
  const unlockWithBiometrics = useAuthStore((state) => state.unlockWithBiometrics);
  const clearError = useAuthStore((state) => state.clearError);

  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const attemptedBiometrics = useRef(false);

  // Offer biometrics once per lock, but never block PIN entry.
  useEffect(() => {
    if (attemptedBiometrics.current) return;
    attemptedBiometrics.current = true;
    if (profile?.biometricsEnabled && biometrics.available) {
      void unlockWithBiometrics();
    }
  }, [profile?.biometricsEnabled, biometrics.available, unlockWithBiometrics]);

  if (!profile) return <Redirect href="/welcome" />;

  const canUseBiometrics = profile.biometricsEnabled && biometrics.available;

  const submit = async (candidate: string) => {
    const ok = await unlock(candidate);

    if (ok) {
      haptics.success();
      return;
    }

    haptics.error();
    setShake(true);
    setPin('');
    setTimeout(() => setShake(false), 600);
  };

  const handleDigit = (digit: string) => {
    if (busy || pin.length >= PIN_LENGTH) return;
    clearError();
    const next = `${pin}${digit}`;
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  return (
    <Screen scroll={false} style={styles.container}>
      <Block style={styles.header}>
        <Reveal>
          <BotanicalMark width={100} />
        </Reveal>

        <Reveal delay={80}>
          <ThemedText type="title">{t('unlock.welcomeBack')}</ThemedText>
        </Reveal>
      </Block>

      <View style={styles.middle}>
        <PinDots length={PIN_LENGTH} filled={pin.length} error={shake} />

        <ThemedText
          type="small"
          style={[styles.message, { color: lastError ? theme.negative : theme.textTertiary }]}>
          {lastError ?? ' '}
        </ThemedText>
      </View>

      <Block style={styles.keypad}>
        <Keypad
          disabled={busy}
          onDigit={handleDigit}
          onBackspace={() => {
            clearError();
            setPin((current) => current.slice(0, -1));
          }}
          leading={
            canUseBiometrics ? (
              <IconButton
                icon="finger-print"
                size={26}
                inverted
                accessibilityLabel={`Unlock with ${biometrics.label}`}
                onPress={() => void unlockWithBiometrics()}
                style={styles.biometric}
              />
            ) : undefined
          }
        />
      </Block>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  middle: {
    alignItems: 'center',
  },
  message: {
    minHeight: 20,
  },
  keypad: {
    paddingBottom: Spacing.three,
  },
  biometric: {
    width: '100%',
    height: 64,
    borderRadius: Radius.lg,
  },
});
