# Ledger

[![CI](https://github.com/reyi06/ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/reyi06/ledger/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A local-first, offline personal finance app for iOS, Android and the web, built with
**Expo SDK 58**, **React Native 0.88**, **TypeScript (strict)** and **Zustand**.

There is no backend and no account to create. Every number you see is computed on the
device from data stored on the device, and the app makes no network calls.

Current release: **[1.0.0](https://github.com/reyi06/ledger/releases/tag/v1.0.0)** -
test Android APK/AAB attached; both are debug-signed and not store builds.

---

## What it does

### Overview
- Net worth with this month's movement, and every account folded into the same plate
- This month's income and spending
- A 6-month spending chart
- Where the month's money went, ranked by category
- The three most recent entries

### Activity
- Full transaction history grouped by day, with a per-day total
- Search across merchant, note and category
- Direction inline; period and totals behind one row that opens a sheet
- Tap for detail; long-press for edit, duplicate or delete

### Budgets
- A rolling monthly limit per expense category
- One summary of what has been spent against what was budgeted, plus a bar
- Over-budget envelopes marked in terracotta and in words
- Categories with no limit yet, one tap from creating one

### Insights
- Savings rate as the screen's single headline
- Six one-line doors into the detail: month-over-month comparison, spending pace,
  category trends, top merchants, biggest expense, and habits

### Assistant
- A chat pop-up that answers questions about your own ledger
- **Deterministic, not a language model**: 17 intents, 9 period shapes and roughly 200
  synonyms, parsed on the device. The same question always produces the same figure.
- Every answer leads with the parse it understood — "Dining out" — so a misreading is
  visible rather than buried behind a wrong number
- When a question falls outside the vocabulary it says so and offers what it can
  answer, rather than guessing

### Guided tour
- Seven steps shown once after onboarding, translated, replayable from Settings
- Built from the app's own parts, so it teaches the interface's rhythm while
  describing it

### Settings
- Manage accounts (checking, savings, credit, investment, cash) with live balances
- Theme (system / light / dark), currency (including PHP) and language (English /
  Filipino)
- Security: PIN, biometric unlock, auto-lock timer, hide-balances privacy mode
- Recurring rules, transfers, and CSV export via the system share sheet
- Load a demo ledger, or reset and erase everything

### Sign-in (offline)
A local profile with a 6-digit PIN, verified against a salted, stretched SHA-256 hash.
Optional biometric unlock (Face ID / Touch ID / fingerprint) and an auto-lock timer that
re-locks after the app has been in the background. Repeated failures back off with an
escalating cooldown.

---

## Architecture

```
src/
├── app/                    Expo Router routes (file-based)
│   ├── _layout.tsx         Boot, providers, splash gate, protected routes
│   ├── (auth)/             welcome → create-pin → unlock
│   ├── (tabs)/             overview, activity, budgets, insights, settings
│   ├── transaction/        new (modal) + [id] detail
│   ├── account/new.tsx     create or edit an account
│   ├── transfer.tsx        move money between accounts
│   └── recurring/          list + new (modal)
├── domain/                 Pure business logic — no React, no I/O
│   ├── money.ts            Branded `Cents` integer type + arithmetic + formatting
│   ├── models.ts           Zod schemas for every persisted entity
│   ├── selectors.ts        Balances, totals, groupings, filters
│   ├── insights.ts         Month-over-month analytics
│   ├── assistant.ts        The local query parser (17 intents, 9 period shapes)
│   ├── recurring.ts        Rule expansion (deterministic, testable)
│   ├── categories.ts       Curated category list with icons and index codes
│   ├── auth.ts             Profile schema, PIN rules, lockout policy
│   └── settings.ts         Preferences schema, including language
├── data/                   Persistence
│   ├── json-repository.ts  Validate-on-read-and-write repository factory
│   ├── repositories.ts     Ledger, auth and settings repositories
│   ├── storage.ts          AsyncStorage adapter + in-memory fake for tests
│   └── seed.ts             Deterministic demo ledger (opt-in, never loaded by default)
├── store/                  Zustand stores
│   ├── ledger-store.ts     Accounts, transactions, budgets, recurring rules
│   ├── auth-store.ts       Lock state machine
│   ├── settings-store.ts   Preferences
│   ├── persistence.ts      Debounced autosave
│   └── hooks.ts            Derived read hooks (memoized selectors)
├── i18n/                   English and Filipino dictionaries + `translate`
├── components/
│   ├── ui/                 Design-system primitives (card, button, inputs, charts…)
│   ├── motion/             `Reveal`, `PressableSurface`, `PressableScale`
│   ├── botanical-mark.tsx  The seedling, the arch, and its twelve-frame gust
│   ├── wind.tsx            Drifting air streaks, reused at two scales
│   ├── assistant-sheet.tsx The assistant chat
│   └── *.tsx               Feature components (rows, editors, charts)
├── hooks/                  Theming, insets, haptics, app lock, translation
├── lib/                    Dates, money-free formatting, colour, CSV, hashing
└── services/export.ts      CSV export to the share sheet
```

### Design decisions worth knowing

**Money is never a float.** Amounts are stored as a signed integer count of minor units,
wrapped in a Zod-branded `Cents` type. You cannot pass a raw `number` where `Cents` is
expected, and all arithmetic goes through helpers that round and re-validate. `0.1 + 0.2`
cannot produce `0.30000000000000004` here.

**Storage is validated at both ends.** `createJsonRepository` parses with the same Zod
schema on read and on write. A payload that no longer matches the schema is discarded and
the app falls back to seed data, instead of rendering `NaN` balances.

**The domain layer has no React.** Balances, monthly totals, category breakdowns, budget
progress and recurring-rule expansion are pure functions, which is why they are directly
unit-testable. See `src/domain/__tests__/`.

**Recurring rules expand lazily.** Rather than a background task, rules are materialized on
launch up to today, recording how far each rule has been expanded. A rule starting on the
31st correctly lands on the 28th in February and returns to the 31st afterwards.

**Transfers are not income or expense.** Moving money between your own accounts writes two
linked transactions under dedicated transfer categories. Balances stay correct while income
and spending reporting ignores the movement entirely.

**Screens own their insets.** The native tab bar is configured with
`disableAutomaticContentInsets`, and the `Screen` component applies safe-area and tab-bar
padding itself. That keeps layouts identical across iOS, Android and web rather than
depending on three different native behaviours.

---

## Design language

**Botanical / Organic Serif** — the north star is *The Botanical Ledger*.

A warm alabaster ground, ink drawn from a forest floor, and forms that were shaped
rather than cut. Rounded everywhere, lifted on soft shadows tinted with the ground,
and covered in a paper grain at 3%.

Colour does real work here — sage marks what is healthy, terracotta what is over a
limit — but it **reinforces and never carries**: every direction is still stated by
sign and arrow, and every state in words. Remove the hue and the interface is exactly
as legible.

The authoritative contract is **[`DESIGN.md`](./DESIGN.md)**: it carries the
machine-readable token frontmatter, the eight canonical sections, and the named rules
— The Reinforces Rule, The Two Pigments Rule, The One Plate Rule, The Two Voices Rule,
The Italic Rule, The Tabular Rule, The Round Corner Rule, The Arch Rule, The Tinted
Shadow Rule, The Stated-Once Rule.

Tokens live in `src/constants/theme.ts`. Components never hard-code a value; they read
through `useTheme()` or name a type role. Browser surfaces are themed in
`src/global.css`.

Five decisions were made explicitly, and are the ones most likely to be revisited:

1. **Density is the main structural rule.** A screen states a headline and then
   *names* its detail: a summary row with a chevron instead of a table, a sheet
   instead of a section. A figure is stated once — `Net` is not shown beside `In` and
   `Out`, and a percentage is not printed under a bar that already encodes it.
   Nothing is removed from the product; it is removed from the viewport.
2. **Colour reinforces, never carries.** Sage and terracotta each ship twice — once as
   a fill and once as an ink dark enough to set text in — and every state is also
   stated in words, so the app survives grayscale and colour-vision deficiency.
3. **Motion is slow for entrances and fast for presses.** Content fades and settles
   over 500ms; a button eases to 96% over 300ms. Every entrance honours Reduce Motion
   and keeps content visible when it is on.
4. **Dark mode is a designed forest-at-night appearance**, not an inversion of the
   light palette, kept as a three-way system/light/dark preference.
5. **The mono is gone from figures.** Figures are set in the humanist sans with
   `tnum`, because open digits read at a glance in a way a monospace never does;
   the mono survives only for machine-facing strings in the error boundary.

### The mark

The in-app brand is a seedling in an arch, drawn from primitives rather than an icon
font, and it is animated on a twelve-frame grid. The frames are one *gust*, not an
oscillation: the stem bends along a real curve, each leaf trails on its own delay, and
every few cycles a stronger gust plays instead. Wind streaks cross the arch and the
whole welcome screen, so the plant is visibly being moved by something.

The app icon is a deliberately separate wallet mark, generated from the same
dependency-free drawing approach by `tools/generate-icons.mjs`. Both marks are
first-party choices, not stock glyphs.

### Known follow-ups

- **Settings, the transaction forms, transfer, recurring and the budget editor have
  not been restyled.** They inherit the palette and the type scale through the shared
  kit and hold up, but their composition has not been art-directed the way Overview,
  Budgets and Activity have.
- **Translation coverage is partial.** The tab bar, the guided tour, the auth screens
  and the assistant are fully translated into Filipino; the five tab screens' inner
  copy is still English. `src/i18n` falls back to English and then to the key itself,
  so a missing string shows as `budgets.envelopes` rather than as a blank — visible in
  review instead of silently absent.
- **The seven text weights add roughly 2 MB.** One weight is loaded per role, plus
  Material Symbols (~1 MB) for the native Android tab bar.

---

## Getting started

```bash
npm install
npm start          # then press i, a, or w
```

The first launch shows onboarding: enter a name, choose a 6-digit PIN, confirm it, then
walk through a seven-step tour. **The ledger starts empty** — you add your first account
and your first transaction yourself, because an app that opens claiming you have
$21,627.21 has invented it.

A deterministic demo ledger — five months of accounts, transactions, budgets and
recurring rules — is available any time from **Settings → Data → Load demo ledger**, for
trying the screens out or taking screenshots. **Settings → Data → Erase everything**
removes it again.

**Platform verification so far:** Android has been exercised on an API 35 emulator,
and the web target has been reviewed in a browser. **iOS has not yet been run in a
simulator/emulator or on physical hardware.** See [`RELEASE.md`](./RELEASE.md) for the
full verification record.

### Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the dev server |
| `npm run ios` / `android` / `web` | Start on a specific platform |
| `npm run verify` | Typecheck, lint and test — run this before committing |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (includes React Compiler rules) |
| `npm test` | Jest unit tests for the domain and lib layers |
| `npm run doctor` | `expo-doctor` dependency and config checks (20/20) |

`npm run verify` currently covers **66 tests in 5 suites**, strict TypeScript and ESLint.
CI runs the same checks, plus `npx expo export --platform all` to prove that the iOS,
Android and web bundles build.

### Windows: the dev server and `EMFILE`

Metro sizes its worker pool to `CPU cores − 1` and keeps its transform cache in the
system temp directory. On a many-core Windows machine that combination can exhaust
the process file-handle limit partway through a bundle and kill the dev server with:

```
Error: EMFILE: too many open files, open '...\Temp\metro-cache\...'
```

`metro.config.js` bounds `maxWorkers` to **2** to keep the peak handle count down.
It was 4 first, and that still failed: EMFILE returned after roughly half an hour of
rapid hot-reload iteration. If it happens again: clear `%TEMP%\metro-cache` — it grows
to thousands of files, which is itself part of the pressure — and close other Node
processes, because the limit is shared across them. The cache directory is a
handle-pressure problem rather than a correctness one, so `cacheStores` is deliberately
left to Expo's default, which wraps it in a vary-aware store that invalidates
transforms correctly.

### Windows: native builds and `MAX_PATH`

The native build fails on Windows unless it is run from a short project root:

```
ninja: error: mkdir(...node_modules/react-native-reanimated/Common/NativeView/
react/renderer/components/rnreanimated): No such file or directory
```

CMake flattens the source path into the object directory, and Reanimated's tree is
deep enough that the flattened path crosses Windows' 260-character limit. Note that
`LongPathsEnabled` is already set on this machine and does **not** help — ninja is
not long-path aware, so the limit still applies to it.

Two fixes are needed together, both recorded in `RELEASE.md`: build from a short root
(for example `C:\l` rather than `C:\Users\<you>\projects\ledger`), and set
`buildStagingDirectory` in `android/app/build.gradle` so the staging path is shorter
still.

Reanimated and worklets cannot simply be removed: `expo-router` depends on both
transitively, and the app itself imports neither.

---

## Deliberately out of scope

- **No server.** There is no sync, no cloud backup and no multi-device support, and
  the app makes no network calls — the assistant in particular is a deterministic
  parser over your own rows, not a model, so nothing is ever sent anywhere.
- **No bank imports.** CSV export exists; parsing bank files does not.
- **No encryption at rest.** The PIN gates access to the app; the underlying store is
  app-scoped but unencrypted, and the UI does not claim otherwise.

The data layer sits behind a repository interface, so adding a sync backend later is a
contained change rather than a rewrite.

---

## Privacy

Ledger has no account, backend, analytics, ads or crash reporting, and the app code
contains no network client. Data stays in app-scoped storage on the device; it is not
encrypted at rest. Device-level backups are controlled by the operating system. Read
[`PRIVACY.md`](./PRIVACY.md) for the full statement.

The Android manifest keeps the standard `INTERNET` permission because Expo development
builds use it to reach Metro. The production app does not open a network connection. If
you want an OS-enforced offline guarantee, add `android.permission.INTERNET` to
`android.blockedPermissions` and test a production build; development builds need it.

## Contributing

Issues and pull requests are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md)
and the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Please report vulnerabilities
privately using [`SECURITY.md`](./SECURITY.md), and never include ledger data,
credentials or signing keys in an issue.

## License

Ledger is released under the [MIT License](./LICENSE). Copyright © 2026 reyi06.

Third-party components remain under their own licenses; see
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

## Notes on Expo APIs

This project targets SDK 58, where several APIs have moved. If you extend it, check the
versioned docs rather than relying on memory:

- Tabs use `expo-router/native-tabs` (`NativeTabs` with compound `Trigger.Label` /
  `Trigger.Icon` children).
- Auth gating uses `Stack.Protected` with `redirectTo`.
- Files use the class-based `File` / `Directory` / `Paths` API from `expo-file-system`.
- `authenticateAsync` returns a discriminated union on `success`.

`npx expo-doctor` currently reports 20/20 checks passing.
