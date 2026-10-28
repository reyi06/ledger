# Changelog

All notable changes to Ledger are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-28

### Added

- Offline accounts, transactions, transfers, recurring rules, budgets and
  month-over-month insights.
- A deterministic on-device assistant that answers questions about the user's own
  ledger without a language model or network request.
- Six-digit PIN onboarding and unlock, optional biometric unlock, an auto-lock
  timer, escalating failed-attempt cooldowns and a hide-balances privacy mode.
- CSV export through the system share sheet.
- A seven-step guided tour, replayable from Settings.
- English and Filipino translations for the navigation, tour, auth screens and
  assistant, with system/light/dark themes and multiple currencies including PHP.
  Inner copy on the main tabs is still partially English; see the README.
- A deterministic demo ledger that is opt-in and can be erased from Settings.
- CI covering typechecking, linting, Jest tests, Expo Doctor and platform bundle
  exports.

### Changed

- Published the project under the MIT license with third-party notices.
- Set the permanent app identity to `com.reyi06.ledger`.
- Updated Expo SDK 58 packages to their current compatible patch versions.

### Security

- No backend, account system, analytics or network client in the app code.
- Documented that local storage is not encrypted at rest and that the PIN is an
  app-level gate rather than cryptographic protection.
