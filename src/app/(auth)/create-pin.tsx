import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { PIN_LENGTH } from '@/domain/auth';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemedText } from '@/components/themed-text';
import { Block } from '@/components/motion';
import { IconButton } from '@/components/ui/controls';
import { Keypad } from '@/components/ui/keypad';
import { Screen } from '@/components/ui/screen';
import { PinDots } from '@/components/pin-dots';

type Phase = 'create' | 'confirm';

/**
 * Onboarding step two: choose and confirm the PIN.
 *
 * The PIN lives only in this component's state until both entries match, then
 * it is hashed and only the hash is persisted.
 */
export default function CreatePinScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ name?: string }>();
  const displayName = params.name?.trim() || 'there';

  const createProfile = useAuthStore((state) => state.createProfile);
  const busy = useAuthStore((state) => state.busy);
  const hasSeenTour = useSettingsStore((state) => state.hasSeenTour);

  const [phase, setPhase] = useState<Phase>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const advance = (entered: string) => {
    if (phase === 'create') {
      // Brief pause so the sixth dot is visible before the screen changes.
      setTimeout(() => {
        setFirstPin(entered);
        setPin('');
        setPhase('confirm');
        haptics.tap();
      }, 120);
      return;
    }

    if (entered === firstPin) {
      haptics.success();
      void createProfile(displayName, entered).then(() => {
        // A first run is walked through the tour. Someone who has signed out and
        // set a new PIN has already seen it, and should land on the app.
        router.replace(hasSeenTour ? '/' : '/tour');
      });
      return;
    }

    haptics.error();
    setMessage(t('pin.mismatch'));
    setTimeout(() => {
      setPin('');
      setFirstPin('');
      setPhase('create');
      setMessage(null);
    }, 800);
  };

  const handleDigit = (digit: string) => {
    if (busy || pin.length >= PIN_LENGTH) return;
    setMessage(null);
    const next = `${pin}${digit}`;
    setPin(next);
    if (next.length === PIN_LENGTH) advance(next);
  };

  const heading = phase === 'create' ? t('pin.create') : t('pin.confirm');
  const subheading =
    phase === 'create'
      ? t('pin.createBody', { count: PIN_LENGTH })
      : t('pin.confirmBody');

  const goBack = () => {
    if (phase === 'confirm') {
      setPhase('create');
      setPin('');
      setFirstPin('');
      setMessage(null);
      return;
    }
    router.back();
  };

  return (
    <Screen scroll={false} style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={goBack} />
        <View style={styles.headerText}>
          <ThemedText type="title">{heading}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {subheading}
          </ThemedText>
        </View>
      </View>

      <View style={styles.middle}>
        <PinDots length={PIN_LENGTH} filled={pin.length} error={Boolean(message)} />
        <ThemedText
          type="small"
          style={[styles.message, { color: message ? theme.negative : theme.textTertiary }]}>
          {message ?? (phase === 'confirm' ? t('pin.matching') : ' ')}
        </ThemedText>
      </View>

      <Block style={styles.keypad}>
        <Keypad
          disabled={busy}
          onDigit={handleDigit}
          onBackspace={() => {
            setMessage(null);
            setPin((current) => current.slice(0, -1));
          }}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
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
});
