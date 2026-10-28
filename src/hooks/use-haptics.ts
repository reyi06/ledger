import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';

import { useSettingsStore } from '@/store/settings-store';

/**
 * Haptics that respect the user's preference and never throw.
 *
 * On the simulator and on web the native module resolves to a no-op or rejects,
 * so every call is fire-and-forget.
 */
export function useHaptics() {
  const enabled = useSettingsStore((state) => state.hapticsEnabled);

  const run = useCallback(
    (trigger: () => Promise<unknown>) => {
      if (!enabled) return;
      void trigger().catch(() => undefined);
    },
    [enabled],
  );

  return useMemo(
    () => ({
      tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      press: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
      select: () => run(() => Haptics.selectionAsync()),
      success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
      warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
      error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    }),
    [run],
  );
}
