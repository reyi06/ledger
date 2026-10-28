import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PIN_LENGTH } from '@/domain/auth';
import type { TranslationParams } from '@/i18n';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { ThemedText } from '@/components/themed-text';
import { Keypad } from '@/components/ui/keypad';
import { Sheet } from '@/components/ui/sheet';
import { PinDots } from '@/components/pin-dots';

type Phase = 'current' | 'next' | 'confirm';

const HEADINGS: Record<
  Phase,
  { titleKey: string; subtitleKey: string; subtitleParams?: TranslationParams }
> = {
  current: {
    titleKey: 'pin.enterCurrent',
    subtitleKey: 'pin.yourPin',
    subtitleParams: { count: PIN_LENGTH },
  },
  next: {
    titleKey: 'pin.chooseNew',
    subtitleKey: 'pin.digits',
    subtitleParams: { count: PIN_LENGTH },
  },
  confirm: { titleKey: 'pin.confirmNew', subtitleKey: 'pin.enterOnceMore' },
};

/**
 * Change PIN flow.
 *
 * The sheet renders its contents only while open, so mounting is the reset —
 * there is no effect synchronising local state to visibility.
 */
export function ChangePinSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('current');

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t(HEADINGS[phase].titleKey)}
      subtitle={t(HEADINGS[phase].subtitleKey, HEADINGS[phase].subtitleParams)}>
      {visible ? <ChangePinFlow onClose={onClose} onPhaseChange={setPhase} /> : null}
    </Sheet>
  );
}

function ChangePinFlow({
  onClose,
  onPhaseChange,
}: {
  onClose: () => void;
  onPhaseChange: (phase: Phase) => void;
}) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const changePin = useAuthStore((state) => state.changePin);

  const [phase, setPhase] = useState<Phase>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const goTo = (next: Phase) => {
    setPhase(next);
    onPhaseChange(next);
  };

  const fail = (text: string, resetTo: Phase) => {
    haptics.error();
    setShake(true);
    setMessage(text);
    setTimeout(() => {
      setShake(false);
      setMessage(null);
      setPin('');
      setCurrentPin('');
      setNextPin('');
      goTo(resetTo);
    }, 750);
  };

  const advance = (entered: string) => {
    if (phase === 'current') {
      setCurrentPin(entered);
      setPin('');
      goTo('next');
      return;
    }

    if (phase === 'next') {
      setNextPin(entered);
      setPin('');
      goTo('confirm');
      return;
    }

    if (entered !== nextPin) {
      fail(t('pin.mismatch'), 'next');
      return;
    }

    void changePin(currentPin, entered).then((ok) => {
      if (ok) {
        haptics.success();
        onClose();
        return;
      }
      fail(t('pin.currentIncorrect'), 'current');
    });
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setMessage(null);
    const next = `${pin}${digit}`;
    setPin(next);
    if (next.length === PIN_LENGTH) advance(next);
  };

  return (
    <View style={styles.body}>
      <PinDots length={PIN_LENGTH} filled={pin.length} error={shake} />
      <ThemedText
        type="small"
        style={[styles.message, { color: message ? theme.negative : theme.textTertiary }]}>
        {message ?? ' '}
      </ThemedText>

      <Keypad
        onDigit={handleDigit}
        onBackspace={() => {
          setMessage(null);
          setPin((value) => value.slice(0, -1));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 8,
  },
  message: {
    textAlign: 'center',
    minHeight: 20,
  },
});
