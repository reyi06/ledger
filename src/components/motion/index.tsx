import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Motion } from '@/constants/theme';

/**
 * Motion primitives — Botanical / Organic Serif.
 *
 * This system is the inverse of the one it replaced. Where the previous
 * language was near-instant and binary, everything here moves slowly and
 * gracefully, as if suspended in honey: entrances fade up over half a second,
 * transitions ease out significantly, and nothing snaps.
 *
 * Two rules keep that from becoming an accessibility problem:
 *
 *  - Press feedback stays *fast*. A press is confirmation, not transition; the
 *    user should never wait on the interface to acknowledge a tap.
 *  - Every entrance honours the platform's Reduce Motion setting, and content is
 *    visible by default if it is on. An element hidden by animation timing is
 *    indistinguishable from a missing element.
 */

export { Motion };

/** The brief's curve: eased out, significantly. */
export const easeOut = Easing.out(Easing.cubic);

/** Reanimated-style timing options for callers that need the raw values. */
export const timing = {
  duration: Motion.base,
  easing: easeOut,
} as const;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/**
 * Structural wrapper. The design language has no layout responsibilities of its
 * own, so this is deliberately a plain `View` — it exists to keep screen markup
 * readable and to give future layout concerns one place to live.
 */
export function Block({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}

/**
 * Fade-and-rise entrance.
 *
 * The single reveal used across the app, so the whole product shares one
 * rhythm rather than each screen inventing its own. `delay` is meant to be
 * stepped in small multiples (`index * 60`) for the staggered rhythm the brief
 * asks for; it is capped because a long stagger reads as slow, not graceful.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 16,
  style,
}: {
  children: ReactNode;
  /** Milliseconds. Values above 400 are clamped — a long stagger feels broken. */
  delay?: number;
  /** Vertical travel in points. */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = usePrefersReducedMotion();
  // Held in state rather than a ref: the value is read during render to build the
  // interpolated style, and a ref may not be read there.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Motion.base,
      delay: Math.min(delay, 400),
      easing: easeOut,
      // react-native-web has no native driver; asking for one only warns.
      useNativeDriver: Platform.OS !== 'web',
    });

    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduced]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
            // A hair of scale, so content settles into place rather than sliding
            // on a rail. Cheap, and it is most of what separates "faded in" from
            // "arrived".
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * Press feedback. Gentle rather than binary: the surface eases to 70% and a
 * hair smaller, so a tap feels like touching something soft.
 */
const PRESSED_DEFAULT: ViewStyle = { opacity: 0.7 };

interface PressableSurfaceProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override the pressed treatment, e.g. to tint a card instead of dimming it. */
  pressedStyle?: StyleProp<ViewStyle>;
}

export function PressableSurface({
  children,
  style,
  pressedStyle,
  ...rest
}: PressableSurfaceProps) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [style, pressed && (pressedStyle ?? PRESSED_DEFAULT)]}>
      {children}
    </Pressable>
  );
}

/**
 * A pressable that eases down and back.
 *
 * For buttons and floating actions, where a sense of contact is the point: the
 * surface sinks a few percent under the finger and returns over the system's fast
 * duration. Deliberately *not* used on list rows — text should dim under a finger,
 * never move, or a long ledger starts to feel unstable.
 */
export function PressableScale({
  children,
  style,
  pressedStyle,
  onPressIn,
  onPressOut,
  ...rest
}: PressableSurfaceProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const ease = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: Motion.fast,
      easing: easeOut,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        ease(0.96);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        ease(1);
        onPressOut?.(event);
      }}
      style={({ pressed }) => [
        style,
        pressed && pressedStyle,
        { transform: [{ scale }] },
      ]}>
      {children}
    </Pressable>
  );
}
