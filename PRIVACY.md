# Ledger privacy policy

**Effective date:** October 28, 2026

Ledger is an offline personal finance app. It is designed so that the person using
it does not need an account and does not send their ledger to a server.

## What Ledger collects

**Nothing.** Ledger has no account system, no analytics, no advertising, no crash
reporting, no telemetry and no third-party network SDKs. The app does not collect
personal information, device identifiers, location or usage data.

## Where your data is stored

Accounts, transactions, budgets, recurring rules, settings and the local profile
are stored on your device in app-scoped storage. The optional PIN is stored only
as a salted, stretched hash; the PIN itself is not stored.

The ledger is **not encrypted at rest**. The operating system's app sandbox and
the optional PIN/biometric lock limit casual access, but they are not a substitute
for full-disk encryption or a dedicated encrypted database. Do not use Ledger on a
device you do not trust.

## Network access

The app code contains no network client and does not transmit ledger data. The
Android manifest retains the standard `INTERNET` permission because Expo
development builds use it to reach the local Metro server; the production app does
not open a network connection. If you build a production-only variant that blocks
`android.permission.INTERNET`, the offline guarantee is enforced by the operating
system at the cost of development tooling.

This policy does not cover GitHub, the app store or the operating system. Those
services have their own privacy policies and may process information when you
visit the repository, download the app or use device-level services.

## Backups and device services

The app does not operate a cloud backup or sync service. If you enable an
operating-system backup (for example iCloud Backup or Android Auto Backup), your
device may include the app's local data in that backup. That behavior is
controlled by the operating system and your account provider, not by Ledger.

## Deleting your data

Use **Settings → Data → Erase everything** in the app to remove the local ledger
and profile. Uninstalling the app also removes its app-scoped data, subject to any
operating-system backup that still contains it. There is no server-side copy to
delete.

## Children

Ledger is not directed at children under 13 and does not knowingly collect
personal information from anyone.

## Changes

If this policy changes, the effective date above will be updated and the change
will be committed to this repository. Material changes will be called out in
[`CHANGELOG.md`](./CHANGELOG.md).

## Contact

For a non-sensitive privacy question, open an issue at
https://github.com/reyi06/ledger/issues. For a security or privacy report that
should not be public, use the private process in [`SECURITY.md`](./SECURITY.md).
