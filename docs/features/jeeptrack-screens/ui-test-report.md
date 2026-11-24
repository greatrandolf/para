# UI test report: jeeptrack-screens

## Environment

- Device / simulator: iPhone 17 simulator (402 x 874 pt, Dynamic Island), iOS 26.5, UDID 17351887-219E-4DC4-A108-43E03A99C3EC
- Small device: "QA 17" (iPhone 17 3rd gen, 375 pt). Booted and Expo Go was installed, but the app never loaded. `open_url` timed out twice, then the simulator was shut down from outside this session before the app was opened (see Notes). **AC42 not tested.**
- Build: **Expo Go 58.0.7** (no development build). Metro run with `CI=1 npx expo start --port 8093` from `para/`, opened with `open_url exp://127.0.0.1:8093` (log: `iOS Bundled 791ms node_modules/expo-router/entry.js (1410 modules)`).
- Mode: light (the app is light-only). Dark appearance was switched on to check AC15, then set back to light.
- Date: 2026-11-09
- Driving method: Claude Code iOS Simulator tool (screenshot, tap, swipe, text, press_key, set_keyboard, set_appearance, open_url). Maestro was not used.
- Commands run from `para/`: `npx tsc --noEmit` (exit 0), `npx expo lint` (exit 0), `npm test -- --ci` (20 suites / 81 tests passed), `npx expo-doctor` (20/20 checks passed), plus grep / python static checks (listed per AC).

## Summary

| Result | Count |
|---|---|
| PASS | 38 |
| FAIL | 3 (AC28, AC35, AC38) |
| NOT TESTED | 2 (AC14, AC42) |

All three FAILs have the same cause: copy that the AC requires, and that the design shows in full, is cut off with an ellipsis at 402 pt. On a 375 pt SE it is likely worse (not run).

## Results

| Criterion | Result | Evidence |
|---|---|---|
| AC1 tsc | PASS | `npx tsc --noEmit` exit 0 |
| AC2 lint | PASS | `npx expo lint` exit 0. `eslint.config.js` requires `eslint-config-expo/flat` and has three `no-restricted-imports` blocks plus the colour-literal `no-restricted-syntax` rule (off for theme) |
| AC3 tests | PASS | `npm test` 20 suites / 81 tests pass. `"test": "jest"`, `preset: "jest-expo"`. A test file exists for all 11 screens, `currency`, `commuterService` (filterRoutes/filterLedger), `SegmentedControl`, `ProgressBar`, `Button` and `navigation.test.tsx` |
| AC4 expo-doctor | PASS | `npx expo-doctor`: 20/20 checks passed |
| AC5 Expo Go | PASS | No `react-native-maps`/`expo-maps`/`expo-location` in package.json. App launched in Expo Go with no red box and custom fonts. screenshots/ac16-role-select.png |
| AC6 template removed | PASS | `src/components/`, `src/global.css`, `explore.tsx`, `use-theme.ts`, `use-color-scheme*` absent. No imports of them (grep) |
| AC7 route files | PASS | 11 route files + 4 layouts. Each route is a single `export { default } from '@/screens/<role>/<Screen>'` from the correct role folder |
| AC8 screen folders | PASS | All 11 folders have `index.ts`, `styles.ts` and `<Name>Screen.tsx`. No `StyleSheet.create` or `style={{` in any `*Screen.tsx` |
| AC9 role isolation | PASS | grep for cross-role imports: none |
| AC10 packages/ui | PASS | No `@/` or `src/` imports in packages. Every component folder has the 3 files. Alias is in `tsconfig.base.json` and Jest `moduleNameMapper`. App bundles in Metro |
| AC11 tokens | PASS | DESIGN.md front matter has **47** colour keys (the plan says 48; it miscounts), and all 47 are in `colors.ts` with matching hex. 13 typography styles. `radius.ts`/`spacing.ts` match `rounded`/`spacing`. `src/constants/theme.ts` re-exports. Lint covers literals |
| AC12 fonts | PASS | Root layout: `SplashScreen.preventAutoHideAsync`, `useFonts(fontAssets)` (Jakarta 600/700/800, Inter 400/500/600/700/800), hides on load/error, `StatusBar style="dark"`. No `fontWeight` in typography tokens |
| AC13 icons | PASS | `assets/images/tabIcons/` deleted, no PNG icons referenced in src/packages. Vector icons render on every tab |
| AC14 mock data | NOT TESTED | Did not audit screen files for inline data arrays. Left for code review |
| AC15 light-only | PASS | `userInterfaceStyle: "light"`. With the simulator in dark mode, Radar and Duty look the same as in light mode. screenshots/ac15-dark-mode-radar-unchanged.png, ac15-dark-mode-duty-unchanged.png |
| AC16 role select | PASS | screenshots/ac16-role-select.png |
| AC17 commuter entry | PASS | Commute Hub. Tabs Commute, Live Map, Activity, Wallet, Account; Commute active. screenshots/ac17-commute-hub-top.png |
| AC18 driver entry | PASS | Duty Hub. Tabs Duty, Earnings, Radar, Trips, Profile; Duty active. screenshots/ac18-duty-hub-top-apas-default.png |
| AC19 tab switching/styling | PASS | Every tab in both roles opened its screen. Active tab is red with the dot; inactive tabs are slate with no dot (e.g. ac20-*, ac38-earnings-top.png, ac39-radar-fresh-open-top.png) |
| AC20 placeholders | PASS | Activity, Account and Trips each show their icon, title, "Coming soon" and a description, under the role's top bar. ac20-activity-placeholder.png, ac20-account-placeholder.png, ac20-trips-placeholder.png. Cosmetic issue: BUG-9 |
| AC21 exit role | PASS | Switch role and End Shift both land on role select. A left-edge back swipe stays on role select. ac21-switch-role-lands-role-select.png, ac21-back-swipe-stays-role-select.png, ac21-end-shift-transition.png, ac21-end-shift-back-swipe-stays.png |
| AC22 hub content | PASS | ac17-commute-hub-top.png, ac22-commute-hub-routes-1.png, ac22-commute-hub-routes-2.png, ac25-offline-card-and-bottom.png |
| AC23 chip filters | PASS | Jeepneys Only hides Fairview. Bus shows only Fairview. All restores. ac23-jeepneys-chip-selected.png, ac23-jeepneys-list.png, ac23-bus-only-list.png, ac23-all-transit-restored.png |
| AC24 search | PASS | "PITX" leaves only Fairview. "zzz" shows "No routes match your search". "cubao" (lower case) matches. ac24-search-pitx-typed.png, ac24-search-pitx-result.png, ac24-search-zzz-empty.png |
| AC25 offline card | PASS | "0 on road (Offline)", "Walay Available Driver", "₱0 (No Charge)", greyed "No Charge (₱0)" button and no View Live button. Button passes `disabled`, and `Button` sets `accessibilityState={{ disabled }}`. ac25-offline-card-and-bottom.png |
| AC26 confirm drawer | PASS | Drawer shows the route name, ₱1.00 and ₱44.00. Cancel closes it. Confirm opens Live Map. ac26-confirm-drawer.png, ac26-cancel-closes.png, ac26-confirm-drawer-fairview.png, ac26-confirm-opens-live-map.png |
| AC27 cash-in / pill / clear / re-open | PASS | ac27-cashin-opens-wallet.png, ac27-balance-pill-opens-wallet.png, ac27-clear-log-empty.png, ac27-reopen-opens-live-map.png |
| AC28 live tracking content | **FAIL** | "Unit 23" never shows: the tracked row reads "Unit…" (BUG-1). Everything else required is visible. ac28-live-tracking-top.png, bug-live-unit23-truncated-crop.png, ac28-live-tracking-map-eta.png, ac28-live-tracking-bottom.png |
| AC29 switch / refresh / back | PASS | Switch moves the selection to Towards Apas and back. Refresh shows "just now". Commute Hub link activates the Commute tab. ac29-switch-apas-selected.png, ac29-switch-restored-refresh-just-now.png, ac29-back-to-commute-hub.png. Usability issue: BUG-7 |
| AC30 MapCanvas only | PASS | grep finds no maps/location imports. Maps are View-based |
| AC31 wallet content | PASS | ac31-wallet-top.png, ac32-wallet-default-50-gcash.png, ac31-wallet-ledger-bottom.png. Cosmetic issue: BUG-4 |
| AC32 package/channel | PASS | Default "Cash In ₱50 via GCash". After choosing ₱100 and Maya, "Cash In ₱100 via Maya" with only those two selected. ac32-wallet-default-50-gcash.png, ac32-wallet-100-maya.png |
| AC33 ledger filters | PASS | Views shows 3 rows incl. ₱0.00. Cash-In shows only GCash. All shows 4. ac33-ledger-views-filter.png, ac33-ledger-cashin-filter-and-maya.png, ac33-ledger-all-filter.png |
| AC34 CTA alert | PASS | "Demo only" alert appears and the balance stays ₱45.00. ac34-cta-demo-alert.png |
| AC35 duty content | **FAIL** | "Mang Ernesto Santos" shows as "Mang Ernesto Sant…" (BUG-2). Everything else required is visible. ac18-duty-hub-top-apas-default.png, bug-duty-name-truncated-crop.png, ac35-duty-pool-sharing.png, ac35-duty-bottom-earnings-dispatcher.png |
| AC36 duty direction | PASS | Defaults: OUTBOUND • TO APAS, N. Escario Central (Parklane), 14 Waiting. After To Colon: INBOUND • TO COLON, waypoints start "Apas IT Park", overlay "Fuente Osmeña Circle - 280m" / "22 Waiting". Switch returns to Apas. ac36-duty-colon-selected.png, ac36-duty-colon-overlay-22-waiting.png, ac36-switch-back-to-apas.png. The "/" in the next stop is hidden (BUG-5) |
| AC37 tracking / report | PASS | Stop shows TRACKING PAUSED, slate card and Resume Tracking. Resume restores the live state. "Reported!" reverted within about 3 s. ac37-tracking-paused.png, ac37-resumed-and-reported.png, ac37-reported-reverted.png. Layout jump: BUG-10 |
| AC38 earnings content | **FAIL** | "Corridor Pool Active & Earning" shows as "…& Earni…" and "412 Commuter Unlocks" as "412 Commuter Unlo…" (BUG-3). Everything else visible. ac38-earnings-top.png, ac38-earnings-telemetry.png, ac38-earnings-bottom.png, bug-earnings-banner-truncated-crop.png, bug-earnings-unlocks-truncated-crop.png |
| AC39 radar | PASS | All required copy visible. View Pot opens Earnings. ac39-radar-top-map.png, ac39-radar-fresh-open-top.png, ac39-radar-bottom.png, ac39-view-pot-opens-earnings.png |
| AC40 profile | PASS | All required copy visible. GCash switch flips on to off to on. ac40-profile-top.png, ac40-profile-coop-switch-on.png, ac40-gcash-switch-off.png, ac40-profile-bottom.png. Overlap: BUG-6 |
| AC41 safe areas | PASS (iPhone 17) | On every screen the top bar sits below the Dynamic Island and the last content (guarantee cards, dispatcher card, LTFRB card, profile footer, radar tiles) scrolls fully above the tab bar. The tab bar clears the home indicator. Role select clears both insets |
| AC42 375 pt | NOT TESTED | The SE simulator never loaded the app (see Environment and Notes) |
| AC43 a11y / testIDs | PASS (static) | All step-15 testIDs exist in source. Every Pressable/Touchable has `accessibilityRole` and `accessibilityLabel`; RN `Switch` exposes the switch role natively. Not checked in the iOS accessibility inspector |

## Bugs

### BUG-1: Live Map: tracked unit "Unit 23" is cut to "Unit…"
- Severity: major (fails AC28)
- Steps: Commuter role, open the Live Map tab, look at the "To Colon" direction panel (top card, and repeated in the sheet).
- Expected: "Unit 23 (GMD-1782)" reads at least "Unit 23 …", as in the design (10 px text, `truncate`).
- Actual: The red tracked row shows "Unit…" because "3m (Tracked)" takes the row width at the larger font. The panel headers also cut to "To Apas…" / "To Colon…", and the top bar to "Live Corr…" / "ON-DEMAND VI…".
- Screenshot: screenshots/bug-live-unit23-truncated-crop.png, screenshots/ac28-live-tracking-map-eta.png

### BUG-2: Duty Hub: driver name cut to "Mang Ernesto Sant…"
- Severity: major (fails AC35)
- Steps: Driver role, Duty tab, profile card.
- Expected: "Mang Ernesto Santos" in full, as in drivers-duty-hub.png.
- Actual: "Mang Ernesto Sant…". The 4.9 rating badge takes the remaining width.
- Screenshot: screenshots/bug-duty-name-truncated-crop.png

### BUG-3: Earnings: banner title and telemetry title truncated
- Severity: major (fails AC38)
- Steps: Driver role, Earnings tab. Read the green banner, then scroll to Unit & Pool Telemetry.
- Expected: "Corridor Pool Active & Earning" and "412 Commuter Unlocks" in full, as in drivers-earnings-pool.png.
- Actual: "Corridor Pool Active & Earni…" (the LIVE badge takes the width) and "412 Commuter Unlo…" (the High Trajectory badge takes the width).
- Screenshot: screenshots/bug-earnings-banner-truncated-crop.png, screenshots/bug-earnings-unlocks-truncated-crop.png

### BUG-4: Gradient cards have square corners (rounded border, square fill)
- Severity: minor (visual mismatch with design)
- Steps: Look at Wallet "COMMUTER TRANSIT CREDITS", Duty "BROADCASTING LIVE" and "TODAY'S INSTANT DAILY EARNINGS", Earnings pool banner, Radar "412 Commuter Views".
- Expected: 16 px rounded corners, as in the designs and `radius.lg`.
- Actual: The gradient fill is drawn square while the light border/shadow is rounded. `packages/ui/src/GradientCard/styles.ts` sets `borderRadius` + `overflow: 'hidden'` + `boxShadow` on the `LinearGradient` itself, and the fill is not clipped on iOS here.
- Screenshot: screenshots/bug-gradient-square-corner-crop.png, screenshots/bug-wallet-credits-square-corners-crop.png

### BUG-5: Duty Hub (To Colon): next-stop text runs under the "+14 pax waiting" badge
- Severity: minor
- Steps: Duty tab, tap "To Colon (Carbon)".
- Expected: "Next Stop: Fuente Osmeña Circle / Bogo Bus" readable next to the badge.
- Actual: The " /" is hidden under the badge, so it reads "Fuente Osmeña Circle Bogo Bus". In `DirectionCard.tsx` the text inside `nextStop` (`flex: 1, minWidth: 180`) is not shrink-limited. The badge also stays "+14 pax waiting" in both directions.
- Screenshot: screenshots/bug-duty-next-stop-overlap-crop.png

### BUG-6: Profile: GCash switch overlaps the "VERIFIED" badge
- Severity: minor
- Steps: Driver role, Profile tab, scroll to Cooperative & Payouts.
- Expected: Badge and switch side by side, as in drivers-profile.png.
- Actual: The switch covers the badge's right edge ("VERIFIED" runs into the switch track).
- Screenshot: screenshots/bug-profile-verified-switch-overlap-crop.png

### BUG-7: Live Map: after "Switch" the selected direction pill is off-screen
- Severity: minor (usability)
- Steps: Live Map, scroll to the sheet, tap "Switch".
- Expected: Both direction pills visible side by side (design: two `flex-1` truncated pills), so the selection change is visible.
- Actual: The pills are in a horizontal scroll with only "Towards Colon…" visible. After Switch it just turns unselected, and "Towards Apas" (now selected) only appears after a manual horizontal scroll.
- Screenshot: screenshots/ac29-switch-selected-pill-offscreen.png, screenshots/ac29-switch-apas-selected.png

### BUG-8: Live Map: map labels overlap
- Severity: cosmetic
- Steps: Live Map, scroll to the map.
- Expected: Street labels readable.
- Actual: "Gorordo Ave. (IT Park)" and "Cebu Provincial Capitol" overlap.
- Screenshot: screenshots/bug-live-map-label-overlap.png

### BUG-9: Placeholders: "Coming soon" badge is left-aligned in a centred card
- Severity: cosmetic
- Steps: Open Activity, Account or Trips.
- Expected: Badge centred under the title, like the rest of the card.
- Actual: The badge sits at the card's left padding.
- Screenshot: screenshots/ac20-activity-placeholder.png

### BUG-10: Duty Hub: "Reported!" makes the broadcast card jump in height
- Severity: cosmetic
- Steps: Duty tab, tap "Report Delay / Issue".
- Expected: Stable layout.
- Actual: The button label drops from two lines to one, the card shrinks by about 20 pt, and the content below jumps. It jumps back after the label reverts.
- Screenshot: screenshots/ac37-resumed-and-reported.png vs screenshots/ac37-reported-reverted.png


## Notes and observations (not filed as bugs)

- **Not reproduced:** once on the Duty tab, a vertical scroll swipe (x=150, y 750 to 250) landed on the Earnings tab (screenshots/obs-unexpected-earnings-after-swipe.png). Repeating the same swipe scrolled normally. Radar first opened mid-page in that same session; on a fresh entry it opens at the top (ac39-radar-fresh-open-top.png). Probably a stray input from the tool. Worth watching.
- A tap with no duration on the iOS 26 `Switch` did not toggle it; a 0.15 s tap did. This looks like a test-tool quirk, not an app bug.
- Taps made while a scroll was still settling were swallowed or landed on other controls. Steps were repeated after the scroll stopped.
- The Expo Go dev-tools gear floats over the top-right of every screen. It is not part of the app, and it was dragged aside for the drawer screenshot.
- **Environment interruption:** my Metro (port 8093) was stopped by the main session during the run, and the "QA SE" simulator (which I had booted) was shut down from outside. I started Metro once more on port 8094 for the SE check, found the SE already shut down, and stopped that Metro. Both Metro servers I started are stopped. The iPhone 17 simulator was already booted, is left booted and in light mode.
