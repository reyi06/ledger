// Metro configuration.
//
// One adjustment, for Windows. Metro sizes its worker pool to (CPU cores - 1),
// so on a 12-core machine eleven transform workers each hold files open
// concurrently. That exhausts the process file-handle limit and kills the dev
// server with `EMFILE: too many open files` partway through a bundle.
//
// Bounding the pool trades a little bundling throughput for a server that stays
// up. It was set to 4 first, and that was still not enough on this machine —
// EMFILE returned after roughly half an hour of rapid hot-reload iteration, so it
// is 2. Raise it if bundling feels slow; lower it if EMFILE returns.
//
// Deliberately *not* changed here: `cacheStores`. Expo wraps its own binary file
// store in a vary-aware store to invalidate transforms correctly, and replacing
// `cacheStores` outright would drop that wrapping and risk serving stale
// transforms. The cache location is a handle-pressure issue, not a correctness
// one, so it is left alone.

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.maxWorkers = 2;

module.exports = config;
