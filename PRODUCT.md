# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

**Primary users:** people who install Ledger from an app store to keep track of their own accounts, spending and budgets on a phone. Distribution is public — the confirmed intent is a real product for release, not a personal tool or a portfolio-only build.

**Job:** see where their money is and decide what to do next, without handing their financial data to a service.

Not yet established: any finer audience profile (region, single vs. household use, financial literacy), any secondary audience, and whether a web visitor is a real audience or only a byproduct of the Expo web target.

## Product Purpose

Ledger is a private, offline-first personal finance app. Every number it shows is computed on the device from data stored on the device: net worth across accounts, this month's income and spending, budget progress, and month-over-month insight.

It exists so a person can run their finances without creating an account, without a backend, and without a single network call.

Because it ships publicly and there is no cloud backup, the device holds the only copy of the user's ledger. Data safety, correctness and onboarding are therefore release-blocking concerns rather than polish.

## Positioning

The current defensible claim is **privacy by architecture**: there is no backend and no account, and the app makes no network calls at all, so there is nothing to leak because nothing is sent. A neighboring finance app that uploads for sync, aggregation or analytics cannot truthfully copy that claim.

The claim is behavioural rather than enforced: `INTERNET` is no longer in `android.blockedPermissions`, because the app may later want to fetch something the user explicitly opts into. Today nothing uses it, and the assistant in particular is a deterministic parser over local rows rather than a model, so no data leaves the device. If that ever changes, it is a product decision requiring its own consent, not an implementation detail.

**Open decision (confirmed as undecided by the user):** whether offline-only is a permanent product commitment or a v1 scope choice. The data layer sits behind a repository interface, so adding a sync backend later is a contained change rather than a rewrite (README, "Deliberately out of scope"). Until this is decided, treat it as the current architecture and not as an unchangeable product law.

## Operating Context

- **Use:** a phone in hand, day to day, frequently offline and often with no network available at all. Money is the subject and tabular figures are read in lists.
- **Access:** a local 6-digit PIN with optional biometric unlock (Face ID / Touch ID / fingerprint) and an auto-lock timer; balances can be hidden on demand via a privacy-mode setting.
- **Build and evaluate:** Expo SDK 58 with Expo Router. `npm start` plus a simulator, device, or the web target. EAS builds, signs and submits (`eas build`, `eas submit`) with no local Xcode or Android Studio. OTA updates are not configured.
- **Ritual before committing:** `npm run verify` — typecheck, lint and test together. `npx expo-doctor` covers dependency and config drift (currently 20/20 passing).
- **First run:** onboarding takes a name and a 6-digit PIN, then walks through a seven-step tour. **The ledger starts empty** — the user adds their first account and transaction. A deterministic demo ledger (five months of accounts, transactions, budgets and recurring rules) is available from Settings → Data, for trying the screens out; an app that opened claiming a balance the user never entered would be inventing it.
- **Where decisions are recorded:** `README.md` (architecture, design decisions, deliberate exclusions), `DESIGN.md` (the visual system as a contract, with machine-readable token frontmatter), `RELEASE.md` (build, submit and store readiness), and `AGENTS.md`, which binds future work to read versioned Expo docs for the installed SDK instead of relying on memory.

## Capabilities and Constraints

**Capabilities (confirmed):**

- *Overview* — net worth with the month's movement and every account folded into the same plate; this month's income and spending; a 6-month spending chart; where the month's money went, ranked by category; the three most recent entries.
- *Activity* — full history grouped by day with per-day totals; search across merchant, note and category; direction inline, with period and totals behind one row that opens a sheet; tap for detail, long-press to edit, duplicate or delete.
- *Budgets* — a rolling monthly limit per expense category; one summary of spend against the budgeted total; over-budget envelopes marked in colour and in words; uncapped categories surfaced one tap from creating one.
- *Insights* — the savings rate as the screen's single headline, then six one-line doors into the detail: month-over-month comparison, spending pace, category trends, top merchants, biggest expense, and habits.
- *Assistant* — a chat pop-up answering questions about the user's own ledger. **Deterministic, not a language model**: 17 intents, 9 period shapes and roughly 200 synonyms, parsed on the device, so the same question always produces the same figure. Every answer leads with the parse it understood, and a question outside the vocabulary is refused rather than guessed at.
- *Guided tour* — seven steps shown once after onboarding, translated, and replayable from Settings.
- *Settings* — accounts (checking, savings, credit, investment, cash) with live balances; theme (system / light / dark); currency (including PHP); language (English / Filipino); security (PIN, biometrics, auto-lock, hide balances); recurring rules; transfers; CSV export through the system share sheet; load the demo ledger or erase everything.
- *Offline sign-in* — a local profile with a PIN verified against a salted, stretched SHA-256 hash, optional biometrics, and an escalating cooldown on repeated failures.

**Technical constraints:**

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript strict, Zustand 5, Zod 4, jest-expo. React Compiler and typed routes are enabled.
- Continuous Native Generation: `ios/` and `android/` are generated. Never create or edit them by hand — native behavior is configured in `app.json` and config plugins.
- **Money is never a float.** Amounts are a signed integer count of minor units in a branded `Cents` type; a raw `number` cannot be passed where `Cents` is expected, and all arithmetic goes through rounding, re-validating helpers.
- **Storage is validated at both ends.** The same Zod schema parses on read and on write; a payload that no longer matches is discarded and the app falls back to seed data rather than rendering `NaN` balances.
- **The domain layer has no React and no I/O.** Balances, totals, groupings, budget progress and recurring expansion are pure and directly unit-testable.
- Recurring rules expand lazily on launch rather than via a background task, and handle month-length edges (the 31st lands on the 28th in February, then returns to the 31st).
- Transfers are neither income nor expense: two linked transactions under dedicated categories, so balances stay correct while income and spending reporting ignores the movement.
- Screens own their own insets (the native tab bar runs with `disableAutomaticContentInsets`), which keeps layouts identical across iOS, Android and web.

**Explicitly out of scope today:** no server, sync, cloud backup or multi-device support; no bank imports (CSV export only); no encryption at rest — the PIN gates access to the app, the underlying store is app-scoped but unencrypted, and the interface must not claim otherwise.

**Open decisions:** whether offline-only is permanent (see Positioning).

## Brand Commitments

- **Name:** Ledger — `app.json` `name`, `slug` and the URL scheme `ledger`.
- No confirmed voice, personality, logo system, marketing assets, pricing or store presence exists yet.
- Anything a neighboring app could also say is not a brand commitment; see Positioning for the one claim that is defensible today.

## Evidence on Hand

- **Real demo data:** `src/data/seed.ts` — a deterministic demo ledger of five months of accounts, transactions, budgets and recurring rules.
- **Tests:** `src/domain/__tests__/` and `src/lib/__tests__/` (run with `npm test`).
- **App identity assets:** generated, not hand-drawn, by `tools/generate-icons.mjs` - `assets/images/icon.png`, `favicon.png`, `splash-icon.png`, and the Android adaptive-icon foreground / background / monochrome set. The app icon is a wallet mark, deliberately separate from the in-app seedling-in-an-arch brand; re-run the script to reproduce or vary it.
- **License:** MIT, copyright 2026 reyi06. Third-party components remain under their own licenses; see `LICENSE` and `THIRD_PARTY_NOTICES.md`.
- **Source:** public at https://github.com/reyi06/ledger. Open source applies to the code; the product is still private by default for the person using it.
- **Not on hand, and must not be fabricated:** testimonials, customers, user counts, benchmarks, press coverage, pricing, store listings, store screenshots, or any analytics and telemetry — there is no network call to collect them, and none has been run.

## Product Principles

1. **The numbers are the product.** Money is integer minor units in a branded `Cents` type, validated at both storage ends. Correctness outranks convenience; float arithmetic never enters.
2. **Privacy is architectural, not a promise.** Today nothing leaves the device, and the credibility of the product rests on that. Changing it is a product decision requiring its own consent, not an implementation detail.
3. **The domain stays pure.** Keeping balances, totals, groupings, budgets and recurring expansion free of React and I/O is what makes correctness provable in tests rather than asserted.
4. **Public release carries production obligations.** Because strangers install this: onboarding, real data safety, store assets and support are in scope, not optional polish.
5. **State limits plainly.** Exclusions (no sync, no bank imports, no encryption at rest) are documented rather than papered over, and the interface must never imply a safety the app does not provide.

## Accessibility & Inclusion

- Money direction is carried by sign, arrow and weight **first**, with colour only reinforcing it, so it survives colour-blindness and grayscale printing (`src/constants/theme.ts`).
- Contrast is documented against WCAG in the token file: forest ink at 11:1 on alabaster, secondary text at 5.6:1 and tertiary at 4.9:1, both past the 4.5:1 body floor. Each pigment ships twice — a fill and an ink dark enough to set text in — because sage as a text colour fails every floor there is.
- Every state is also stated in words, so no state depends on colour alone: an over-budget envelope reads "over by $42.00" as well as turning terracotta.
- Entrances honour the platform Reduce Motion setting and keep content visible when it is on.
- **Undecided and unverified:** no formal target has been set (WCAG level, VoiceOver/TalkBack coverage, Dynamic Type / system font scaling). For a release-bound product these are open, not settled.
- **Translation coverage is partial.** The tab bar, tour, auth screens and assistant are fully translated into Filipino; the tab screens' inner copy is still English.
