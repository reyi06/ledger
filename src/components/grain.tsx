import { Image, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { GrainOpacity } from '@/constants/theme';

const tile = require('../../assets/images/grain.png');

/**
 * The grain tile's URL, on the web.
 *
 * Metro hands back a plain URL string for an asset on the web, but a numeric
 * registry id on native. `Image.resolveAssetSource` would normalise both, except
 * it does not exist on React Native Web — reading the two shapes directly avoids
 * depending on it.
 */
const tileUri = typeof tile === 'string' ? tile : (tile as { uri?: string } | null)?.uri;

/**
 * The paper grain.
 *
 * The brief treats this texture as the defining element of the system, the thing
 * that turns cold pixels into a warm, touchable surface, and specifies it as an
 * inline SVG `feTurbulence` filter painted over the whole page at 1.5% opacity.
 * React Native has no SVG filter, so the same texture ships as a seamless PNG
 * (`assets/images/grain.png`, produced by `tools/generate-grain.mjs`) tiled
 * behind a full-screen overlay.
 *
 * Two platform differences are handled here rather than by a `.web.tsx` twin,
 * because a twin only loads when the bundler resolves the platform extension —
 * and it silently was not:
 *
 *  - Native `Image` honours `resizeMode="repeat"`. React Native Web does not: it
 *    maps resize modes onto `object-fit`, which has no repeating value, so the
 *    tile painted once at 128px in the corner. On the web the browser's own
 *    `background-repeat` does the tiling instead.
 *  - The layer is positioned with explicit insets rather than
 *    `StyleSheet.absoluteFill`, which did not resolve here and left the overlay
 *    sized to its content instead of the screen.
 *
 * It is mounted once, at the root, above the navigator — matching the brief's
 * `fixed inset-0 z-50` — and never intercepts touches.
 */
export function Grain() {
  if (Platform.OS === 'web') {
    return <View pointerEvents="none" style={[styles.layer, webRepeat(tileUri)]} />;
  }

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Image
        source={tile}
        style={styles.fill}
        resizeMode="repeat"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

/**
 * A repeating CSS background, applied through a cast.
 *
 * `backgroundImage` is a real React Native Web style property but is not part of
 * React Native's `ViewStyle` type, so it cannot be expressed without widening the
 * type at this one boundary.
 */
const webRepeat = (uri?: string): ViewStyle =>
  ({
    backgroundImage: uri ? `url(${uri})` : undefined,
    backgroundRepeat: 'repeat',
    backgroundSize: '128px 128px',
  }) as unknown as ViewStyle;

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: GrainOpacity,
    zIndex: 1000,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
