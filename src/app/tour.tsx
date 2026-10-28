import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useSettingsStore } from '@/store/settings-store';
import { ThemedText } from '@/components/themed-text';
import { Arch } from '@/components/botanical-mark';
import { PressableSurface, Reveal } from '@/components/motion';
import { Button } from '@/components/ui/controls';
import { Screen } from '@/components/ui/screen';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * The seven steps, by key.
 *
 * The copy lives in `src/i18n` so the tour can be read in Filipino; the icons and
 * the order stay here, because they are structure rather than language.
 */
const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'] as const;

const STEP_ICONS: readonly IoniconName[] = [
  'wallet-outline',
  'pie-chart-outline',
  'receipt-outline',
  'speedometer-outline',
  'bar-chart-outline',
  'lock-closed-outline',
  'add-circle-outline',
];

/**
 * The guided tour, shown once after onboarding.
 *
 * Seven steps, because the app has five screens and two ideas a person has to
 * know before any of them make sense: that the numbers are computed locally, and
 * that there is nowhere for them to go.
 *
 * It is built from the same parts as the rest of the app rather than as a
 * separate slideshow: the arch is the wordmark's own arch, the type roles are the
 * app's roles, and the step change is the same fade-and-rise the screens use — so
 * the tour teaches the interface's own rhythm while describing it.
 *
 * Every step's copy says what the screen is *for*, not what its buttons are
 * called. A tour that reads out labels teaches nothing the user could not see.
 */
export default function TourScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const setHasSeenTour = useSettingsStore((state) => state.setHasSeenTour);

  const key = `tour.${STEP_KEYS[step]}`;
  const isLast = step === STEP_ICONS.length - 1;

  const finish = () => {
    setHasSeenTour(true);
    router.replace('/');
  };

  return (
    <Screen scroll={false} style={styles.container}>
      <View style={styles.top}>
        <ThemedText type="label" themeColor="textTertiary">
          {`${String(step + 1).padStart(2, '0')} / ${String(STEP_ICONS.length).padStart(2, '0')}`}
        </ThemedText>

        {isLast ? null : (
          <PressableSurface
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.skip')}>
            <ThemedText type="label" themeColor="textSecondary">
              {t('common.skip')}
            </ThemedText>
          </PressableSurface>
        )}
      </View>

      {/* Keyed on the step, so each one replays the entrance rather than the
          text swapping in place. */}
      <View key={step} style={styles.stage}>
        <Reveal>
          <Arch width={140}>
            <Ionicons name={STEP_ICONS[step]} size={44} color={theme.sageText} />
          </Arch>
        </Reveal>

        <Reveal delay={120} style={styles.copy}>
          <ThemedText type="title" style={styles.title}>
            {t(`${key}.lead`)}{' '}
            <ThemedText type="title" style={[styles.title, styles.emphasis]}>
              {t(`${key}.emphasis`)}
            </ThemedText>
          </ThemedText>

          <ThemedText type="body" themeColor="textSecondary" style={styles.body}>
            {t(`${key}.body`)}
          </ThemedText>
        </Reveal>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {STEP_ICONS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: index === step ? 22 : 8,
                  backgroundColor: index === step ? theme.tint : theme.border,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={isLast ? t('common.start') : t('common.next')}
          icon={isLast ? 'checkmark' : 'arrow-forward'}
          onPress={() => (isLast ? finish() : setStep((value) => value + 1))}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  stage: {
    alignItems: 'center',
    gap: Spacing.five,
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  emphasis: {
    fontFamily: Fonts.displayItalic,
  },
  body: {
    textAlign: 'center',
    maxWidth: 320,
  },
  bottom: {
    gap: Spacing.four,
    paddingBottom: Spacing.two,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: {
    height: 8,
    borderRadius: Radius.pill,
  },
});
