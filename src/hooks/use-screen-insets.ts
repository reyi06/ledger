import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, WebTabBarInset } from '@/constants/theme';

export interface ScreenInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Insets for a tab screen.
 *
 * Native tabs are told not to adjust content insets automatically (see
 * `app-tabs.tsx`), so screens manage their own padding. That keeps layouts
 * identical across platforms instead of relying on two different native
 * behaviours — and it means the custom web nav bar has to be reserved here too,
 * since the web has no native tab bar to report one.
 */
export function useScreenInsets(): ScreenInsets {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      top: insets.top,
      bottom:
        Platform.OS === 'ios'
          ? insets.bottom + BottomTabInset
          : Platform.OS === 'android'
            ? BottomTabInset
            : WebTabBarInset,
      left: insets.left,
      right: insets.right,
    }),
    [insets],
  );
}
