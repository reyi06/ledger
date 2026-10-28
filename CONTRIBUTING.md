# Contributing to Ledger

Thanks for taking the time to improve Ledger. The project is an offline-first Expo
app; the most useful contributions keep it fast, correct, private and easy to
audit. Participation is governed by the
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Before you start

- Read [`README.md`](./README.md), [`PRODUCT.md`](./PRODUCT.md) and
  [`AGENTS.md`](./AGENTS.md) for the product and engineering constraints.
- Read [`SECURITY.md`](./SECURITY.md) before reporting a vulnerability. Do not
  open a public issue for a security bug.
- Use Node.js `^22.13.0`, `^24.3.0`, `^26.0.0` or `>=27.0.0` and npm.
- Ledger is MIT-licensed. By contributing, you agree that your contribution is
  licensed under the same terms.

## Set up

```bash
git clone https://github.com/reyi06/ledger.git
cd ledger
npm ci
npm start
```

Press `i`, `a` or `w` in the dev server to open iOS, Android or web. Native
development requires the platform toolchains; the web target is the quickest way
to review layout and copy.

## Before opening a pull request

Run the same checks CI runs:

```bash
npm run verify
npm run doctor
npx expo export --platform all
```

- `npm run verify` runs strict TypeScript, ESLint and the Jest suite.
- `npm run doctor` runs Expo Doctor. It should stay at 20/20.
- The export command proves that the iOS, Android and web JS bundles build.

For native changes, also run the app on a device or emulator. iOS has not been
verified on physical hardware in this repository, so a real-device report is
especially valuable.

## Project conventions

- Keep the domain layer pure. `src/domain/` must not import React or perform I/O.
- Money is an integer count of minor units wrapped in the branded `Cents` type.
  Never introduce floating-point arithmetic for money.
- Validate persisted data with Zod on both read and write. If you change a stored
  schema, provide a migration or a deliberate versioned key; do not silently
  reinterpret existing data.
- Read visual values from the theme tokens in `src/constants/theme.ts`; do not
  hard-code colours, type sizes or spacing in screens.
- Add tests for domain and library changes. Test behaviour rather than
  implementation details.
- Add user-facing strings to `src/i18n/` where the surrounding screen is already
  translated. The project falls back to English for missing keys.
- Keep the app offline. A change that adds a network call needs an explicit
  product decision, a privacy-policy update and a review of the store data-safety
  answers. Do not add analytics or telemetry.
- Never commit `node_modules/`, `android/`, `ios/`, `.env`, signing keys, APK/AAB
  artifacts, `release/` or generated local data.
- Use `npx expo install` for Expo and React Native packages so versions stay
  compatible with the installed SDK.

## Pull requests

Keep a pull request focused on one change. Include:

- what changed and why;
- the checks you ran;
- screenshots or a short recording for visible UI changes;
- any migration, privacy or store-listing impact.

Update [`CHANGELOG.md`](./CHANGELOG.md) for user-visible changes. Release version
bumps and store metadata belong in release pull requests.

## Reporting bugs and requesting features

Use the GitHub issue forms. Include the app version, platform, Expo SDK version,
reproduction steps and, for rendering bugs, a screenshot. Remove personal ledger
data and credentials from logs and screenshots.

## Questions

Open a GitHub discussion or issue for non-sensitive questions. For security
reports, follow [`SECURITY.md`](./SECURITY.md) instead.
