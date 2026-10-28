# Third-party notices

Ledger is MIT-licensed. It uses and bundles third-party open-source software; those
components remain under their own licenses. This file summarizes the direct
dependencies and the bundled font licenses. It is not a replacement for the
license text shipped with each package.

## Runtime dependencies

| Package | License |
|---|---|
| Expo SDK and Expo modules (`expo`, `expo-constants`, `expo-crypto`, `expo-file-system`, `expo-font`, `expo-haptics`, `expo-linking`, `expo-local-authentication`, `expo-router`, `expo-sharing`, `expo-splash-screen`, `expo-status-bar`, `expo-symbols`, `expo-system-ui`) | MIT |
| React, React DOM, React Native | MIT |
| `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-web` | MIT |
| `@expo/vector-icons` | MIT |
| `@react-native-async-storage/async-storage` | MIT |
| `zod` | MIT |
| `zustand` | MIT |
| `@expo-google-fonts/jetbrains-mono`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/source-sans-3` | MIT for the package code; SIL Open Font License 1.1 for the font files |

React Navigation and other transitive dependencies are distributed under their own
MIT or Apache-2.0 licenses. Their license files are present in `node_modules/` in a
development checkout.

## Fonts

The app bundles the following text fonts under the SIL Open Font License,
Version 1.1:

| Font | Copyright | License text |
|---|---|---|
| JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors | [`licenses/fonts/JetBrainsMono-OFL.txt`](./licenses/fonts/JetBrainsMono-OFL.txt) |
| Playfair Display | Copyright 2017 The Playfair Display Project Authors, with Reserved Font Name "Playfair Display" | [`licenses/fonts/PlayfairDisplay-OFL.txt`](./licenses/fonts/PlayfairDisplay-OFL.txt) |
| Source Sans 3 | Copyright 2010-2020 Adobe, with Reserved Font Name 'Source' | [`licenses/fonts/SourceSans3-OFL.txt`](./licenses/fonts/SourceSans3-OFL.txt) |

The OFL permits bundling and redistribution with software provided that the
reserved font names are not used for modified versions and the license notice is
included. These files are the license notices for the bundled text fonts.

Expo Router also bundles **Material Symbols** for the native Android tab bar.
Material Symbols is Copyright Google LLC and licensed under the Apache License,
Version 2.0; its notice is included at
[`licenses/fonts/MaterialSymbols-Apache-2.0.txt`](./licenses/fonts/MaterialSymbols-Apache-2.0.txt).

## Development tooling

TypeScript is licensed under Apache-2.0. ESLint, Jest, `jest-expo`,
`eslint-config-expo`, `expo-doctor` and the type packages are MIT-licensed. These
tools are used to build and test the project; they are not part of the shipped app
bundle.

## Full dependency report

To inspect every installed package and its declared license:

```bash
npx license-checker --summary
```

For a release binary, keep this file and the `licenses/` directory with the
distribution or make them available from the app's store listing.
