# Fix report: jeeptrack-screens, fix cycle 1 of 3

Source: `review-report.md` D1–D13 and `ui-test-report.md` BUG-1 to BUG-10. Every defect was reproduced from the QA screenshots and code before the fix. All paths are relative to `para/`.

## Summary

| ID | Status | Regression test |
|---|---|---|
| D1 | FIXED | LiveTrackingScreen.test.tsx "lets the tracked unit row wrap…" |
| D2 | FIXED | DutyHubScreen.test.tsx "never truncates the driver name" |
| D3 | FIXED | EarningsPoolScreen.test.tsx "lets the banner title and telemetry values wrap…" |
| D4 | FIXED | packages/ui/src/GradientCard/GradientCard.test.tsx (new) |
| D5 | FIXED | none (layout only; simulator not scrolled to it, see notes) |
| D6 | FIXED | LiveTrackingScreen.test.tsx "shows both direction pills side by side…" |
| D7 | FIXED | none (layout only) |
| D8 | FIXED | none (layout only; checked on simulator at 402 pt) |
| D9 | FIXED | packages/ui/src/ComingSoon/ComingSoon.test.tsx (new) |
| D10 | BLOCKED (QA process item) | not run here; see D10 |
| D11 | FIXED | CommuteHubScreen.test.tsx and DriverProfileScreen.test.tsx (spy on the service) |
| D12 | FIXED | none (layout only) |
| D13 | FIXED | none |

All 8 new tests were run before the fix and failed for the expected reason: missing testID, `fontSize: 20`, `numberOfLines: 1`, no `flexWrap`, `overflow: 'hidden'` on the outer view, and hardcoded `₱45`/`ES`. They pass after the fix.

## Defects

### D1: "Unit 23" cut to "Unit…" (AC28)
- Status: FIXED
- Root cause: the unit row was a single non-wrapping line. The ETA ("3m (Tracked)") has no shrink, so all of the overflow came out of the name (`flexShrink: 1`), and the name collapsed to "Unit…".
- Change: `src/screens/commuters/LiveTracking/styles.ts:59` adds `flexWrap: 'wrap'` to `panelStyles.unit`. When the name and ETA don't fit on one line, the ETA moves to a second line, so the name is never cut. At 375 pt it can still clip only the "(GMD-1782)" suffix, and "Unit 23" stays visible. Rows that fit (Unit 14 / 4m away) stay on one line.
- Test: asserts each "Unit 23 (GMD-1782)" row has `flexDirection: 'row', flexWrap: 'wrap'`. Jest has no layout engine, so the test pins the layout choice that holds at both 375 pt and 402 pt.
- Verified on the iPhone 17 simulator (402 pt): the row reads "Unit 23 (GMD-1782)" in full, with "3m (Tracked)" on the second line.

### D2: "Mang Ernesto Sant…" (AC35)
- Status: FIXED
- Root cause: the name used `headlineLg` (20 pt) with `numberOfLines={1}` next to the rating badge. The design uses `text-base` (16 pt) bold.
- Change: `src/screens/drivers/DutyHub/DutyHubScreen.tsx:98` now uses `variant="headlineSm" weight="bold" numberOfLines={2}`. The design size fits on one line at 402 pt. At 375 pt the name wraps to a second line instead of truncating.
- Test: asserts `fontSize: 16` and `numberOfLines` is at least 2 (or unset).
- Verified at 402 pt: "Mang Ernesto Santos" shows in full on one line.

### D3: "…& Earni…" and "412 Commuter Unlo…" (AC38)
- Status: FIXED
- Root cause: both `headlineSm` texts had `numberOfLines={1}` and shared the row with a non-shrinking Badge (LIVE / High Trajectory).
- Change: `src/screens/drivers/EarningsPool/EarningsPoolScreen.tsx:55` (banner title) and `:190` (telemetry value) are set to `numberOfLines={2}`, so the text wraps instead of truncating at 375 pt and 402 pt.
- Test: asserts `numberOfLines` is at least 2 (or unset) on both strings.
- Verified at 402 pt: the banner reads "Corridor Pool Active & / Earning" on two lines.

### D4: square gradient fill under a rounded shadow
- Status: FIXED
- Root cause: `borderRadius`, `overflow: 'hidden'` and `boxShadow` were all on the `LinearGradient`. On iOS, `overflow: 'hidden'` on the same view as a shadow does not clip the gradient layer.
- Change: `packages/ui/src/GradientCard/GradientCard.tsx:27-40` now nests three views: an outer `View` (testID, `styles.outer` = radius + `boxShadow`), then an inner `View` (`styles.clip` = radius + `overflow: 'hidden'`), then the `LinearGradient` (`styles.base` = radius + padding, plus the caller `style`). Styles are at `packages/ui/src/GradientCard/styles.ts:6-8`. Caller styles still go on the content box. None of the 5 callers pass margin or flex, so moving them is safe.
- Test: new `GradientCard.test.tsx` asserts that the outer view has the radius and shadow and no overflow, the clip view has the radius and `overflow: 'hidden'`, the gradient has no shadow, and the caller padding is applied.
- Verified at 402 pt: the Earnings banner has rounded corners. The 5 dependent cards are Wallet credits, Duty broadcast, Duty daily earnings, the Earnings banner and Radar views. All their screen tests pass.

### D5: next stop runs under "+14 pax waiting"
- Status: FIXED
- Root cause: the next-stop `AppText` sits inside a row (`nextStop`) and had no `flexShrink`, so it kept its full width and overflowed under the badge.
- Change: `src/screens/drivers/DutyHub/DirectionCard.tsx:107` adds `style={styles.nextStopText}`. The style is at `src/screens/drivers/DutyHub/styles.ts:74`: `{ flexShrink: 1 }`. The text now wraps inside its container.
- Test: none. This is pure layout and Jest cannot measure it. The default "Apas" state was checked at 402 pt and wraps correctly. "To Colon" needs a tap, so QA must confirm it.

### D6: direction pill off-screen after Switch
- Status: FIXED
- Root cause: the pills were in a horizontal `ScrollView` with intrinsic widths, so the second pill was off-screen.
- Change: `src/screens/commuters/LiveTracking/EtaSheet.tsx:70` uses a `View` row (`testID="direction-selector"`) instead of a `ScrollView`, and the unused `ScrollView` import is removed. `:88` gives the label `styles.selectorLabel`. In `src/screens/commuters/LiveTracking/styles.ts:141-151`: `selector` is now a row, `selectorPill` has `flex: 1`, and `selectorLabel` has `flexShrink: 1`, so the existing `numberOfLines={1}` truncates as in the design.
- Test: asserts both tabs have `flex: 1` and the selector has no `horizontal` prop. The existing Switch and selection tests still pass.

### D7: VERIFIED badge runs under the GCash switch
- Status: FIXED
- Root cause: the "GCash Transit Wallet" + VERIFIED row (`styles.row`) did not wrap and the label did not shrink, so the row overflowed its `flex: 1` parent into the switch.
- Change: `src/screens/drivers/DriverProfile/DriverProfileScreen.tsx:192-193` adds a new `styles.payoutLabel` (row, `flexWrap: 'wrap'`) and `styles.shrink` on the label. The styles are at `src/screens/drivers/DriverProfile/styles.ts:62-63`. If the badge does not fit, it moves below the label. The shared `styles.row` is unchanged.
- Test: none (layout only).

### D8: map labels overlap
- Status: FIXED
- Root cause: `gorordoLabel` at `left: '41%'` extends past `68%`, where the Escario/Capitol labels start at nearly the same `top`.
- Change: `src/screens/commuters/LiveTracking/styles.ts:79` moves `gorordoLabel` to `left: '4%'`, at the left of the map near Gorordo Ave. in the design. The label is about 116 pt wide, so it ends near 131 pt at 375 pt, well before the Capitol label at 255 pt.
- Test: none. Verified at 402 pt: no overlap.

### D9: "Coming soon" badge left-aligned
- Status: FIXED
- Root cause: the Badge default `alignSelf: 'flex-start'` overrides the card's `alignItems: 'center'`.
- Change: only ComingSoon changed. `packages/ui/src/ComingSoon/styles.ts:26` adds `badge: { alignSelf: 'center' }`, and `packages/ui/src/ComingSoon/ComingSoon.tsx:29` passes `style={styles.badge}` and `testID="coming-soon-badge"`. The Badge default is unchanged.
- Test: new `ComingSoon.test.tsx` asserts `alignSelf: 'center'`. The Activity, Account and Trips tests pass.

### D10: AC42 (375 pt run)
- Status: BLOCKED for this role. This is a QA run on an  (375 pt) and was not done here, as instructed.
- What was done for 375 pt: D1, D2 and D3 no longer depend on the screen width. D1 wraps the row, and D2 and D3 allow 2 lines, so the text cannot truncate at any width where one word fits. The regression tests pin these layout choices, not a measured width. QA still needs to capture the SE screenshots.

### D11: hardcoded "₱45" and "ES"
- Status: FIXED
- Root cause: literal values in the screens instead of service data.
- Change:
  - `src/screens/commuters/CommuteHub/CommuteHubScreen.tsx:246`: the copy now uses `formatPeso(profile.balance, { decimals: 0 })`. The rendered string is identical ("₱45").
  - `src/screens/drivers/DriverProfile/DriverProfileScreen.tsx:53`: `initials={driver.fullInitials}`.
  - `src/types/driver.ts:10` adds `fullInitials: string`, and `src/services/mock/driverData.ts:24` sets `fullInitials: 'ES'`. The existing `initials: 'E'`, used by the Duty Hub avatars, is unchanged.
- Test: `jest.spyOn` on `getCommuterProfile` (balance 120) asserts "imong ₱120 balance". `jest.spyOn` on `getDriverIdentity` (fullInitials 'XY') asserts that "XY" renders.

### D12: broadcast card height jumps on "Reported!"
- Status: FIXED
- Root cause: the row height followed the button labels. "Report Delay / Issue" wraps to 2 lines (64 pt) and "Reported!" fits on 1 line (44 pt).
- Change: `src/screens/drivers/DutyHub/styles.ts:106` sets `broadcastStyles.actions` to `minHeight: 64` (md button: 12 + 2×20 + 12). The buttons stretch to the row, so the height stays the same in both states.
- Test: none (layout only). The existing report/timer tests pass.

### D13: unhandled splash promise rejections
- Status: FIXED
- Change: `src/app/_layout.tsx:9` and `:16` add `.catch(() => {})` to `preventAutoHideAsync()` and `hideAsync()`.
- Test: none. The navigation test still renders the root layout.

## Checks (this cycle, run from `para/`)

| Check | Command | Exit | Result |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit` | 0 | no errors |
| Lint | `npx expo lint` | 0 | no errors or warnings |
| Tests | `npm test -- --watchAll=false` | 0 | 22 suites, 89 tests passed (was 20 / 81) |

Dependents checked: all GradientCard callers (Wallet, BroadcastCard, DutyHub, EarningsPool, CorridorRadar), all ComingSoon callers (Activity, Account, Trips), and `DriverIdentity` consumers (tsc). There is no `.maestro/` folder, so no UI flows were run.

Simulator spot check: iPhone 17 (402 pt), Expo Go, a temporary Metro on port 8095 (stopped afterwards), with deep links to `/duty`, `/earnings` and `/live-map`. D1, D2, D3, D4 (banner) and D8 were confirmed visually. D5 (Colon), D6, D7 and D12 are below the fold or need taps. No tap or scroll tool was available, so QA must confirm them.

## Out-of-scope observation (not changed)

`packages/ui/src/theme/colors.ts:28` has `primaryContainer: '#FF5500'`, but `stitch/DESIGN.md:21` specifies `'#dc2626'`. The file was modified at 21:05, before this fix cycle started, and was not touched here. The QA screenshots show red, while the app now renders orange. This looks like an unplanned change that affects AC11, so the orchestrator should check it.
