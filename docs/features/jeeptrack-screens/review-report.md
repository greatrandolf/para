FAIL

# Review report: jeeptrack-screens (acceptance review, cycle 1)

Verdict: **FAIL**. AC28, AC35 and AC38 are NOT MET because required copy is truncated. AC42 is UNVERIFIED because the 375 pt run was never done. Four major defects are open (D1 to D4).

## Checks (run by the reviewer this cycle, from `para/`)

| Command | Exit | Result |
|---|---|---|
| `npx tsc --noEmit` | 0 | no errors |
| `npx expo lint` | 0 | no errors or warnings |
| `npm test -- --watchAll=false` | 0 | 20 suites, 81 tests passed |
| `npx expo-doctor` | 0 | 20/20 checks passed |

Static greps (reviewer): packages do not import from `src/`; screens do not import across roles; no `StyleSheet.create` and no `style={{` in `*Screen.tsx`; no hex or rgb(a) literals outside `packages/ui/src/theme/`; no `console.`, `any`, `.only` or `.skip`; no `react-native-maps`, `expo-maps` or `expo-location`; no secrets, tokens or `http://` URLs; there is no `ios/` or `android/` folder. All 13 `<Pressable` call sites set `accessibilityRole`.

## Criteria

| ID | Status | Evidence |
|---|---|---|
| AC1 | MET | tsc exit 0 (reviewer run) |
| AC2 | MET | lint exit 0. `eslint.config.js` uses `eslint-config-expo/flat`, has role and package `no-restricted-imports` blocks, and turns the colour `no-restricted-syntax` rule off for the theme |
| AC3 | MET | jest exit 0, 20 suites. `"test": "jest"` and `preset: "jest-expo"` are in package.json. A test exists for all 11 screens and for currency, commuterService, SegmentedControl, ProgressBar, Button and navigation |
| AC4 | MET | expo-doctor exit 0 (reviewer run) |
| AC5 | MET | No maps or location packages. QA ac16-role-select.png shows Expo Go running with custom fonts |
| AC6 | MET | `src/components`, `global.css`, `explore.tsx`, `use-theme` and `use-color-scheme*` are all absent |
| AC7 | MET | 11 one-line `export { default } from '@/screens/<role>/…'` route files plus 4 layouts. Each group imports only from its own role folder |
| AC8 | MET | Every screen folder has index.ts, styles.ts and `<Name>Screen.tsx`. No inline styles in Screen files |
| AC9 | MET | grep finds no cross-role imports. Lint enforces this |
| AC10 | MET | No `@/` imports in packages. Every component folder has the 3 files. Aliases are in tsconfig.base.json and jest moduleNameMapper |
| AC11 | MET | Lint covers colour literals. QA counted 47 of 47 DESIGN.md keys (the plan's "48" is a miscount), 13 typography styles, and radius and spacing that match |
| AC12 | MET | `src/app/_layout.tsx` calls preventAutoHideAsync, then `useFonts(fontAssets)`, then hides the splash on load or error |
| AC13 | MET | `tabIcons/` deleted. Tab icons go through `TabBarIcon` and `Icon` |
| AC14 | MET | Reviewer audit: all domain data comes from `src/services/*` getters. The only inline arrays in screens are UI config: `QUICK_ACTIONS` (CorridorRadarScreen.tsx:30) and `ledgerOptions` (WalletScreen.tsx:48). Two minor hardcoded values are listed as D11 |
| AC15 | MET | app.json `userInterfaceStyle: "light"`. `StatusBar style="dark"`. QA ac15-* screenshots |
| AC16–AC27 | MET | Code paths checked (`router.replace('/commute' \| '/duty')`, filterRoutes, modal, Alert) plus QA screenshots ac16–ac27 and passing screen tests |
| AC28 | **NOT MET** | DirectionPanels.tsx:38-48 shows "Unit 23" as "Unit…" (QA bug-live-unit23-truncated-crop.png, confirmed by reviewer). See D1 |
| AC29 | MET | QA ac29-* screenshots and LiveTrackingScreen.test.tsx. The pill usability issue is D6 |
| AC30 | MET | MapCanvas is built from Views only. No maps imports |
| AC31–AC34 | MET | QA ac31–ac34 screenshots and WalletScreen.test.tsx (Alert spy). The gradient corners issue is D4 |
| AC35 | **NOT MET** | DutyHubScreen.tsx:98-101 shows "Mang Ernesto Sant…" (QA bug-duty-name-truncated-crop.png). See D2 |
| AC36 | MET | QA ac36-* screenshots. The "/" hidden in the next stop is D5 |
| AC37 | MET | DutyHubScreen.tsx:47-67 clears the timer on unmount and before each new report. The test uses fake timers. QA ac37-* screenshots |
| AC38 | **NOT MET** | EarningsPoolScreen.tsx:55-59 and :190-197 truncate the banner title and "412 Commuter Unlocks" (QA crops). See D3 |
| AC39 | MET | QA ac39-* screenshots. `view-pot` navigates to `/earnings` |
| AC40 | MET | Required copy is visible and the switch flips (QA ac40-*). The badge overlap is D7 |
| AC41 | MET (402 pt) | QA iPhone 17 run |
| AC42 | **UNVERIFIED** | QA never ran the app at 375 pt. Counts as a failure. See D10 |
| AC43 | MET (static) | Step-15 testIDs are present. Every Pressable has a role and label. RN `Switch` has its native role plus `accessibilityLabel` |

## Defects

1. **[major] `src/screens/commuters/LiveTracking/DirectionPanels.tsx:38-48`** (style `src/screens/commuters/LiveTracking/styles.ts:66` `unitName: { flexShrink: 1 }`). The ETA text (`unit.eta`, e.g. "3m (Tracked)") cannot shrink, so the unit name collapses to "Unit…". The panel headers also truncate ("To Apas…", "To Colon…"). **Expected fix outcome:** at 402 pt and 375 pt, the tracked row shows at least "Unit 23" in full, as the design shows it in 10 px text. Possible approaches: give the name `flexShrink: 0` or a `minWidth`, let the ETA shrink or truncate, use the smaller `labelSm` variant the design uses, or put the ETA on a second line. Add a test that asserts "Unit 23" renders. (Fixes AC28.)
2. **[major] `src/screens/drivers/DutyHub/DutyHubScreen.tsx:98-101`**. The `headlineLg` `numberOfLines={1}` name shares a row with the rating Badge, so it truncates to "Mang Ernesto Sant…". **Expected fix outcome:** "Mang Ernesto Santos" shows in full at 402 pt and 375 pt. Options: use a smaller type token as in the design, move the rating badge to the line below, or allow 2 lines. (Fixes AC35.)
3. **[major] `src/screens/drivers/EarningsPool/EarningsPoolScreen.tsx:55-59`** (banner title truncates to "…& Earni…" next to the `LIVE` badge) **and `:190-197`** (the telemetry `item.value` truncates to "412 Commuter Unlo…" next to the trailing Badge). **Expected fix outcome:** "Corridor Pool Active & Earning" and "412 Commuter Unlocks" render in full at 402 pt and 375 pt. Options: a smaller type token, letting the text wrap to 2 lines, or moving the badge above or below the text. (Fixes AC38.)
4. **[major] `packages/ui/src/GradientCard/GradientCard.tsx:26` with `packages/ui/src/GradientCard/styles.ts:6-11`**. `borderRadius`, `overflow: 'hidden'` and `boxShadow` sit on the `LinearGradient` itself, so on iOS the fill draws square under a rounded shadow (QA bug-gradient-square-corner-crop.png, bug-wallet-credits-square-corners-crop.png). This affects every gradient card: Wallet credits, Duty broadcast and daily earnings, Earnings banner, and the Radar views card. **Expected fix outcome:** an outer `View` carries `borderRadius: radius.lg` and `boxShadow`, an inner clipping `View` (`borderRadius` + `overflow: 'hidden'`) holds the `LinearGradient`, and caller `style` and padding still apply. All five cards show 16 px rounded fills on iOS.
5. **[minor] `src/screens/drivers/DutyHub/DirectionCard.tsx:105-111`** (style `src/screens/drivers/DutyHub/styles.ts:73`). The next-stop `AppText` inside `nextStop` has no `flexShrink`, so it runs under the "+14 pax waiting" badge and hides the " /" in "Fuente Osmeña Circle / Bogo Bus". **Expected fix outcome:** the text shrinks or wraps inside its container (`flexShrink: 1` on the text), and the full string is readable in both directions. The static "+14 pax waiting" matches the design and is not a defect.
6. **[minor] `src/screens/commuters/LiveTracking/EtaSheet.tsx:70`** (`styles.ts:140-148`). The direction pills sit in a horizontal `ScrollView`, so after "Switch" the newly selected "Towards Apas" pill is off-screen. **Expected fix outcome:** two side-by-side `flex: 1` pills with `numberOfLines={1}` truncation, as in the design, with no horizontal scroll. Both pills and the selection change are visible at 375 pt.
7. **[minor] `src/screens/drivers/DriverProfile/DriverProfileScreen.tsx:190-210`** (style `styles.ts:54` `payout`). The `GCash Transit Wallet` + `VERIFIED` row does not shrink, so the badge runs under the `Switch` (confirmed in QA ac40-profile-coop-switch-on.png; the QA crop file bug-profile-verified-switch-overlap-crop.png shows the wrong area). **Expected fix outcome:** the badge and the switch do not overlap at 402 pt or 375 pt. Options: let the inner row wrap (`flexWrap: 'wrap'`), make the label shrink (`flexShrink: 1`), or move the badge under the label.
8. **[minor] `src/screens/commuters/LiveTracking/styles.ts:78-80`** (`gorordoLabel`, `capitolLabel`, rendered at CorridorMap.tsx:28). The "Gorordo Ave. (IT Park)" and "Cebu Provincial Capitol" map labels overlap. **Expected fix outcome:** the labels are placed so they don't overlap at 375 pt or 402 pt.
9. **[minor] `packages/ui/src/Badge/styles.ts:9`** (`alignSelf: 'flex-start'`), used at `packages/ui/src/ComingSoon/ComingSoon.tsx:29`. The "Coming soon" badge is left-aligned inside a centred card. **Expected fix outcome:** ComingSoon passes `style={{ alignSelf: 'center' }}` via a `styles.badge` entry in ComingSoon/styles.ts, and the badge is centred on Activity, Account and Trips. Do not change the Badge default.
10. **[major, process] AC42 UNVERIFIED.** No run at 375 pt exists. **Expected outcome:** after D1–D3, D5–D8 are fixed, QA runs every screen on an iPhone 17 (375 pt) simulator and attaches screenshots showing no clipped or overlapping text. Truncations at 402 pt make further failures at 375 pt likely, so the developer should check D1–D3 at 375 pt as part of the fix.
11. **[minor] Hardcoded domain values in screens (AC14 hygiene).** `src/screens/commuters/CommuteHub/CommuteHubScreen.tsx:246` has "₱45" in the guarantee copy, and `src/screens/drivers/DriverProfile/DriverProfileScreen.tsx:53` has `initials="ES"`. **Expected fix outcome:** both values come from service data (`formatPeso(summary.balance)` and a driver-identity initials field), so the copy follows the mock balance.
12. **[nit] `src/screens/drivers/DutyHub/BroadcastCard.tsx:75`.** The label change from "Report Delay / Issue" to "Reported!" changes the button height, so the card jumps by about 20 pt (QA BUG-10). **Expected fix outcome:** stable height, for example `numberOfLines={1}` on both glass buttons, or a fixed `minHeight` on the actions row.
13. **[nit] `src/app/_layout.tsx:9` and `:16`.** `SplashScreen.preventAutoHideAsync()` and `hideAsync()` are called without handling rejection. **Expected fix outcome:** `.catch(() => {})` or an equivalent on both calls, so no unhandled promise rejection can surface.

## Code quality and architecture notes (no action needed)

- `Tabs` is imported from `expo-router/js-tabs`, not from `expo-router` as D3 in the plan says. This is correct: `node_modules/expo-router/build/exports.d.ts:53` marks the `expo-router` export `@deprecated` in favour of `expo-router/js-tabs`.
- The Root Stack sets `gestureEnabled: false` on the role groups, which supports AC21.
- Data is static and synchronous (plan D11), so no loading or error states are needed. Empty states exist for search ("No routes match your search"), Clear Log and the ledger.

## Scope

- No base commit exists for `para/` (the whole folder is untracked in git), so no diff could be taken. Scope was checked against the plan's "Expected changed files" list.
- Files outside the plan's list:
  - `src/constants/navigation.ts`: tab config, imported by both tab layouts. Acceptable.
  - `packages/ui/src/MapCanvas/types.ts`
  - `src/screens/drivers/DutyHub/CorridorMiniMap.tsx`: allowed as "local parts as needed".
  - `src/services/driverService.test.ts`
  - `packages/ui/src/TabBarIcon/TabBarIcon.test.tsx`

  None of these is harmful, and none needs to be reverted.
- `ios/` and `android/` are not present. The `stitch/` folder was not checked against an original (no git history).
