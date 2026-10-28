import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { usePrefersReducedMotion } from '@/components/motion';
import { ARCH_WIND, Wind } from '@/components/wind';
import { useTheme } from '@/hooks/use-theme';

/**
 * The botanical sprig, and the arch it grows in.
 *
 * The system's brand mark. The brief's signature structural move is the arch —
 * "the 200px arch radius on images creates iconic architectural moments" — so a
 * seedling grows inside one. Growth is also the one metaphor a ledger can carry
 * honestly: it is the shape of a balance going up.
 *
 * Drawn from primitives rather than an icon font. A leaf is a rectangle with two
 * opposite corners rounded to its full width, which gives a genuine leaf
 * silhouette that stays crisp at any size and inherits the palette instead of
 * shipping a glyph in someone else's voice.
 *
 * ## The animation is a gust, not a sway
 *
 * The obvious way to animate a plant is to rotate it back and forth. That reads
 * as a metronome however many frames you give it, because the *motion* is the
 * problem, not the frame count. Three things replace it, and together they are
 * the whole idea:
 *
 * 1. **A gust, not an oscillation.** The twelve frames are one wind event, not a
 *    half-cycle of a sine. It builds slowly (frames 1-4), peaks hard, then the
 *    stem *overshoots* past upright and settles back through a smaller
 *    counter-sway. A sine has no overshoot; a stem does.
 *
 * 2. **The stem bends.** It is drawn as eight short segments placed along a real
 *    curve — `x(t) = tip·t²`, each segment rotated to the local tangent — so the
 *    plant arcs from the base instead of pivoting as a rigid stick. The bend is
 *    what makes it read as a stem rather than a signpost.
 *
 * 3. **Every leaf trails on its own delay.** Each leaf samples the same gust
 *    curve from a different number of frames behind, and takes a different share
 *    of it. Lower leaves move less and later, as in life. No two frames share a
 *    silhouette, and no two leaves ever move in lockstep.
 *
 * The loop still closes — twelve frames loop by definition — but what it closes
 * on is a plant that has just finished being moved, not a pendulum at rest.
 */

const SPRIG_WIDTH = 80;
const SPRIG_HEIGHT = 104;

/** 12 frames at 105ms — about 1.25s of wind. */
const FRAME_MS = 105;

/** The stem is a curve, so it is drawn as segments along it. */
const STEM_SEGMENTS = 8;
const STEM_LENGTH = 96;
const STEM_BASE_X = 40;
const STEM_BASE_Y = SPRIG_HEIGHT;
const STEM_WIDTH = 2.5;

interface GustFrame {
  /** Deflection of the stem tip, in points. Negative is the counter-sway. */
  tip: number;
  /** Leaf deflection for this frame, in degrees, before per-leaf weighting. */
  flutter: number;
  /** Leaf swell, so the plant breathes as well as bends. */
  swell: number;
}

/**
 * One gust, hand-authored.
 *
 * Read the `tip` column as the shape of the event: still, a slow build, a hard
 * peak at frame 4, a fast release, then an overshoot to -2.8 before settling.
 * `flutter` is the same event seen by the leaves, delayed and exaggerated.
 */
const GUST: readonly GustFrame[] = [
  { tip: 0.0, flutter: 0.0, swell: 1.0 },
  { tip: 0.5, flutter: -0.7, swell: 1.02 },
  { tip: 1.6, flutter: -1.8, swell: 1.05 },
  { tip: 3.4, flutter: -3.4, swell: 1.08 },
  { tip: 5.4, flutter: -4.8, swell: 1.1 },
  { tip: 4.6, flutter: -4.0, swell: 1.08 },
  { tip: 1.8, flutter: -1.6, swell: 1.05 },
  { tip: -1.2, flutter: 1.2, swell: 1.02 },
  { tip: -2.8, flutter: 2.6, swell: 0.99 },
  { tip: -2.0, flutter: 1.8, swell: 0.97 },
  { tip: -0.8, flutter: 0.6, swell: 0.98 },
  { tip: -0.2, flutter: 0.1, swell: 0.99 },
];

/**
 * The same gust, harder.
 *
 * Played occasionally instead of the base cycle, so the mark does not read as a
 * loop. It is built on the same twelve-frame grid and starts and ends at rest, so
 * the switch happens at a cycle boundary and nothing jumps. Roughly 1.6× the
 * amplitude — a gust that a person notices arriving, rather than a violent shake.
 */
const STRONG_GUST: readonly GustFrame[] = [
  { tip: 0.0, flutter: 0.0, swell: 1.0 },
  { tip: 1.2, flutter: -1.4, swell: 1.03 },
  { tip: 3.2, flutter: -3.4, swell: 1.07 },
  { tip: 6.0, flutter: -6.2, swell: 1.11 },
  { tip: 8.4, flutter: -8.4, swell: 1.14 },
  { tip: 7.2, flutter: -7.0, swell: 1.11 },
  { tip: 3.4, flutter: -3.0, swell: 1.07 },
  { tip: -1.0, flutter: 2.0, swell: 1.02 },
  { tip: -4.4, flutter: 4.6, swell: 0.96 },
  { tip: -3.4, flutter: 3.4, swell: 0.94 },
  { tip: -1.4, flutter: 1.2, swell: 0.97 },
  { tip: -0.3, flutter: 0.2, swell: 0.99 },
];

interface LeafSpec {
  /** Position along the stem: 0 at the base, 1 at the tip. */
  t: number;
  /** Resting angle from vertical, in degrees. */
  angle: number;
  /** Which way it faces. */
  side: -1 | 1;
  /** How much of the gust this leaf takes. */
  weight: number;
  /** Frames behind the stem, so the leaves trail. */
  delay: number;
}

/** Four leaves, each with its own place, share and lag. */
const LEAVES: readonly LeafSpec[] = [
  { t: 0.28, angle: -38, side: -1, weight: 1.0, delay: 0 },
  { t: 0.5, angle: 38, side: 1, weight: 0.82, delay: 2 },
  { t: 0.72, angle: -34, side: -1, weight: 0.62, delay: 4 },
  { t: 0.92, angle: 32, side: 1, weight: 0.45, delay: 6 },
];

const LEAF_WIDTH = 19;
const LEAF_HEIGHT = 30;

/** Where the stem is, and which way it points, at `t` along its length. */
function stemAt(t: number, tip: number) {
  return {
    x: STEM_BASE_X + tip * t * t,
    y: STEM_BASE_Y - STEM_LENGTH * t,
    // Local tangent, measured from upright.
    angle: (Math.atan2(2 * tip * t, STEM_LENGTH) * 180) / Math.PI,
  };
}

/** How many base cycles pass before a stronger gust is allowed to play. */
const CALM_CYCLES_MIN = 4;
const CALM_CYCLES_SPAN = 5;

interface SprigPose {
  frame: number;
  /** Whether this cycle is the stronger gust. */
  strong: boolean;
}

/**
 * Steps the mark through the gust, and occasionally through the harder one.
 *
 * The randomness is drawn inside the interval rather than inside a state updater,
 * so a double-invoked updater under StrictMode cannot roll two different gusts.
 */
function useSprigPose(): SprigPose {
  const reduced = usePrefersReducedMotion();
  const [pose, setPose] = useState<SprigPose>({ frame: 0, strong: false });

  const frame = useRef(0);
  const cycles = useRef(0);
  const strong = useRef(false);
  // Seeded here rather than in the initialiser: drawing a random number during
  // render is impure, and React is allowed to render twice.
  const nextGustAt = useRef(CALM_CYCLES_MIN);

  useEffect(() => {
    // Frame 0 is the resting pose, so Reduce Motion simply never advances.
    if (reduced) return;

    nextGustAt.current = CALM_CYCLES_MIN + Math.floor(Math.random() * CALM_CYCLES_SPAN);

    const timer = setInterval(() => {
      frame.current = (frame.current + 1) % GUST.length;

      // A cycle ends when the frame wraps; that is the only safe moment to change
      // which table is playing, because both start and end at rest.
      if (frame.current === 0) {
        if (strong.current) {
          strong.current = false;
          cycles.current = 0;
        } else {
          cycles.current += 1;
          if (cycles.current >= nextGustAt.current) {
            strong.current = true;
            nextGustAt.current =
              CALM_CYCLES_MIN + Math.floor(Math.random() * CALM_CYCLES_SPAN);
          }
        }
      }

      setPose({ frame: frame.current, strong: strong.current });
    }, FRAME_MS);

    return () => clearInterval(timer);
  }, [reduced]);

  return pose;
}

/** The plant on its own — a bending stem with four leaves. */
export function Sprig({ width = SPRIG_WIDTH }: { width?: number }) {
  const theme = useTheme();
  const pose = useSprigPose();
  const scale = width / SPRIG_WIDTH;

  const table = pose.strong ? STRONG_GUST : GUST;
  const { tip } = table[pose.frame];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Ledger"
      style={{
        width,
        height: SPRIG_HEIGHT * scale,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View style={[styles.sprig, { transform: [{ scale }] }]}>
        {Array.from({ length: STEM_SEGMENTS }, (_, index) => {
          const t = (index + 0.5) / STEM_SEGMENTS;
          const point = stemAt(t, tip);
          return (
            <View
              key={index}
              style={[
                styles.stemSegment,
                {
                  backgroundColor: theme.sageText,
                  left: point.x - STEM_WIDTH / 2,
                  top: point.y - (STEM_LENGTH / STEM_SEGMENTS + 2) / 2,
                  transform: [{ rotate: `${point.angle}deg` }],
                },
              ]}
            />
          );
        })}

        {LEAVES.map((leaf, index) => {
          const point = stemAt(leaf.t, tip);
          // Each leaf reads the gust from its own number of frames behind.
          const delayed = table[(pose.frame - leaf.delay + table.length) % table.length];
          const rotation = leaf.angle + point.angle + delayed.flutter * leaf.weight;

          return (
            <View
              key={index}
              style={[
                styles.leaf,
                leaf.side === -1 ? styles.leafLeftShape : styles.leafRightShape,
                {
                  backgroundColor: theme.sage,
                  left: point.x + leaf.side * 9 - LEAF_WIDTH / 2,
                  top: point.y - 11 - LEAF_HEIGHT / 2,
                  transform: [{ rotate: `${rotation}deg` }, { scale: delayed.swell }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

/** The full mark: the sprig growing inside a stone arch, with wind crossing it. */
export function BotanicalMark({ width = 132 }: { width?: number }) {
  return (
    <Arch width={width}>
      <Wind width={width} height={width * 1.28} streaks={ARCH_WIND} />
      <Sprig width={width * 0.66} />
    </Arch>
  );
}

/**
 * The stone arch on its own.
 *
 * The brief's signature structural move — "the 200px arch radius on images
 * creates iconic architectural moments" — kept as a shared primitive so the
 * tour's step art is visibly the same object as the wordmark's mark.
 */
export function Arch({ width = 132, children }: { width?: number; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.arch,
        {
          width,
          height: width * 1.28,
          backgroundColor: theme.tintMuted,
          // Square at the base, fully round at the crown.
          borderTopLeftRadius: width / 2,
          borderTopRightRadius: width / 2,
          borderBottomLeftRadius: Radius.md,
          borderBottomRightRadius: Radius.md,
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  arch: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 22,
    overflow: 'hidden',
  },
  sprig: {
    width: SPRIG_WIDTH,
    height: SPRIG_HEIGHT,
  },
  stemSegment: {
    position: 'absolute',
    width: STEM_WIDTH,
    height: STEM_LENGTH / STEM_SEGMENTS + 2,
    borderRadius: STEM_WIDTH / 2,
  },
  leaf: {
    position: 'absolute',
    width: LEAF_WIDTH,
    height: LEAF_HEIGHT,
  },
  /** Rounded at the tip and the base, pointed where it meets the stem. */
  leafLeftShape: {
    borderTopLeftRadius: LEAF_WIDTH,
    borderBottomRightRadius: LEAF_WIDTH,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
  },
  leafRightShape: {
    borderTopRightRadius: LEAF_WIDTH,
    borderBottomLeftRadius: LEAF_WIDTH,
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
