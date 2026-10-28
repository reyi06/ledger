/**
 * Small color helpers. Kept dependency-free so they can run anywhere
 * (including unit tests) without a React Native renderer.
 */

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Expand `#abc` or `#aabbcc` into `{ r, g, b }`. */
export function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace(/^#/, '');

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('');
    return {
      r: parseInt(`${r}${r}`, 16),
      g: parseInt(`${g}${g}`, 16),
      b: parseInt(`${b}${b}`, 16),
    };
  }

  if (normalized.length !== 6) {
    throw new Error(`Unsupported hex color: ${hex}`);
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** Returns an `rgba()` string for the given hex color and alpha (0–1). */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(b)}, ${safeAlpha})`;
}
