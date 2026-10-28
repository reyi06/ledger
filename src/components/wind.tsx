import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { usePrefersReducedMotion } from '@/components/motion';

/**
 * Wind.
 *
 * Short streaks of air drifting across whatever it is given. It exists so the
 * seedling is visibly *being moved* by something rather than swaying on its own —
 * motion without a cause reads as an animation, motion with one reads as weather.
 *
 * Each streak is a thin rounded bar at low opacity, travelling on a **linear**
 * timing, because air does not accelerate as it crosses a gap. The easing is in
 * the opacity instead, which fades in and out at the edges so a streak never
 * appears or vanishes mid-frame.
 *
 * `top` is a fraction of the given height, so the same component works for a
 * 132pt arch and for a whole screen.
 */

export interface WindStreak {
  /** Vertical position, as a fraction of the layer's height. */
  top: number;
  length: number;
  /** Milliseconds for one crossing. */
  duration: number;
  /** Milliseconds before this streak's first crossing. */
  delay: number;
  thickness?: number;
}

/**
 * Three passes inside the arch — close, quick, and readable.
 *
 * Different heights, lengths, speeds and start times, so the effect never reads
 * as one sheet sliding past.
 */
export const ARCH_WIND: readonly WindStreak[] = [
  { top: 0.26, length: 38, duration: 4200, delay: 0 },
  { top: 0.46, length: 24, duration: 5400, delay: 1400 },
  { top: 0.66, length: 30, duration: 4800, delay: 2600 },
];

/**
 * Four passes across the whole page — longer, slower, and fainter.
 *
 * Kept to the upper part of the screen on purpose: streaks crossing the form and
 * the primary button would be noise over the one place a person is trying to act.
 * These travel above and beside the mark, which is where weather belongs.
 */
export const PAGE_WIND: readonly WindStreak[] = [
  { top: 0.12, length: 96, duration: 9000, delay: 0, thickness: 2 },
  { top: 0.28, length: 148, duration: 12000, delay: 3200, thickness: 3 },
  { top: 0.42, length: 74, duration: 10500, delay: 6400, thickness: 2 },
  { top: 0.56, length: 120, duration: 13500, delay: 9400, thickness: 2 },
];

/**
 * The idle weather behind every screen.
 *
 * Five streaks, each taking sixteen to twenty-three seconds to cross, at 12%
 * opacity and sitting *behind* the content rather than over it. A working screen
 * with nothing moving on it reads as a screenshot; this is the least motion that
 * fixes that without ever competing with a figure.
 *
 * Slower and sparser than the welcome screen's, deliberately: the welcome screen
 * is a moment, and the five tabs are somewhere a person sits and reads.
 */
export const AMBIENT_WIND: readonly WindStreak[] = [
  { top: 0.14, length: 130, duration: 16000, delay: 0, thickness: 2 },
  { top: 0.34, length: 84, duration: 19000, delay: 5000, thickness: 2 },
  { top: 0.55, length: 160, duration: 23000, delay: 11000, thickness: 3 },
  { top: 0.74, length: 100, duration: 17000, delay: 8000, thickness: 2 },
  { top: 0.9, length: 70, duration: 21000, delay: 15000, thickness: 2 },
];

function Streak({
  spec,
  layerWidth,
  layerHeight,
  color,
  peakOpacity,
  disabled,
}: {
  spec: WindStreak;
  layerWidth: number;
  layerHeight: number;
  color: string;
  peakOpacity: number;
  disabled: boolean;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (disabled) return;

    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: spec.duration,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );

    // The delay is sequenced ahead of the loop so the streaks do not all set off
    // together on the first pass. The sequence never completes, which is fine —
    // the loop inside it is what animates.
    const start = Animated.sequence([Animated.delay(spec.delay), loop]);
    start.start();

    return () => start.stop();
  }, [progress, spec.delay, spec.duration, disabled]);

  const thickness = spec.thickness ?? 2;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: layerHeight * spec.top,
        left: 0,
        height: thickness,
        width: spec.length,
        borderRadius: thickness / 2,
        backgroundColor: color,
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-spec.length - 16, layerWidth + 16],
            }),
          },
        ],
        opacity: progress.interpolate({
          inputRange: [0, 0.18, 0.82, 1],
          outputRange: [0, peakOpacity, peakOpacity, 0],
        }),
      }}
    />
  );
}

export function Wind({
  width,
  height,
  streaks,
  peakOpacity = 0.3,
  color,
}: {
  width: number;
  height: number;
  streaks: readonly WindStreak[];
  /** Opacity at the midpoint of a crossing. */
  peakOpacity?: number;
  /** Defaults to the palette's sage. */
  color?: string;
}) {
  const theme = useTheme();
  const reduced = usePrefersReducedMotion();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {streaks.map((spec) => (
        <Streak
          key={`${spec.top}-${spec.delay}`}
          spec={spec}
          layerWidth={width}
          layerHeight={height}
          color={color ?? theme.sage}
          peakOpacity={peakOpacity}
          disabled={reduced}
        />
      ))}
    </View>
  );
}

/**
 * The idle layer, sized to the window.
 *
 * Mounted once inside `Screen`, so every screen gets the same ambient weather
 * without each one deciding to.
 */
export function AmbientWind() {
  const { width, height } = useWindowDimensions();

  return (
    <Wind width={width} height={height} streaks={AMBIENT_WIND} peakOpacity={0.12} />
  );
}
