import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

/**
 * The native tab bar.
 *
 * System chrome cannot be given serif labels or rounded corners, so the design
 * language is carried by the parts it does expose: forest ink for the selected
 * tint, secondary ink for the rest, and an alabaster background. Screens opt out
 * of automatic content insets so `Screen` owns padding on every platform.
 */
export default function AppTabs() {
  const scheme = useResolvedScheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.text}
      labelStyle={{ color: colors.textSecondary, selected: { color: colors.text } }}
      // Android's Material 3 tab bar draws a coloured pill behind the selected
      // item by default. Transparent leaves the icon tint as the selection cue,
      // which is the same language the web bar and the segmented control use.
      indicatorColor="transparent"
      minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>{t('tab.overview')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
          md="pie_chart"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="activity" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>{t('tab.activity')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="receipt_long" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budgets" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>{t('tab.budgets')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gauge" md="savings" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="insights" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>{t('tab.insights')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="insights"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>{t('tab.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
