/**
 * Icon generator.
 *
 * Produces the app's PNG assets from the product's own mark — the wallet that
 * leads the wordmark on the welcome screen — rather than shipping a hand-drawn
 * bitmap nobody can reproduce.
 *
 * Deliberately dependency-free: PNG is a simple container and Node already has
 * zlib, so this needs no image library. Run with:
 *
 *   node tools/generate-icons.mjs
 *
 * Output is written to assets/images/. Re-run after changing the mark below.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', 'images');

/** Deep forest and warm paper — the same pair the app's own mark is drawn in. */
const FOREST = [45, 58, 49, 255];
const PAPER = [249, 248, 244, 255];
const CLEAR = [0, 0, 0, 0];

/** Supersampling factor. Edges are averaged down, so nothing is aliased. */
const SS = 4;

/* ------------------------------------------------------------ primitives --- */

/**
 * Every shape is a bounding box plus a predicate in design space.
 *
 * Testing a point rather than rasterising a shape is what lets strokes and
 * rounded corners be exact: a ring is simply "inside the outer curve and outside
 * the inner one", and nothing needs to be drawn twice or erased.
 */

const rect = (x, y, w, h) => ({ x, y, w, h, test: () => true });

const roundRect = (x, y, w, h, radius) => ({
  x,
  y,
  w,
  h,
  test: (px, py) => {
    const dx = Math.max(Math.abs(px - (x + w / 2)) - (w / 2 - radius), 0);
    const dy = Math.max(Math.abs(py - (y + h / 2)) - (h / 2 - radius), 0);
    return dx * dx + dy * dy <= radius * radius;
  },
});

const roundRectStroke = (x, y, w, h, radius, stroke) => {
  const outer = roundRect(x, y, w, h, radius);
  const inner = roundRect(
    x + stroke,
    y + stroke,
    w - stroke * 2,
    h - stroke * 2,
    Math.max(0, radius - stroke),
  );
  return { x, y, w, h, test: (px, py) => outer.test(px, py) && !inner.test(px, py) };
};

const circle = (cx, cy, r) => ({
  x: cx - r,
  y: cy - r,
  w: r * 2,
  h: r * 2,
  test: (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r,
});

/**
 * The mark, in an arbitrary 1000-unit design space.
 *
 * A wallet: a landscape body with a pocket divided off at the right and a clasp
 * sitting in it. It is deliberately separate from the in-app seedling-in-an-arch
 * brand: both marks are first-party choices, not stock glyphs.
 *
 * The pocket line stops short of the body's inner edge on purpose — a line that
 * met the frame exactly would read as two boxes side by side rather than as one
 * wallet with a compartment.
 */
const ELEMENTS = [
  roundRectStroke(140, 280, 720, 440, 104, 58),
  rect(636, 312, 58, 376),
  circle(752, 500, 50),
];

function boundsOf(elements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.w);
    maxY = Math.max(maxY, el.y + el.h);
  }

  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

function fillRect(px, S, x, y, w, h, color) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(S, Math.round(x + w));
  const y1 = Math.min(S, Math.round(y + h));

  for (let py = y0; py < y1; py += 1) {
    let offset = (py * S + x0) * 4;
    for (let px2 = x0; px2 < x1; px2 += 1) {
      px[offset] = color[0];
      px[offset + 1] = color[1];
      px[offset + 2] = color[2];
      px[offset + 3] = color[3];
      offset += 4;
    }
  }
}

/** Walks only the element's own screen bounding box, testing each pixel. */
function drawElement(px, S, el, scale, offsetX, offsetY, color) {
  const x0 = Math.max(0, Math.floor(el.x * scale + offsetX));
  const y0 = Math.max(0, Math.floor(el.y * scale + offsetY));
  const x1 = Math.min(S, Math.ceil((el.x + el.w) * scale + offsetX));
  const y1 = Math.min(S, Math.ceil((el.y + el.h) * scale + offsetY));

  for (let py = y0; py < y1; py += 1) {
    const designY = (py + 0.5 - offsetY) / scale;
    for (let px2 = x0; px2 < x1; px2 += 1) {
      if (!el.test((px2 + 0.5 - offsetX) / scale, designY)) continue;

      const offset = (py * S + px2) * 4;
      px[offset] = color[0];
      px[offset + 1] = color[1];
      px[offset + 2] = color[2];
      px[offset + 3] = color[3];
    }
  }
}

/** Renders the mark into a supersampled buffer, then box-filters it down. */
function render(size, fit, { background, mark }) {
  const S = size * SS;
  const px = new Uint8Array(S * S * 4);

  if (background[3] > 0) {
    fillRect(px, S, 0, 0, S, S, background);
  }

  const box = boundsOf(ELEMENTS);
  const scale = fit === 0 ? 1 : (fit * S) / Math.max(box.w, box.h);
  const offsetX = (S - box.w * scale) / 2 - box.minX * scale;
  const offsetY = (S - box.h * scale) / 2 - box.minY * scale;

  for (const el of ELEMENTS) {
    drawElement(px, S, el, scale, offsetX, offsetY, mark);
  }

  // Box-filter downsample.
  const out = new Uint8Array(size * size * 4);
  const samples = SS * SS;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const offset = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          const alpha = px[offset + 3] / 255;
          // Premultiply so transparent pixels do not darken the average edge.
          r += px[offset] * alpha;
          g += px[offset + 1] * alpha;
          b += px[offset + 2] * alpha;
          a += px[offset + 3];
        }
      }

      const alpha = a / samples;
      const unpremultiply = alpha > 0 ? 255 / alpha : 0;
      const offset = (y * size + x) * 4;
      out[offset] = Math.min(255, Math.round((r / samples) * unpremultiply));
      out[offset + 1] = Math.min(255, Math.round((g / samples) * unpremultiply));
      out[offset + 2] = Math.min(255, Math.round((b / samples) * unpremultiply));
      out[offset + 3] = Math.round(alpha);
    }
  }

  return out;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * The foreground scale for adaptive icons.
 *
 * Android draws an adaptive icon on a 108dp canvas but guarantees only the
 * central **66dp circle** — a radius of 30.5% — so anything beyond that is cut by
 * whatever mask the launcher applies.
 *
 * The mark is landscape, so its *width* is not the constraint: the corners are.
 * At 0.58 the half-diagonal measured
 *
 *     sqrt((0.58/2)^2 + (0.58 * 440/720 / 2)^2) = 33.9%
 *
 * which is outside the 30.5% radius, and the corners of the wallet were clipped.
 * Solving `0.5858 * fit <= 0.305` gives 0.52; this uses 0.50 so the mark clears
 * the mask on launchers that crop harder than the spec requires.
 */
const ADAPTIVE_FIT = 0.5;

const TARGETS = [
  // App icon: forest field, mark at 72% — iOS masks the corners itself.
  { file: 'icon.png', size: 1024, fit: 0.72, background: FOREST, mark: PAPER },
  // Adaptive foreground: art kept inside Android's circular safe zone.
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    fit: ADAPTIVE_FIT,
    background: CLEAR,
    mark: PAPER,
  },
  { file: 'android-icon-background.png', size: 1024, fit: 0, background: FOREST, mark: FOREST },
  // Themed (monochrome) icons are used as a mask, so the mark is opaque paper.
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    fit: ADAPTIVE_FIT,
    background: CLEAR,
    mark: PAPER,
  },
  // Splash: shown against the forest splash background.
  { file: 'splash-icon.png', size: 512, fit: 0.78, background: CLEAR, mark: PAPER },
  { file: 'favicon.png', size: 48, fit: 0.8, background: FOREST, mark: PAPER },
  // Google Play store listing icon. Play wants 512x512 and applies no mask, so
  // the mark can sit closer to the edge than the adaptive foreground.
  { file: 'store-icon.png', size: 512, fit: 0.68, background: FOREST, mark: PAPER },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const target of TARGETS) {
  const rgba = render(target.size, target.fit, {
    background: target.background,
    mark: target.mark,
  });
  const png = encodePng(target.size, target.size, rgba);
  writeFileSync(join(OUT_DIR, target.file), png);
  console.log(`${target.file}  ${target.size}x${target.size}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log(`\nWrote ${TARGETS.length} icons to assets/images/`);
