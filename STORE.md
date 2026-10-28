# Play Store release

Status: **not submittable yet.** The app is complete; Android and web paths are
verified, while iOS remains unverified. What remains is mostly credentials and
assets that belong to the publisher, not to the code.

The source is public under the MIT license. That resolves the code licensing
question; it does not replace the Play Console account, upload key or listing assets.

---

## 1. Blockers only you can clear

| # | Blocker | Why it matters |
|---|---|---|
| 1 | **An upload keystore** | The attached test APK and AAB are signed with the Android debug key (`CN=Android Debug`). Play rejects them. The key must be yours — generating one on your behalf would lock the listing to a secret you do not hold. |
| 2 | **A store-signed `.aab`** | The attached `ledger-1.0.0-test-debug.aab` is debug-signed and is not a Play upload. Play has required an Android App Bundle for new apps since August 2021; the bundle must be signed with your upload key. |
| 3 | ~~The package name~~ | **Resolved: `com.reyi06.ledger`**, set in `app.json` for both Android and iOS. It is permanent once published. |
| 4 | **A privacy policy URL** | The policy is drafted in [`PRIVACY.md`](./PRIVACY.md). Play needs a public, hosted URL; the content is short because nothing leaves the device. |
| 5 | **A Play Console account** | One-time $25, tied to your Google account. |
| 6 | ~~`LICENSE`~~ | **Resolved: MIT**, in `LICENSE` and `THIRD_PARTY_NOTICES.md`. |

## 2. Store listing assets

| Asset | Spec | State |
|---|---|---|
| App icon | 512×512 PNG | **done** — `assets/images/store-icon.png` |
| Feature graphic | 1024×500 PNG | **not made.** It wants the wordmark, and `tools/generate-icons.mjs` has no font rasteriser. A forest field with the mark is the honest best I can generate; text should be added by you. |
| Phone screenshots | ≥2, 16:9 or 9:16 | **not made.** Emulator captures exist but they are test evidence, not store quality. |
| Short description | ≤80 chars | drafted below |
| Full description | ≤4000 chars | drafted below |
| Data safety form | declaration | answered below |
| Content rating | questionnaire | not started |

### Short description (65 chars)

```
A private offline ledger for your accounts, spending and budgets.
```

### Full description

```
Ledger is a personal finance app that keeps everything on your phone.

There is no account to create and no cloud. Every number you see — net worth
across your accounts, what came in and went out this month, how your budgets are
holding, and what changed since last month — is worked out on the device from
data stored on the device.

YOUR LEDGER STARTS EMPTY

Nothing is pre-filled. You add your first account and your first transaction, so
the figures you see are yours and not a demonstration.

WHAT IT DOES

• Overview — net worth with the month's movement, income and spending, a
  six-month spending chart, and where the month's money went.
• Activity — the whole history grouped by day, searchable. Hold a row to select
  several and drag to select a range.
• Budgets — a monthly limit per category, with over-budget envelopes marked
  clearly.
• Insights — your savings rate, spending pace, category trends, top merchants,
  and the month's biggest expense.
• Assistant — ask questions about your own ledger and get answers worked out on
  the device.
• Offline sign-in — a six-digit PIN, with optional fingerprint or face unlock.

PRIVATE BY ARCHITECTURE

There is no backend, so there is nothing to leak. The app makes no network calls.

BUILT FOR READING NUMBERS

A warm paper ground, generous type, and tabular figures that line up in columns.
Light and dark. English and Filipino, and eight currencies including PHP.
```

### Data safety form

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | N/A — nothing is transmitted |
| Do you provide a way for users to request that their data be deleted? | **Yes** — Settings → Data → Erase everything |
| Data collected / shared | none |

This declaration is truthful only while the app makes no network calls. If a
downloadable assistant model is added later, this form must be revisited.

## 3. The build itself

Once a keystore exists, build the bundle with EAS — it handles signing, and
Play requires the AAB anyway:

```bash
npx eas-cli@latest build --platform android --profile production
```

`eas.json` already has a `production` profile and the package is
`com.reyi06.ledger`. Let EAS generate and store the keystore (or supply your own
via `eas credentials`).

## 4. Before you upload

- [x] Package name set in `app.json` (`com.reyi06.ledger`)
- [ ] Upload keystore created; `eas credentials` configured
- [ ] `versionCode` incremented from 1 if this is not the first upload
- [ ] Privacy policy hosted, URL ready
- [ ] Feature graphic made (1024×500)
- [ ] At least two phone screenshots captured on a real device
- [ ] Data safety form filled in as above
- [ ] Content rating questionnaire completed
- [x] `LICENSE` confirmed (MIT)
- [x] `npm run verify` green, and `npm run doctor` at 20/20
- [ ] Production AAB built and inspected
