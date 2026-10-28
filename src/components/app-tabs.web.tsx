import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Line, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from '@/components/themed-text';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Web fallback for the tab bar.
 *
 * There is no system tab bar on the web, so native tabs degrade to a basic
 * implementation. This replaces it with the same idea the native bar carries:
 * a paper ground, and the current route marked by tone rather than by a block
 * of ink.
 *
 * The selected cell used to fill with `theme.inverted`, which in this system is
 * the full deep-forest plate — a fifth of the screen turned solid black for a
 * navigation state. It is now the same pale-sage pill the segmented control uses,
 * so "selected" reads the same way everywhere.
 */

const TABS: { name: string; href: Href; labelKey: string; icon: IoniconName }[] = [
  { name: 'index', href: '/', labelKey: 'tab.overview', icon: 'pie-chart-outline' },
  { name: 'activity', href: '/activity', labelKey: 'tab.activity', icon: 'receipt-outline' },
  { name: 'budgets', href: '/budgets', labelKey: 'tab.budgets', icon: 'speedometer-outline' },
  { name: 'insights', href: '/insights', labelKey: 'tab.insights', icon: 'bar-chart-outline' },
  { name: 'settings', href: '/settings', labelKey: 'tab.settings', icon: 'settings-outline' },
];

export default function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <NavBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon}>{t(tab.labelKey)}</TabButton>
            </TabTrigger>
          ))}
        </NavBar>
      </TabList>
    </Tabs>
  );
}

/** `TabList asChild` clones its child and injects a ref, so accept one. */
function NavBar({ children, ref }: { children?: ReactNode; ref?: unknown }) {
  void ref;
  const theme = useTheme();

  return (
    <View style={styles.navOuter} pointerEvents="box-none">
      <View
        style={[
          styles.navInner,
          { backgroundColor: theme.backgroundElement, borderTopColor: theme.borderLight },
        ]}>
        {children}
      </View>
    </View>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ref: _injectedRef,
  ...props
}: TabTriggerSlotProps & { icon?: IoniconName }) {
  // `ref` comes from the trigger's slot contract and is incompatible with
  // `Pressable`'s own ref, so it is deliberately dropped here.
  void _injectedRef;
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      style={[
        styles.tab,
        { backgroundColor: isFocused ? theme.tintMuted : 'transparent' },
      ]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={isFocused ? theme.sageText : theme.textSecondary}
        />
      ) : null}
      <ThemedText
        type="label"
        style={{ color: isFocused ? theme.sageText : theme.textSecondary }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  navOuter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderTopWidth: Line.hairline,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    minHeight: 48,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
  },
});
