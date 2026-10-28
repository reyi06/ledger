# Security policy

## Supported versions

Ledger `1.x` is supported with security fixes. The latest release on the `main`
branch is the supported version.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's private vulnerability reporting:

https://github.com/reyi06/ledger/security/advisories/new

If that form is unavailable, contact the maintainer [@reyi06](https://github.com/reyi06)
through GitHub and ask for a private channel. Include:

- a description of the issue and its impact;
- the affected version, platform and build type;
- reproduction steps or a minimal proof of concept;
- any suggested fix or mitigation.

Please do not test against other people's devices, data or accounts. Never include
a real ledger export, PIN, biometric data or signing key in a report.

## Scope

Examples of issues in scope:

- bypassing the PIN, lockout or biometric gate;
- reading or exporting ledger data without the app's authorization;
- CSV injection or another unsafe export path;
- a dependency or build-path issue that affects shipped code;
- accidental transmission of ledger data.

## Known design limitations

These are documented product boundaries, not undisclosed vulnerabilities:

- **Storage is not encrypted at rest.** The ledger lives in app-scoped
  AsyncStorage in the clear. The PIN gates casual access to the app; it is not a
  cryptographic key protecting the data from an attacker with device access.
- **The Android manifest keeps the standard `INTERNET` permission.** The app code
  contains no network client, but Expo development builds use the permission to
  reach Metro. A production-only build can block it if an OS-enforced offline
  guarantee is required.
- **Device backups are controlled by the operating system.** Ledger does not run a
  cloud backup service, but an OS-level backup may include app data if the user
  enables one.
- **Biometric and iOS behavior need simulator/emulator and real-device
  verification.** No iOS simulator or hardware run has been performed yet. See
  the "Still NOT verified" section in [`RELEASE.md`](./RELEASE.md).

## Disclosure

Reports will be acknowledged on a best-effort basis. Please allow time for a fix
and a coordinated release before publishing details. Credit will be given if the
reporter wants it.
