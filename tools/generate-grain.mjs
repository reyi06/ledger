#!/usr/bin/env node
/**
 * Generates the paper-grain tile for the Botanical / Organic Serif system.
 *
 * The design system specifies the grain as an inline SVG `feTurbulence` filter
 * painted over the page at 1.5% opacity. React Native has no SVG filter, so the
 * same texture ships as a small seamless PNG tiled behind everything. It is
 * generated rather than committed as a mystery binary: the output is a pure
 * function of this file, so the asset can be reproduced or tuned by re-running
 * `node tools/generate-grain.mjs`.
 *
 * Dependency-free: PNG is written by hand (Node's zlib does the compression),
 * matching `generate-icons.mjs`.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const SIZE = 128;
/** Seed keeps the tile byte-identical across runs. */
const SEED = 0x9e3779b9;

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../assets/images/grain.png');

/* ---------------------------------------------------------------- PNG ---- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Each scanline is prefixed with its filter byte (0 = none).
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* --------------------------------------------------------------- noise ---- */

/** mulberry32 — small, fast, and reproducible from a seed. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = rng(SEED);

// Per-pixel value noise, then one box-blur pass. Raw random reads as digital
// static; a single blur turns it into something closer to paper fibre, which is
// what `feTurbulence` produces.
const field = new Float32Array(SIZE * SIZE);
for (let i = 0; i < field.length; i += 1) field[i] = random();

const blurred = new Float32Array(field.length);
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    let sum = 0;
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        // Wrap, so the tile stays seamless.
        const sx = (x + dx + SIZE) % SIZE;
        const sy = (y + dy + SIZE) % SIZE;
        sum += field[sy * SIZE + sx];
        count += 1;
      }
    }
    blurred[y * SIZE + x] = sum / count;
  }
}

// Normalise to full range so the grain keeps its contrast after blurring.
let min = Infinity;
let max = -Infinity;
for (const value of blurred) {
  if (value < min) min = value;
  if (value > max) max = value;
}
const span = max - min || 1;

const rgb = Buffer.alloc(SIZE * SIZE * 3);
for (let i = 0; i < blurred.length; i += 1) {
  const level = Math.round(((blurred[i] - min) / span) * 255);
  rgb[i * 3] = level;
  rgb[i * 3 + 1] = level;
  rgb[i * 3 + 2] = level;
}

mkdirSync(dirname(out), { recursive: true });
const png = encodePng(SIZE, SIZE, rgb);
writeFileSync(out, png);

console.log(`grain.png  ${SIZE}x${SIZE}  ${png.length} bytes  ->  ${out}`);
