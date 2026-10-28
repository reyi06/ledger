import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display/400Regular_Italic';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_500Medium } from '@expo-google-fonts/source-sans-3/500Medium';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';

import { Colors, Motion } from '@/constants/theme';
import { Grain } from '@/components/grain';
import { useAppLock } from '@/hooks/use-app-lock';
import { useResolvedScheme } from '@/hooks/use-theme';
import { startLedgerPersistence } from '@/store/persistence';
import { useAuthStore } from '@/store/auth-store';
import { useLedgerStore } from '@/store/ledger-store';
import { useSettingsStore } from '@/store/settings-store';

SplashScreen.preventAutoHideAsync();

/**
 * Expo Router renders this in place of the tree if a render throws, so a crash
 * shows a branded, recoverable screen rather than a white page. The component
 * lives outside `src/app/` because everything in that directory is a route.
 */
export { ErrorBoundary } from '@/components/error-boundary';

/**
 * Root layout.
 *
 * Boots the three stores, wires autosave, and gates the app behind the offline
 * lock. Splash stays up until storage has been read, so the first frame the
 * user sees is already correct.
 */
export default function RootLayout() {
  const scheme = useResolvedScheme();
  const colors = Colors[scheme];

  /**
   * Seven faces, one per role in the type scale: Playfair Display for headlines
   * (semibold, bold, and an italic for the brief's single-word emphasis), Source
   * Sans 3 for reading, interface text and tabular figures, and JetBrains Mono
   * for the machine-facing strings in the error boundary. Nothing else is loaded,
   * so the bundle carries no unused weights.
   */
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    JetBrainsMono_400Regular,
  });

  const authStatus = useAuthStore((state) => state.status);
  const ledgerHydrated = useLedgerStore((state) => state.hydrated);
  const settingsHydrated = useSettingsStore((state) => state.hydrated);

  useEffect(() => {
    void useSettingsStore.getState().hydrate();
    void useAuthStore.getState().hydrate();
    void useLedgerStore.getState().hydrate();
    return startLedgerPersistence();
  }, []);

  useAppLock();

  // The splash stays up until type and data are both ready, so the first frame
  // the user sees is already set in the right face.
  const ready = fontsLoaded && authStatus !== 'loading' && ledgerHydrated && settingsHydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const unlocked = authStatus === 'unlocked';
  const onboarding = authStatus === 'onboarding';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              // This system moves slowly and eases out. A hard slide would be
              // the one abrupt gesture in the app, so screens rise and settle.
              animation: 'fade_from_bottom',
              animationDuration: Motion.base,
            }}>
            <Stack.Protected guard={!unlocked}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected
              guard={unlocked}
              redirectTo={onboarding ? '/welcome' : '/unlock'}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="tour" options={{ animation: 'fade' }} />
              <Stack.Screen name="transaction/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="transaction/[id]" />
              <Stack.Screen name="account/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="transfer" options={{ presentation: 'modal' }} />
              <Stack.Screen name="recurring/index" />
              <Stack.Screen name="recurring/new" options={{ presentation: 'modal' }} />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>

        {/* Above the navigator, matching the brief's `fixed inset-0 z-50`. */}
        <Grain />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
