// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `.expo` holds Expo's generated types and route manifest; `dist` is build output.
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // `tools/` holds Node build scripts, not app code, so it needs Node globals
    // rather than the React Native environment the rest of the project uses.
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
]);
