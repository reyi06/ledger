# Release

Release guide for Ledger 1.0.0. The app is verified and ready to build; the
remaining store work is publisher credentials and store assets.

## Current identity

| Field | Value |
|---|---|
| App name / slug | `Ledger` / `ledger` |
| iOS bundle identifier | `com.reyi06.ledger` |
| Android package | `com.reyi06.ledger` |
| Version | `1.0.0` (build `1`, version code `1`) |
| License | MIT |
| Source | https://github.com/reyi06/ledger |

The bundle identifier and package are already set identically on both platforms.
Do not change them after the first store upload: they are baked into store
listings, provisioning profiles, signing certificates and any future push keys.
Changing them means shipping a *different app*.

---

## Prerequisites

| Thing | Why |
|---|---|
| An Expo account | EAS Build runs in the cloud; no local Xcode or Android Studio needed |
| Apple Developer Program ($99/yr) | Required for TestFlight and the App Store |
| Google Play Console ($25 once) | Required for Play Store and internal testing |

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # writes extra.eas.projectId into app.json
```

`eas init` is required once — EAS uses the project ID to attribute builds and
updates. It does not change the bundle identifier.

---

## Building

```bash
# Installable Android APK for testers — no store account needed.
npx eas-cli@latest build --profile preview --platform android

# Store-ready builds.
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest build --profile production --platform android
```

`eas.json` defines two profiles:

- **preview** — internal distribution, an APK on Android, the `preview` channel.
  For handing builds to testers.
- **production** — store builds, `autoIncrement` on, the `production` channel.
  Build numbers and version codes are managed remotely, so they never collide.

Versioning: bump `expo.version` in `app.json` for a user-visible release. The
build number and version code are incremented by EAS.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

```bash
npm ci
npm run verify
npm run doctor
npx expo export --platform all
```

`npm run verify` covers strict TypeScript, ESLint and the Jest suite (66 tests in
5 suites at the 1.0.0 tag). The export step builds the iOS, Android and web JS
bundles without requiring Xcode, Android Studio or store credentials.

## Dependency audit status

`npm audit --omit=dev` currently reports **8 advisories (3 high, 5 low)** in
Expo CLI's build-time dependency tree: `zod@3.25.76` nested under
`@expo/cli`, and `deepmerge@4.3.1` under `@expo/config`. The app itself uses
`zod@4.6.7`; these modules are not part of the shipped JS bundle.

There is no non-breaking npm fix today. Do **not** run `npm audit fix --force`:
it downgrades Expo to SDK 51 and breaks the project. Track the upstream Expo
SDK release that updates these packages.

---

## Building a local release APK

With a JDK and the Android SDK installed you can produce an installable release
APK locally, with no EAS account and no store access:

```bash
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease --no-daemon
```

Output lands at `android/app/build/outputs/apk/release/app-release.apk`.

**This APK is signed with the debug keystore.** Expo's generated Android project
points release builds at `android/app/debug.keystore` so that `assembleRelease`
produces something installable out of the box. That is fine for sideloading and
testing on a real device, and **not** acceptable for Google Play — the store
requires your own upload key and an AAB. Use EAS for store builds; it manages the
upload keystore for you.

**The package name is baked into the APK.** `app.json`'s `android.package`
becomes the APK's identity. Changing it later means a rebuild, and on a store it
means shipping a different app. Set it before building anything you intend to
keep.

Requirements: JDK 17+ via `JAVA_HOME`, the Android SDK via `ANDROID_HOME` with the
matching platform and build-tools, and accepted SDK licences. Gradle downloads its
own distribution and the full dependency graph on first run, so the first build is
slow and network-bound.

### Windows: two MAX_PATH workarounds are required

The Android native build flattens absolute source paths into CMake object
directories. With this dependency tree those paths exceed Windows' 260-character
limit and ninja fails with:

```
ninja: error: mkdir(...C_/Users/.../node_modules/react-native-reanimated/Common/NativeView/...): No such file or directory
```

Both of the following are needed, and neither is optional:

1. **Build from a short project root.** The root path appears *twice* in the
   generated object path, so its length counts double. At
   `C:\Users\<you>\projects\ledger` the worst path measures 264 characters; at
   `C:\l` it measures 212. Two things that do **not** work, both verified by direct
   test: enabling `LongPathsEnabled` (already on — ninja is not long-path aware),
   and setting `CMAKE_OBJECT_PATH_MAX` (CMake's Ninja generator ignores it).

2. **Relocate AGP's codegen staging directory.** Even at a short root, the app
   module's autolinked codegen for `react-native-gesture-handler` reaches 268
   characters, because AGP stages it under `android/app/.cxx`. Adding this to
   `android/app/build.gradle` brings it down to 242:

   ```gradle
   android {
       externalNativeBuild {
           cmake {
               buildStagingDirectory = file("C:/b")
           }
       }
   }
   ```

   This is applied by **`plugins/withAndroidBuildStaging.js`**, a `withAppBuildGradle`
   config plugin registered in `app.json`, so a clean `expo prebuild` regenerates it
   automatically. It was a hand-edit first, and every `prebuild --clean` silently
   deleted it — which cost a failed build to rediscover, twice. Note the placement:
   `buildStagingDirectory` belongs to the **cmake** block, not the `android`
   extension, and setting it on the extension fails with "Could not set unknown
   property". The generated file has no `externalNativeBuild` block, so the plugin
   inserts the whole thing.

With both in place the release build completes in about eight minutes.

### The throwaway build tree must have `package.json`, not just `src`

`C:\l` is a copy of the project, and it is easy to sync only the parts that look
like source. A dependency added to the real project (`@expo-google-fonts/source-sans-3`)
was not in the build tree, and the failure surfaced late — after the native compile,
at the JS bundling step, as `Unable to resolve "@expo-google-fonts/source-sans-3"`.

Before every build, sync all four: `src/`, `app.json`, `assets/` **and**
`package.json` + `package-lock.json`, then run `npm install` inside `C:\l`.

The resulting APK is **94 MB** because it carries native libraries for all four
ABIs. Narrowing `reactNativeArchitectures` to `arm64-v8a` cuts that to roughly a
quarter and is fine for any phone made in the last several years, at the cost of
32-bit and x86 emulator support.

`android/` and `ios/` are generated and gitignored. Never edit them by hand —
configure native behaviour in `app.json` and config plugins, then re-run prebuild.

---

## Submitting

```bash
npx eas-cli@latest submit --profile production --platform ios
npx eas-cli@latest submit --profile production --platform android
```

---

## Publishing the GitHub release

The public source repository is `reyi06/ledger`. The first tagged release is
`v1.0.0`; the user-visible version in `app.json` is `1.0.0`.

```bash
git tag v1.0.0
git push origin main --tags
gh release create v1.0.0 --title "Ledger v1.0.0" --notes-file CHANGELOG.md
```

The GitHub release is source-only. Do **not** upload
`release/ledger-1.0.0-release.apk`: it is a locally generated, debug-signed test
artifact, not a production store build. Store binaries come from EAS with the
production profile and the publisher's upload keystore.

---

## Pre-submission checklist

- [x] MIT license in `LICENSE`, with third-party notices in
      `THIRD_PARTY_NOTICES.md`
- [x] Bundle identifier/package set to `com.reyi06.ledger` on both platforms
- [x] `expo.version` set to `1.0.0`
- [ ] App icon, adaptive icon and splash confirmed on a real device
- [ ] **Lock screen tested on a real device.** Face ID does not work in Expo Go
      or in the simulator's web build — it needs a development build
      (`npx expo install expo-dev-client`, then
      `npx eas-cli@latest build --profile development`) or a production build.
      Touch ID and fingerprint also need real hardware.
- [ ] Onboarding walked end to end: name → PIN → confirm → overview
- [ ] Auto-lock verified (background the app for longer than the configured grace
      period, return, confirm it re-locks)
- [ ] CSV export produces a shareable file on a device
- [ ] Recurring rules materialize correctly across a month boundary
- [ ] Dark mode checked (Settings → Appearance)
- [x] `npm run verify` green (66 tests, 5 suites)
- [x] `npm run doctor` green (20/20)
- [x] `npx expo export --platform all` green
- [ ] CI green on GitHub after the first push

---

## Store listing notes

The app makes no network requests and collects nothing, so the privacy answers
are unusually short. Use them honestly:

- **App Privacy (iOS)** — "Data Not Collected". No analytics SDK, no crash
  reporter, no third-party network calls.
- **Data safety (Android)** — "No data collected, no data shared".
- **Encryption** — `ios.config.usesNonExemptEncryption: false` is already set,
  which answers the export-compliance question during upload.
- **Permissions** — the app declares `INTERNET` (Expo's default), biometrics
  (`expo-local-authentication`) and `VIBRATE` (haptics). Three permissions React
  Native adds by default are explicitly blocked in `app.json` under
  `android.blockedPermissions`:

  | Blocked | Why |
  |---|---|
  | `SYSTEM_ALERT_WINDOW` | React Native's dev overlay; it has no business shipping. |
  | `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` | Storage is app-scoped; external storage is never needed. |

  These land in the manifest as `tools:node="remove"`, so the merger strips them.
  `INTERNET` is intentionally not blocked because Expo development builds use it to
  reach Metro. The app code contains no network client; if you want an OS-enforced
  offline guarantee, add `android.permission.INTERNET` to `blockedPermissions` and
  test a production build. Confirm the final set with
  `aapt dump badging app-release.apk` before every submission — it is the only
  place the merged manifest is visible.
- **Age rating** — no user-generated content, no ads, no purchases.

---

## What has been verified

**Automated** — all green as of the last run:

| Check | Result |
|---|---|
| `npm run typecheck` | pass, strict |
| `npm run lint` | 0 errors, 0 warnings |
| `npm test` | 66 tests, 5 suites |
| `npm run doctor` | 20/20 checks |
| `npx expo export --platform all` | iOS, Android and web bundles all build |

**Manually, in a browser** (the web target, in both light and dark mode, with zero console errors):

- Onboarding end to end: name → 6-digit PIN → confirm → overview
- The lock screen and PIN unlock
- Overview, Activity, Budgets, Insights, Settings, Recurring
- The transaction form
- The unmatched-route screen at a bogus path
- Dark mode across Overview, Budgets and Recurring

**Bugs this pass found and fixed**, all of which the typechecker and linter passed happily:

1. A hard-coded white icon on the welcome screen was invisible in dark mode.
2. The error boundary sat inside `src/app/`, making it a route without a default
   export — it broke the web render with a 500. Moved to `src/components/`.
3. Recurring's "committed each month" figures rendered as raw numbers (`-1815`)
   instead of currency.
4. Add-account's current balance had no thousands separator and hard-coded two
   decimals.
5. Insights' compact formatter hard-coded `$` and ignored the currency setting.

**On a real Android runtime** — Android 15 (API 35), x86_64, on an emulator,
installed from the release APK, with `adb logcat` watched throughout:

- Onboarding end to end: name → 6-digit PIN → confirm → Overview
- Lock screen, PIN unlock, and the profile persisting across a reinstall
- All five tabs, plus the transaction detail screen
- Zero `ReactNativeJS` errors or fatal exceptions across the whole sweep

**Bugs that only device testing could find**, all fixed and re-verified:

| Bug | Why the web preview missed it |
|---|---|
| `NativeTabs.Trigger.Icon md` requires `expo-symbols` — **crashed after PIN** | expo-router requires it internally; `NativeTabs` renders as the web fallback in a browser |
| Stat figures truncated to `$3,44…` in three-across rows | a 720px browser measure never hit a 411dp phone's column width |
| Lavender Material 3 tab indicator in the tab bar | the web build uses the headless tab bar, not the native one |
| Spending-pace chart drew future days as already spent | the bug was present but only legible at phone density |
| `Button` `fullWidth` grew to full height in flex columns | needed a bounded column, which only the error screen has |
| Keyboard covered CONTINUE on the welcome screen | edge-to-edge (SDK 58 default) makes Android 15 ignore `adjustResize` |
| `recorded sep 20` — a lowercased date | trivial copy bug, invisible unless you read the detail screen |

**Still NOT verified.** There is no physical device here, and **no iOS
simulator/emulated test has been run yet**, so:

- **iOS entirely, including the simulator.** Nothing in this app has ever run on
  iOS or in an iOS simulator. The `sf` tab icons, `Liquid Glass` header behaviour
  and iOS keyboard avoidance are all untested.
- **Real biometrics.** The emulator has no fingerprint sensor enrolled, so
  Face ID / Touch ID / fingerprint unlock has not been exercised. The lock screen
  and PIN path are verified; the biometric branch is not.
- **Haptic feel.** `VIBRATE` is declared and the calls are wired, but whether the
  feedback feels right is a judgement only a hand can make.
- **The error boundary's *recovery* path.** The boundary itself is verified — it
  caught the `expo-symbols` crash and rendered correctly on device — but the
  "Reload" button has not been pressed.
- **The CSV export share sheet**, which needs a real device to present it.
- **The transfer, add-account and new-recurring forms**, which compile and
  typecheck but have not been driven on device.

---

## Known limitations, stated plainly

- **Data is not encrypted at rest.** The PIN gates access to the app; the ledger
  is stored in app-scoped storage in the clear. The UI says so, and the store
  listing should not claim otherwise.
- **No OTA updates configured.** Every JS fix needs a store review. To add them:
  `npx expo install expo-updates`, then
  `npx eas-cli@latest update:configure`.
- **No sync or backup.** Uninstalling the app deletes the ledger. There is no
  account to restore from.
- **Screens other than Overview have not been art-directed** to the same degree.
  They inherit the design system and hold up, but their composition is generic
  where the pilot screen's is deliberate.

---

## Regenerating the icons

The icons are generated, not hand-drawn, so they can be reproduced and tweaked:

```bash
node tools/generate-icons.mjs
```

`tools/generate-icons.mjs` encodes PNGs directly with Node's `zlib` — no image
library, no build step. The mark is defined in a 1000-unit design space at the
top of the file; change `ELEMENTS` and re-run to iterate. It writes all six
assets: app icon, adaptive foreground/background/monochrome, splash and favicon.

The icon mark is a wallet: a landscape body, a pocket line and a clasp. It is
deliberately separate from the in-app seedling-in-an-arch brand; both are
first-party marks. The wallet is a silhouette rather than a letterform, so it
survives the small sizes where a serif "L" would fill in.
