# Feature plan: jeeptrack-screens

> **Revision 3: design system v3 (light).** The user replaced the dark v2 system with a light one. The visual reference is the light driver hub `stitch/drivers-duty-hub-light-reference.png`. Its colours match the user's Stitch design system "Electric Transit Engine" (`stitch/DESIGN.md`; full theme in `stitch/design-system.json`). The v2 dark system (`stitch/DESIGN-v2-dark.md`, `stitch/design-system-v2-dark.json`) and the v1 light/red system (`stitch/DESIGN-v1-light-red.md`) are kept for reference only.
>
> **What stays the same:**
> - Screen scope, copy, interactions, routes and testIDs.
> - The v2 fonts and type scale: Space Grotesk for headlines, Hanken Grotesk for body, JetBrains Mono for labels and telemetry. The typography token table below is unchanged from v2.
> - Brand `#FF5500`.
> - Every cycle-1 fix (`fix-report.md` D1–D13) and the AC42 truncation checks at 402 pt and 375 pt.
>
> **What changes:** the app becomes light-only, with v3 colour tokens, gradient stops, ROUND_EIGHT shapes, light elevation and a white-on-orange contrast rule. The changed parts are:
> - the "Design system v3 (light)" section (it replaces "Design system v2")
> - Q4, Q6–Q11, and the new Q12–Q14
> - D3, D5, D9 and D12
> - steps 3, 5, 6 and 9, and steps 17–23 (replaced by the v3 migration list)
> - AC5, AC11, AC12, AC15, AC19 and AC44–AC50, plus a note on AC42 and the new AC52
>
> **Starting state.** The v2 migration was stopped partway:
> - `packages/ui/src/theme/colors.ts` holds the dark v2 palette.
> - The three v2 font packages are installed, and the old font packages are already removed.
> - CommuteHub, LiveTracking and RoleSelect were migrated to v2. The other screens still use v1 key names.
> - `npx tsc --noEmit` currently fails with about 93 errors.
>
> v3 keeps v2 token *names* wherever the role still fits, so most of the remaining work is mechanical. Where a name no longer fits, it is renamed so that `tsc` flags each call site. Keys that keep their name but change role are listed under "Silent role changes", together with a grep check (AC52).

## Request

Replace the Expo Router SDK 58 starter template in `para/` with the JeepTrack Live app UI, built from the Stitch designs in `docs/features/jeeptrack-screens/stitch/`. Scope:
- a shared role-select entry
- 3 commuter screens and 4 driver screens (static mock data, no real auth, no backend)
- "Coming soon" placeholders for nav tabs that have no design
- a design-token theme
- shared UI primitives in `packages/ui`
- the missing quality tooling (ESLint, Jest)

Everything must keep running in Expo Go on the iOS simulator.

Design sources (newest Stitch version of each; HTML + PNG per screen, plus `DESIGN.md`):

| Design file | Screen |
|---|---|
| `commuters-commute-hub` | Passenger Commute Hub |
| `commuters-live-tracking` | Live GPS Vehicle Tracking |
| `commuters-wallet` | ₱ Wallet & Cash-In |
| `drivers-duty-hub` | Driver Tracking & Earnings Hub (Duty & GPS) |
| `drivers-earnings-pool` | Earnings and Pool |
| `drivers-corridor-radar` | Corridor Radar |
| `drivers-profile` | Driver Profile |

What each source is used for:
- The screen PNG and HTML files are the reference for **layout, content and copy only**.
- Colours, corner radii and elevation come from `stitch/DESIGN.md` (v3) and the "Design system v3 (light)" section below.
- Semantic colour use (which element is green, orange, teal, orange-tinted or light blue) follows `stitch/drivers-duty-hub-light-reference.png`.
- Fonts come from the v2 type scale (`stitch/DESIGN-v2-dark.md` typography block), not from DESIGN.md v3.
- Where a screen PNG shows the v1 red, emerald or another radius, the v3 mapping wins.

Out of scope:
- the admin screens
- real login and auth, payments, GPS and location permissions, network APIs
- a dark theme (the app is light-only)
- web polish (web should still bundle but isn't a QA target)

## Open questions

These have defaults so work can start. The orchestrator or user can override any of them before step 17.

- **Q1: Where the tokens are defined.** The orchestrator asked for the tokens in `src/constants/theme.ts`. But `CLAUDE.md` forbids importing from `src/` inside `packages/`, and `packages/ui` components need the tokens.
  - **Default:** define the tokens once in `packages/ui/src/theme/`.
  - `src/constants/theme.ts` re-exports them (`export * from '@packages/ui/theme'`) and adds app-only constants (the font asset map, layout constants).
  - App code imports from `@/constants/theme`. Packages import from `@packages/ui/theme`.
  - Hex literals appear in exactly one folder.
- **Q2: The hub and live tracking show different cities.** The Commute Hub lists Metro Manila routes (Cubao — Divisoria and others). The Live Tracking design is Cebu Route 17B.
  - **Default:** every "View Live (₱1)" opens the Live Map tab, which always shows the Route 17B mock. No route param is passed.
  - The confirm drawer shows the chosen route's name.
- **Q3: The driver header differs between designs.**
  - The Duty Hub header is "JeepTrack Live / DRIVER HUB + ON DUTY DRV-0042 + avatar".
  - Earnings, Radar and Profile use "DRV-0042 • Mang Ernesto + ON DUTY + ₱1,420.50 + bell + person".
  - **Default:** build each as designed. Both go in one `DriverTopBar` UI component with two variants.
- **Q4: Appearance (revised in v3).** The user chose a light-only design. **Decision (not open):** the app is light-only.
  - `app.json` sets `userInterfaceStyle` to `"light"` and a light root `backgroundColor` (`#F8F9FF`). The splash `backgroundColor` is also `#F8F9FF`.
  - The status bar uses `style="dark"`.
  - The navigation theme is a customised `DefaultTheme` (`dark: false`).
  - `colors.ts` exports one palette. No dark palette and no `colorSchemes` export ship.
- **Q5: Draggable sheets.** The live-tracking bottom drawer is drawn as a sheet.
  - **Default:** render it as a static card with sheet styling (top radius, handle) inside the scroll view.
  - It is not draggable, and no bottom-sheet library is added.
- **Q6 (v3): DESIGN.md v3 conflicts with the user's instructions and with itself.** Resolutions:
  - **Fonts:** DESIGN.md lists Plus Jakarta Sans / Inter. The user overrides this and keeps the v2 font roles and scale. `typography.ts` does not change. `theme.test.ts` reads the type scale from `stitch/DESIGN-v2-dark.md`.
  - **Brand:** DESIGN.md `primary-container` and `overridePrimaryColor` are `#ff5e00`. The user overrides this with `brand #FF5500`. `primaryContainer` stays in `designColors` for fidelity and is lint-banned outside the theme. DESIGN glows written with `rgba(255, 94, 0, …)` are rebased to `rgba(255, 85, 0, …)`.
  - **Secondary:** the front matter `secondary` is `#565e74`, but the prose and `overrideSecondaryColor` say slate `#0f172a`. Front-matter keys keep their exact values. `#0F172A` becomes the extension token `ink` (dark chips, `tonal-dark` buttons, floating-control icons).
  - **Tertiary:** the front matter `tertiary` is `#006c4b`, but the prose and `emerald-active` say `#00b37e`. Both are used: `emeraldActive`/`live` `#00b37e` for fills, dots and pulses; `tertiary`/`liveStrong` `#006c4b` for green text and for green fills under text.
  - **Surfaces:** the prose says surface `#f8fafc`; the front matter and the user say `#f8f9ff`. `canvas` is `#F8F9FF`. `surfaceBg #f8fafc` stays in `designColors` and is used only for the radar map ground.
  - **Neutral:** the prose neutral `#64748b` is `textSubtle`. It is not the muted text colour (see Q9).
- **Q7 (v3): Gradients.** DESIGN.md v3 does not mention gradients, and the reference image uses them (the teal broadcast card, the orange-tint earnings card). **Default:** keep `GradientCard` and all seven presets, re-stopped for v3 (see the gradient table).
- **Q8: Button label font (unchanged from v2).** JetBrains Mono is about 15–20% wider than Inter. Long button copy ("End Shift & Submit Daily Manifest", "Report Delay / Issue") would truncate at 375 pt.
  - **Default:** chips, badges, tab labels, codes, plates, ETAs, prices and other telemetry use JetBrains Mono.
  - `Button` labels use the extension style `labelAction` (Hanken Grotesk 700, 15/20).
  - If the user wants mono buttons, swap `labelAction` to JetBrains Mono 600 14/18 and re-run AC42.
- **Q9 (v3): Placeholder and muted text colour.** DESIGN.md's neutral `#64748b` reaches 4.76:1 on white but only 4.08:1 on `surfaceContainer #e5eeff` (the light-blue info boxes). **Default:** `textMuted` is `#475569`, which reaches at least 5.88:1 on every v3 surface and tint. Placeholders and secondary text use it. `#64748b` is `textSubtle`, used for non-text graphics and disabled glyphs only.
- **Q10 (v3): Native chrome in Expo Go.** The `Alert`, the keyboard and the `Switch` are drawn by iOS. Expo Go's own appearance setting may win over the app's `userInterfaceStyle`. **Default:**
  - Set `keyboardAppearance="light"` on every `TextInput`.
  - Set the `Switch` track and thumb colours explicitly.
  - If the simulator is in Dark appearance and the native `Alert` still renders dark in Expo Go, QA records that as a known Expo Go limitation, not a defect.
  - App-drawn surfaces must be light in both simulator appearances (AC44).
- **Q11: Avatar shape (unchanged).** Avatars stay circular, with a 1px `borderStrong` ring. This now also matches DESIGN.md v3, which uses full-pill geometry for badges and chips.
- **Q12 (v3): White text on orange.** The reference image puts white text on orange buttons and badges. White on `#FF5500` is 3.21:1. That passes only the 3:1 large-text and non-text thresholds, not 4.5:1 for normal text.
  - The user suggested `neon-orange-deep #ea5200` as a darker fill. It does **not** fix this: white on `#ea5200` is 3.68:1, which still fails for small text.
  - `primary #a63b00` does fix it: white on `#a63b00` is 6.47:1.
  - **Default:** the white-on-orange rule under "Contrast". Superseded by the user decision in W2: orange fills with text are bright `#FF5500` with bold white text.
  - **Alternative:** if the user prefers the bright fill on buttons, set `brandAction: '#FF5500'`, `onBrandAction: '#0B1C30'` (5.36:1, dark text) and `brandPressed: '#EA5200'` in `colors.ts`. No other file changes. Re-run `contrast.test.ts`.
- **Q13 (v3): Radius per element.** DESIGN.md v3 says 8 px for base components, 16 px for major panels and sheets, and full pills for badges, chips and action buttons. The reference image shows rounded-rectangle buttons ("To Apas (IT Park)", "Stop Tracking", "Payout Log", "Call Hotline"), not pills. Its section cards look rounder than the 8 px inner boxes, at about 12 px. **Default:**
  - Buttons and inner boxes use `base` 8.
  - Cards and gradient cards use `md` 12.
  - The modal and sheet tops use `lg` 16.
  - Badges, chips, `BalancePill`, the search field and progress bars use `full`.
  - The image wins over the prose for buttons.
- **Q14 (v3): Map graphics and progress fills on light surfaces.** On a light map, bright accents cannot reach 3:1. Measured against map land `#F1F5F9`: `brand` 2.93, `live` 2.47, `amber` 1.96.
  - **Default:** route segments, vehicle pins, the "YOU" pin, live dots and progress fills are supplementary graphics. Every state they show is also given in text: callouts, "18 / 30 Days", "165% UNLOCKED", "Steady Flow", the LIVE badge. So they use the bright accents and are exempt from 3:1. Glyphs *inside* pins (white on `brand`, 3.21) must still reach 3:1.
  - The user dot is the one graphic with no text equivalent. It uses `liveStrong` (5.9:1 on map land) with a white ring.
  - Every `ProgressBar` call site must render its value as adjacent text and set `accessibilityValue`.

## Decisions (made by the planner, inside the brief)

- **D1: Commuter tabs** (5): `Commute` · `Live Map` · `Activity` · `Wallet` · `Account`.
  - Icons (MaterialIcons): `commute`, `location-on`, `history`, `payments`, `account-circle`.
  - Live Tracking is the `Live Map` tab. Its in-screen "← Commute Hub" back link switches to the Commute tab.
- **D2: Driver tabs** (5), one set used on every driver screen: `Duty` · `Earnings` · `Radar` · `Trips` · `Profile`.
  - Icons (MaterialIcons): `sensors`, `payments`, `radar`, `alt-route`, `badge`.
  - The hub design's "Duty & GPS / Earnings & Pool / Corridor Radar / Driver Profile" and the other designs' "Radar / Earnings / Trips / Profile" are merged into short single-word labels. Duty comes first because it is the hub.
- **D3: Tab bar (revised in v3).** Use JS `Tabs` from `expo-router/js-tabs`, not `NativeTabs`. (The `expo-router` export is deprecated in favour of it; see the cycle-1 review.)
  - Bar background: `surfaceCard` `#FFFFFF`, with a 1px top border `borderSubtle` `#E2E8F0`.
  - Active label: `brandStrong` `#A63B00` (`tabBarActiveTintColor`, 6.47:1). Small orange text never uses `#FF5500` (Q12).
  - Active icon and indicator dot: `brand` `#FF5500`, drawn by `TabBarIcon` (non-text, 3.21:1).
  - Inactive tint: `textMuted` `#475569`.
  - Labels: JetBrains Mono 500, 11/14, letter-spacing 0.88 (`labelBadge`).
  - Scene background: `canvas` `#F8F9FF`.
  - `NativeTabs` needs SF Symbols or image assets and cannot draw the dot.
- **D4: Maps.** Do not add `react-native-maps`.
  - `node_modules/expo/bundledNativeModules.json` lists `react-native-maps@1.29.11` for SDK 58, so it is SDK-compatible and normally bundled in Expo Go.
  - Even so, the designs' map areas are mostly annotation overlays: route segments, callouts, pax counts, unit chips. A stylised `MapCanvas` made of `View`s reproduces them deterministically.
  - It needs no location permission and no Android Maps API key, and it gives stable QA screenshots.
  - A real map can replace `MapCanvas` in a later feature.
- **D5: Gradients (revised in v3).** Use `expo-linear-gradient` for the gradient cards:
  - wallet credits card
  - earnings banner
  - duty broadcasting card
  - duty daily earnings card
  - radar views card

  It is in `bundledNativeModules.json` (`~58.0.3`), so it is available in Expo Go. The v3 stops are in the gradient table under "Design system v3 (light)" (Q7).
- **D6: Avatars.** The designs use expiring `lh3.googleusercontent.com` URLs. Instead, use an `Avatar` component that draws initials on a token-coloured circle. There are no network images.
- **D7: Route paths.** Group folders don't add URL segments, so each file name is unique:

| Route file | URL | Screen import |
|---|---|---|
| `src/app/(auth)/index.tsx` | `/` | `@/screens/shared/RoleSelect` |
| `src/app/(commuters)/commute.tsx` | `/commute` | `@/screens/commuters/CommuteHub` |
| `src/app/(commuters)/live-map.tsx` | `/live-map` | `@/screens/commuters/LiveTracking` |
| `src/app/(commuters)/activity.tsx` | `/activity` | `@/screens/commuters/Activity` (placeholder) |
| `src/app/(commuters)/wallet.tsx` | `/wallet` | `@/screens/commuters/Wallet` |
| `src/app/(commuters)/account.tsx` | `/account` | `@/screens/commuters/Account` (placeholder) |
| `src/app/(drivers)/duty.tsx` | `/duty` | `@/screens/drivers/DutyHub` |
| `src/app/(drivers)/earnings.tsx` | `/earnings` | `@/screens/drivers/EarningsPool` |
| `src/app/(drivers)/radar.tsx` | `/radar` | `@/screens/drivers/CorridorRadar` |
| `src/app/(drivers)/trips.tsx` | `/trips` | `@/screens/drivers/Trips` (placeholder) |
| `src/app/(drivers)/profile.tsx` | `/profile` | `@/screens/drivers/DriverProfile` |

  Layouts:
  - `src/app/_layout.tsx`: root `Stack` (`headerShown: false`). It loads the fonts and holds the splash screen.
  - `(auth)/_layout.tsx`: `Stack`.
  - `(commuters)/_layout.tsx` and `(drivers)/_layout.tsx`: `Tabs`. The tab order is set by `Tabs.Screen` order.
  - Role select uses `router.replace('/commute')` or `router.replace('/duty')`, so back does not return to role select from inside a role.
  - The "exit role" actions use `router.replace('/')`.
- **D8: Placeholders.** One presentational `ComingSoon` component in `packages/ui`, plus a thin screen folder per role (`commuters/Activity`, `commuters/Account`, `drivers/Trips`).
  - This keeps role isolation and keeps route files as pure imports.
  - Commuter Account also shows a "Switch role" button, so commuters have a way back to role select.
- **D9: Role select (no design; revised in v3).** Styled from DESIGN.md v3:
  - **Background:** `canvas`.
  - **Brand row:** a `brand` (`#FF5500`) square with radius `base` (8) and the `directions-bus` icon in `onBrand` `#FFFFFF` (an icon, so 3.21:1 non-text is enough). Then "JeepTrack Live" (Space Grotesk, `onSurface`) with a `live` dot.
  - **Tagline:** "TRACK • VIEW • EARN" (JetBrains Mono, `labelBadge`, `textMuted`).
  - **Two large tier-1 cards** (white `surfaceCard`, 1px `borderSubtle`, `level1` shadow, radius `md` 12). Each has a `brandTint` icon tile with a `brand` icon:
    - "I'm a commuter": `commute` icon, subcopy "Track jeepneys live for ₱1 per view".
    - "I'm a driver": `sensors` icon, subcopy "Broadcast GPS and earn from the route pool".
  - **Footer microcopy:** "Demo build • no sign-in required" (`textMuted`).
- **D10: `src/navigations/`** is not created. Expo Router layouts are the navigators.
- **D11: Mock data** lives in typed modules under `src/services/mock/`.
  - Screens read it through small synchronous getters (`getCommuterHome()` and similar) in `src/services/commuterService.ts` and `src/services/driverService.ts`. A real API can replace them later without touching screens.
  - Data is static, so there are no loading or error states.
  - The screens that filter or clear lists get empty states.
- **D12 (v3): Token names stay semantic. Names are renamed only where the hue changed.**
  - **Unchanged names (re-valued only):** `brand`, `brandPressed`, `onBrand`, `amber`, `onAmber`, `canvas`, `textMuted`, `textSubtle`, `borderSubtle`, `borderStrong`, `brandTint`, `amberTint`, `errorTint`, `scrim`, `pulseBrand`, `glassFill`, `glassBorder` and the `map*` tokens.
  - **Renamed** (no longer cyan, so `tsc` lists every call site):
    - `cyan` → `live`
    - `cyanTint` → `liveTint`
    - `onCyan` → `onDark`
    - `pulseCyan` → `pulseLive`
    - `elevation.glowCyan` → `glowLive`
    - `elevation.focusCyan` → `focusRing`
  - **New:** `brandStrong`, `brandAction`, `onBrandAction`, `liveStrong`, `amberStrong`, `ink`, `onDark`, `onDarkMuted`, plus the 10 DESIGN.md custom keys (`surfaceCard`, `neonOrangeDeep`, …).
  - The 47 Material keys keep their names and take the DESIGN.md v3 values. Several of them change role; see "Silent role changes".
  - v1 key names that are still referenced by the unmigrated screens stay deleted, so `tsc` keeps listing them.

## Design system v3 (light)

Source of truth, in order of precedence:
1. The user's overrides: `#FF5500` brand, the v2 fonts and type scale, light-only.
2. `stitch/drivers-duty-hub-light-reference.png` for semantic colour use and shapes.
3. `stitch/DESIGN.md` front matter, then its prose.

All hex and rgba values live in `packages/ui/src/theme/` only.

### Colour tokens

The developer replaces `colors.ts` as a whole. It exports one palette, `colors = { ...designColors, ...brandColors, ...extensionColors }`, plus `gradients`.

**1. `designColors`**: all **57** DESIGN.md v3 front-matter colour keys, camelCased, with the exact DESIGN.md values (56 hex values plus `neonOrangeGlow`, which is rgba).
- The 47 Material keys, for example:
  - surfaces: `surface #f8f9ff`, `surfaceContainerLowest #ffffff`, `surfaceContainerLow #eff4ff`, `surfaceContainer #e5eeff`, `surfaceContainerHigh #dce9ff`, `surfaceContainerHighest #d3e4fe`
  - text: `onSurface #0b1c30`, `onSurfaceVariant #5b4137`
  - primary: `primary #a63b00`, `onPrimary #ffffff`, `primaryContainer #ff5e00`, `onPrimaryFixedVariant #7f2b00`
  - secondary and tertiary: `secondary #565e74`, `tertiary #006c4b`, `tertiaryContainer #00a876`, `tertiaryFixed #71fbc0`
  - error: `error #ba1a1a`, `errorContainer #ffdad6`, `onErrorContainer #93000a`
  - `background #f8f9ff`
- The 10 custom keys: `neonOrangeBright #ff6b00`, `neonOrangeDeep #ea5200`, `neonOrangeSubtle #fff1e8`, `neonOrangeGlow rgba(255, 94, 0, 0.28)`, `amberFare #f59e0b`, `emeraldActive #00b37e`, `crimsonAlert #e11d48`, `surfaceBg #f8fafc`, `surfaceCard #ffffff`, `surfaceBorder #e2e8f0`.
- `primaryContainer #ff5e00`, `neonOrangeBright` and `neonOrangeGlow` are kept for fidelity only and are **not** used for brand. The lint rule from v2 still forbids reading `colors.primaryContainer` outside the theme.

**2. `brandColors`**: the user's brand and the semantic accent layer.

| Token | v2 value | **v3 value** | Source | Use |
|---|---|---|---|---|
| `brand` | `#FF5500` | **`#FF5500`** | user | Non-text and icon fills: brand mark tile, icon tiles, active tab icon and dot, tracked route line, vehicle and "YOU" pins, selected borders, brand progress fills, `route` badge border, Switch track (on). Large white text is allowed on it (rule W1). **Never a text colour.** |
| `onBrand` | `#0A0E17` | **`#FFFFFF`** | DESIGN `on-primary` | White icons and large text on `brand` only (3.21:1 ≥ 3:1) |
| `brandAction` *(new)* | n/a | **`#FF5500`** (user, W2) | user override | Fills under small white text: `Button` `primary`, `brandSolid` badge, selected `SegmentedControl` option, selected filter chip (rule W2) |
| `onBrandAction` *(new)* | n/a | **`#FFFFFF`** | DESIGN `on-primary` | Text and icons on `brandAction` (6.47:1) |
| `brandPressed` | `#FF7733` | **`#EA5200`** (user, W2) | DESIGN `neon-orange-deep` | Pressed `brandAction` (white 3.68:1, user-accepted) |
| `brandStrong` *(new)* | n/a | **`#A63B00`** | DESIGN `primary` | Small orange text on any light surface: active tab label, "Headway: 4 min", route-badge text, outline-button label, "ACTIVE ASSIGNMENT" (≥ 5.0:1) |
| `live` (was `cyan`) | `#00E5FF` | **`#00B37E`** | DESIGN `emerald-active` | Live dots, pulses, live progress fills, live route segments. Non-text only. |
| `liveStrong` *(new)* | n/a | **`#006C4B`** | DESIGN `tertiary` | Green text ("Active Duty", "Verified", "Credited Daily", "LIVE GPS ACTIVE", "+₱50.00", "+13.7%", "SAFE", "ON SCHEDULE"), the `liveSolid` badge fill, and the user dot |
| `onDark` (was `onCyan`) | `#0A0E17` | **`#FFFFFF`** | n/a | Text on dark or saturated fills: teal and slate gradients, `ink`, `liveStrong`, `crimsonAlert`, glass buttons |
| `onDarkMuted` *(new)* | n/a | **`#CCFBF1`** | n/a | Secondary text on the teal and slate gradients |
| `amber` | `#FFB300` | **`#F59E0B`** | DESIGN `amber-fare` | Fare fills (`fare` button, `fareSolid` badge, views card), fare progress fills, congestion segment. Never a text colour. |
| `onAmber` | `#0A0E17` | **`#0B1C30`** | DESIGN `on-surface` | Text on `amber` (7.99:1) |
| `amberStrong` *(new)* | n/a | **`#B45309`** | DESIGN prose (heavy-traffic badge text) | Fare, wallet and earnings text: `BalancePill` amount, "₱1 / view", pool amounts, "Approaching" |
| `ink` *(new)* | n/a | **`#0F172A`** | DESIGN `overrideSecondaryColor` | `tonal-dark` button fill, recenter-FAB icon, bus mode chip |
| `canvas` | `#0A0E17` | **`#F8F9FF`** | DESIGN `background` | Screen and scene background, splash, root view |

**3. `extensionColors`**:

| Token | v2 value | **v3 value** | Use |
|---|---|---|---|
| `transparent` | `transparent` | `transparent` | n/a |
| `textMuted` | `#94A3B8` | **`#475569`** | Secondary text, inactive tab tint, placeholders (Q9), ghost button text, map labels |
| `textSubtle` | `#475569` | **`#64748B`** | Completed timeline nodes, disabled glyphs, dividers. Non-text only (DESIGN neutral). |
| `borderSubtle` | `#1E293B` | **`#E2E8F0`** | Card, top bar and tab bar borders (DESIGN `surface-border`) |
| `borderStrong` | `#334155` | **`#CBD5E1`** | Inputs, unselected chips and selectable cards, dashed offline card, avatar ring, sheet handle |
| `brandTint` | `rgba(255, 85, 0, 0.14)` | **`#FFF1E8`** | Brand badge, route badge, selected-card fill, ETA banner, icon tiles (DESIGN `neon-orange-subtle`) |
| `liveTint` (was `cyanTint`) | `rgba(0, 229, 255, 0.12)` | **`#ECFDF5`** | Live badge fill, user accuracy ring (DESIGN emerald tint) |
| `amberTint` | `rgba(255, 179, 0, 0.12)` | **`#FFFBEB`** | Fare badge, balance card (DESIGN amber tint) |
| `errorTint` | `rgba(255, 180, 171, 0.12)` | **`#FFF1F2`** | `danger-soft` fill, error badge |
| `scrim` | `rgba(10, 14, 23, 0.72)` | **`rgba(15, 23, 42, 0.50)`** | Modal backdrop |
| `pulseBrand` | `rgba(255, 85, 0, 0.25)` | `rgba(255, 85, 0, 0.25)` | Brand pulse rings |
| `pulseLive` (was `pulseCyan`) | `rgba(0, 229, 255, 0.25)` | **`rgba(0, 179, 126, 0.25)`** | Live pulse rings |
| `glassFill` | `rgba(223, 226, 239, 0.08)` | **`rgba(255, 255, 255, 0.08)`** | Buttons and badges inside the teal and slate gradient cards |
| `glassBorder` | `rgba(223, 226, 239, 0.16)` | **`rgba(255, 255, 255, 0.32)`** | Same |
| `mapLand` | `#0A0E17` | **`#F1F5F9`** | Map ground (DESIGN Level 0) |
| `mapWater` | `#001f24` | **`#D3E4FE`** | River band |
| `mapRoad` / `mapRoadMinor` | `#262a34` / `#1c1f29` | **`#FFFFFF` / `#E2E8F0`** | Road lines |
| `mapLabel` | `#94A3B8` | **`#475569`** | Map text |

`theme.test.ts` asserts that these keys no longer exist: `cyan`, `cyanTint`, `onCyan`, `pulseCyan`, any key matching `/^(emerald|teal|slate|red\d|amber\d|amberText|white|whiteA|blackA|status.*Bg|routeRed|routeGreen|userDot|radarLand)/` (except the DESIGN key `emeraldActive`), and the v2 dark values `#0a0e17`, `#0f131c`, `#181b25`, `#1c1f29`, `#262a34`, `#31353f` and `#dfe2ef`.

### v2 → v3 role mapping (for the developer)

| v2 role / call | v2 tokens | v3 tokens | Mechanical? |
|---|---|---|---|
| Screen background | `canvas` | `canvas` (`#F8F9FF`) | yes, re-valued |
| Top bar and tab bar background | `surface` + `borderSubtle` | **`surfaceCard`** + `borderSubtle` | **no**: `surface` now equals `canvas` |
| Tier-1 card | `surfaceContainerLow` + `borderSubtle` (`tiers.tier1`) | **`surfaceCard`** + `borderSubtle` + `level1` shadow (`tiers.tier1`) | through `tiers.tier1`/`Card`, yes. **Direct `colors.surfaceContainerLow` card fills: no** (that key is now the light-blue info box). |
| Tinted inner box | `surfaceContainer` | `tiers.infoBox` (`surfaceContainerLow #EFF4FF` + 1px `surfaceContainerHigh #DCE9FF`), or `surfaceContainer #E5EEFF` for a stronger blue | yes |
| Tier-2 sheet, modal, callout | `surfaceContainerHigh` + `borderStrong` (`tiers.tier2`) | **`surfaceCard`** + `borderSubtle` + `level3` shadow (modal, sheet) or `level2` shadow (callouts, FAB) | through `tiers.tier2`, yes. Direct fills: no. |
| Pressed or selected neutral fill, progress track | `surfaceContainerHighest` | `surfaceContainerHighest` (`#D3E4FE`) | yes |
| Primary text | `onSurface` | `onSurface` (`#0B1C30`) | yes |
| Secondary text | `textMuted` | `textMuted` (`#475569`) | yes |
| Brand fill under **small** text (primary button, `brandSolid` badge, ETA banner) | `brand` + `onBrand` | **`brandAction` + `onBrandAction`** (the ETA banner becomes a `brandTint` card, see below) | **no**: re-point each site |
| Brand non-text fill (mark, pins, route line, tab dot, selected border) | `brand` | `brand` | yes |
| Brand text | `brand`, or `primary` on high tiers | **`brandStrong`** (small) / **`neonOrangeDeep`** (large, rule W3) | **no**: lint flags `brand` as text (step 17) |
| Live and telemetry fills (dots, pulses, segments) | `cyan` | `live` | rename (`tsc`) |
| Live text, positive amounts | `cyan` as text | **`liveStrong`** | rename (`tsc`) + lint |
| Toggled chips and segments | `cyan` + `onCyan` | **`brandAction` + `onBrandAction`** (orange, as in the reference "To Apas") | rename (`tsc`) |
| Live solid badge | `cyan` + `onCyan` | `liveStrong` + `onDark` | rename (`tsc`) |
| Fare fills | `amber` + `onAmber` | `amber` + `onAmber` | yes, re-valued |
| Fare text | `amber` as text | **`amberStrong`** | **no**: lint flags `amber` as text |
| Info badge | `cyanTint` + `secondary` | `surfaceContainer` + `secondary` (`#565E74`) | rename (`tsc`) |
| SOS (`danger`) | `errorContainer` + `onErrorContainer` | **`crimsonAlert` + `onDark`** (solid crimson, 4.70:1) | **no** |
| Danger-soft, error badge | `errorTint` + `error` | `errorTint` + `error` (`#BA1A1A`) | yes |
| Buttons in dark gradients | `glass` (`glassFill`/`glassBorder` + `onSurface`) | `glass` with **`onDark`** text | partial |
| Buttons in bright gradients | `tonal-dark` (`canvas` + `onSurface`) | `tonal-dark` = **`ink` + `onDark`** | **no** |
| `secondary` button | `surfaceContainerLow` + 1.5px `cyan` border + `cyan` label | **`surfaceCard` + 1.5px `brand` border + `brandStrong` label** (reference "Switch") | **no** |
| Focus ring | `focusCyan`, `cyan` border | `focusRing` + `brand` border | rename (`tsc`) |
| User dot | `cyan` + `cyanTint` ring + `glowCyan` | **`liveStrong`** + 3px `surfaceCard` ring + `liveTint` accuracy ring | rename (`tsc`) |
| Recenter FAB | `cyan` | `surfaceCard` circle, `ink` icon, `borderSubtle`, `level2` (DESIGN floating controls) | **no** |
| Map ground, water, roads, labels | `map*` | `map*` (light values) | yes |
| Scrim | `scrim` | `scrim` | yes |
| Text on gradients | `onSurface` / `secondaryFixed` / `textMuted` | see the gradient table | **no** |

### Silent role changes (same name, new meaning; `tsc` cannot catch these)

| Key | v2 role | v3 value and role | Rule |
|---|---|---|---|
| `surface` | top bar and tab bar fill | `#f8f9ff`, the same as `canvas` | Bars use `surfaceCard`. |
| `surfaceContainerLow` | tier-1 card fill | `#eff4ff`, the light-blue info box | Cards use `tiers.tier1` / `surfaceCard`. |
| `surfaceContainerHigh` | tier-2 sheet fill | `#dce9ff`, a light-blue tonal fill | Sheets use `tiers.tier2`. It stays valid for the `tonal` button and the disabled state. |
| `tertiary`, `tertiaryContainer` | amber text, views-card stop | green `#006c4b` / `#00a876` | Never used for amber. Read green through `liveStrong`. |
| `onSecondaryFixed`, `onSecondaryFixedVariant`, `secondaryFixed` | deep-cyan gradient stops and text | slate and lavender | Not used outside the theme. |
| `errorContainer` / `onErrorContainer` | dark SOS fill / light text | light pink / dark red | Not used for SOS. Only `danger` changes. |
| `onBrand` | dark text on brand | white | Only icons and large text on `brand`. |
| `amber` | fill **and** text | fill only | Text uses `amberStrong`. |
| `brand` | fill **and** text | non-text only | Text uses `brandStrong` / `neonOrangeDeep`. |
| `primary` | brand text on high tiers (`#ffb59c`) | `#a63b00` (same role) | Prefer the `brandStrong` alias in new code. The `Badge` `onHigh` branch becomes a no-op and is removed. |

Screen-level application. Copy and layout are unchanged; the reference image governs:
- **`live` / `liveStrong` badges (green):**
  - "Active Duty", "Verified" / "Verified Driver", "Credited Daily", "LIVE GPS ACTIVE", "LIVE", "LIVE RADAR", "Verified Drivers Only", "Active", "VERIFIED RTK", "SAFE", "ON SCHEDULE", "Steady Flow"
  - the positive amounts `+₱50.00`, `+13.7%` and "+2 Bonus views"
  - the guarantees "₱0 / GUARANTEED REFUND / Zero-Risk"
- **Teal `broadcast` gradient:** "BROADCASTING LIVE" (Duty) and the "ROUTE 17B DRIVER POOL" banner (Earnings).
- **Orange tint (`dailyEarnings` and `credits` gradients):** Duty "TODAY'S INSTANT DAILY EARNINGS" and Wallet "COMMUTER TRANSIT CREDITS".
- **Light-blue info boxes (`tiers.infoBox`):**
  - the CommuteHub balance-card inner box and the confirm-drawer rows
  - the Duty qualified box, waypoint box, formula box and condition box
  - the EarningsPool "POOL REVENUE FORMULA" box
  - the Profile checklist row
- **Orange:** the active tab, CTAs (`brandAction`), the selected direction segment, and the brand mark.
- **ETA banner** ("UNLOCKED ARRIVAL ETA … 3 MINS … ON SCHEDULE"): a `brandTint` card with a 1.5px `brand` border.
  - Small text is `brandStrong` / `onSurface`.
  - "3 MINS" is `labelEta` (20/700, large) in `neonOrangeDeep` (3.33:1).
  - "ON SCHEDULE" is a `live` badge.
- **Route identifier badges** ("ROUTE 17B", `#04-C` codes, the "17B" shield, "E-JEEP"): `brandTint` fill, 1px `brand` border, `brandStrong` JetBrains Mono 700 text, full pill.
- **`amber`:**
  - balance card and `BalancePill` (`amberTint` fill, `amberStrong` text)
  - Track Pass "₱1 / view", "POPULAR"/"BEST VALUE", "Zero Fee Promo"
  - pool and earnings amounts that are not orange in the reference
  - the "Approaching" tile, "Report Hazard / Baha" and the pass row
  - the Radar views card (`viewsAmber`)
- **Large orange metrics** ("₱20.00", "₱48.50", "₱68.5", "₱682.50"): `metricDisplay` in `neonOrangeDeep` (rule W3).
- **Error roles:**
  - "SOS Dispatch": `danger` (`crimsonAlert` + `onDark`)
  - "Signal Stale": `danger-soft`
  - The offline route card: dashed `borderStrong` border, `textMuted` text and the offline badge.
- **Duty waypoint timeline:**
  - completed nodes are `textSubtle`
  - upcoming nodes are `live`
  - the current stop is a pulsing `brand` node with its label in `brandStrong`
  - the 2px line is `borderStrong`
- **Map route segments:** [live, amber, live, brand, live] over `mapLand` (Q14).

### Gradient presets (v3)

| Preset | Card | v2 stops | **v3 stops** | Text on it (lowest ratio across both stops) |
|---|---|---|---|---|
| `credits` | Wallet "COMMUTER TRANSIT CREDITS" | `#FF7733` → `#FF5500` | **`#FFF1E8` (`neonOrangeSubtle`) → `#FFDBCE` (`primaryFixed`)** | `onSurface` 13.3, `textMuted` 5.87, `brandStrong` 5.01 (the "₱45.00" amount) |
| `broadcast` | Duty "BROADCASTING LIVE" | `#004f58` → `#001f24` | **`#0E7490` → `#115E59`** (teal) | `onDark` 5.36, `onDarkMuted` 4.75. Live dot `tertiaryFixed #71FBC0` (non-text 4.15). Glass button text `onDark` over `glassFill` ≥ 4.5. |
| `broadcastPaused` | Duty "TRACKING PAUSED" | `#31353f` → `#181b25` | **`#475569` → `#334155`** (slate) | `onDark` 7.58, `onDarkMuted` 6.72 |
| `poolBanner` | Earnings "ROUTE 17B DRIVER POOL" | `#004f58` → `#001f24` | **`#0E7490` → `#115E59`** | same as `broadcast` |
| `viewsAmber` | Radar "412 Commuter Views" | `#FFB300` → `#c08600` | **`#F59E0B` (`amber`) → `#FBBF24`** | `onAmber` 7.99. The "View Pot" button is `tonal-dark` (`ink` + `onDark`, 17.9). |
| `dailyEarnings` | Duty "TODAY'S INSTANT DAILY EARNINGS" | `#262a34` → `#181b25` | **`#FFFFFF` → `#FFF1E8`** (orange tint) | `onSurface` 15.5, `textMuted` 6.86, `brandStrong` 5.85, large `neonOrangeDeep` 3.33 ("₱68.5"). The "Payout Log" button is `primary` (`brandAction`). |
| `radarMap` | Radar map ground | `#181b25` → `#0A0E17` | **`#F8FAFC` (`surfaceBg`) → `#F1F5F9` (`mapLand`)** | `mapLabel` 6.92 |

New hex values introduced by v3 that are not DESIGN.md keys: `#0E7490`, `#115E59`, `#475569`, `#334155`, `#FBBF24`, `#CCFBF1`, `#ECFDF5`, `#FFFBEB`, `#FFF1F2`, `#CBD5E1`, `#F1F5F9`. The tints, borders and map land come from DESIGN.md prose. The teal and slate stops have no DESIGN source; they come from the reference image's teal card and DESIGN's slate secondary.

`GradientCard` keeps the cycle-1 D4 three-view nesting: an outer view with radius, border **and the `level1` shadow** (light mode brings shadows back), an inner clip view with `overflow: 'hidden'`, then the gradient. The radius is `md` (12).

### Typography (unchanged from v2)

Fonts: Space Grotesk (headlines and display), Hanken Grotesk (body), JetBrains Mono (labels and telemetry). Each weight is its own registered family. No style sets `fontWeight`. DESIGN.md v3's Plus Jakarta Sans / Inter scale is **not** used (Q6).

`typography.ts` defines the 12 v2 DESIGN styles (source: `stitch/DESIGN-v2-dark.md`) under camelCased names, plus 2 documented extensions. Letter-spacing is converted from em to px (`em × fontSize`).

| Token | Family (registered name) | Size / line height | Letter-spacing (px) | WCAG "large"? |
|---|---|---|---|---|
| `displayHero` | `SpaceGrotesk_700Bold` | 56 / 64 | -1.68 | yes |
| `displayHeroMobile` | `SpaceGrotesk_700Bold` | 36 / 44 | -0.72 | yes |
| `headlineLg` | `SpaceGrotesk_700Bold` | 32 / 40 | -0.64 | yes |
| `headlineLgMobile` | `SpaceGrotesk_700Bold` | 26 / 32 | -0.26 | yes |
| `headlineMd` | `SpaceGrotesk_600SemiBold` | 22 / 28 | 0 | no |
| `headlineSm` | `SpaceGrotesk_600SemiBold` | 18 / 24 | 0 | no |
| `bodyLg` | `HankenGrotesk_400Regular` | 18 / 28 | 0 | no |
| `bodyMd` | `HankenGrotesk_400Regular` | 15 / 22 | 0 | no |
| `bodySm` | `HankenGrotesk_400Regular` | 13 / 18 | 0 | no |
| `labelTelemetry` | `JetBrainsMono_600SemiBold` | 14 / 18 | 0.56 | no |
| `labelEta` | `JetBrainsMono_700Bold` | 20 / 24 | -0.2 | yes |
| `labelBadge` | `JetBrainsMono_500Medium` | 11 / 14 | 0.88 | no |
| *ext* `labelAction` (Q8) | `HankenGrotesk_700Bold` | 15 / 20 | 0 | no |
| *ext* `metricDisplay` | `JetBrainsMono_700Bold` | 28 / 32 | -0.56 | yes |

"Large" means at least 24 pt, or at least 18.66 pt in a 700 face. `typography.ts` adds `export const LARGE_TEXT_VARIANTS = ['displayHero', 'displayHeroMobile', 'headlineLg', 'headlineLgMobile', 'labelEta', 'metricDisplay'] as const`. The contrast rule refers to it.

The v1 → v2 variant renames are done for the three migrated screens. The rest still apply mechanically:

| Old variant (v1) | New variant |
|---|---|
| `displayLg` | `headlineLgMobile` |
| `displaySm` | `headlineMd` |
| `headlineLg` (v1, 20/28) | `headlineMd` |
| `headlineSm` | `headlineSm` (now 18/24) |
| `bodyLg` (v1, 16/24) | `bodyMd` |
| `bodyMd` | `bodyMd` (now 15/22) |
| `bodySm` | `bodySm` (now 13/18) |
| `labelLg` | `labelTelemetry` (and `labelAction` inside `Button`) |
| `labelMd` | `labelBadge` |
| `labelSm` | `labelBadge` |
| `metricDisplay` | `metricDisplay` (now JetBrains Mono) |
| `metricTabular` | `labelEta` |

`AppText` `weight` overrides map per family. There are 11 loaded faces:
- Space Grotesk 500, 600, 700. `regular` maps to 500 and `extrabold` maps to 700.
- Hanken Grotesk 400, 500, 600, 700. `extrabold` maps to 700.
- JetBrains Mono 400, 500, 600, 700. `extrabold` maps to 700.

The `tabular` prop stays.

### Shapes (ROUND_EIGHT), spacing, elevation

`radius.ts` uses the DESIGN.md v3 `rounded` table (rem × 16): **`sm 4`, `base 8` (DEFAULT, ROUND_EIGHT), `md 12`, `lg 16`, `xl 24`, `full 9999`**. It was `sm 2, base 4, md 6, lg 8, xl 12`. The usage below was checked against the reference image (Q13):

| Radius | Elements | v2 call site → v3 |
|---|---|---|
| `base` (8) | `Button`, `IconButton` (48×48), `SegmentedControl` container and options, brand-mark and icon tiles, info boxes, `StatTile`, `MapCallout`, map frames, `ListRow` icon tile | was `base` 4: no change. Was `lg` (`StatTile`, `MapCallout`, map frames): change to **`base`**. |
| `md` (12) | `Card` (all variants), `GradientCard` outer and clip views | was `lg`: change to **`md`** |
| `lg` (16) | Confirm modal (top corners), LiveTracking sheet top corners | was `lg`: no change (value 8 → 16) |
| `full` | `Badge` (all tones incl. `route`), filter chips, `BalancePill`, the "ON DUTY" chip, search input (DESIGN pill search), `ProgressBar` track and fill, recenter FAB, `Avatar`, `PulseDot`, `MapPin`, status dots, user dot, timeline nodes, `TabBarIcon` dot | was `base` (badges, chips, pill, search, progress): change to **`full`** |
| `sm` (4) | `RouteSegment` line ends | no change (value 2 → 4) |

`spacing.ts` follows the DESIGN.md v3 `spacing` table: `xs 4`, `sm 8`, `md 16`, `lg 24`, **`xl 32`** (was 40), `gutter 16`, `gutterSm 12` (DESIGN `gutter-sm`), `margin 16`, `marginLg 24` (DESIGN `margin-lg`). Badges need horizontal padding of at least `sm` (8) for the pill shape.

`elevation.ts` (DESIGN "Elevation & Depth"; light mode brings soft shadows back; glows are rebased to `#FF5500`):

| Export | v2 | v3 | Used on |
|---|---|---|---|
| `level1` *(new)* | n/a | `'0px 2px 8px -2px rgba(15, 23, 42, 0.05)'` | `tiers.tier1` cards, `GradientCard` outer view |
| `level2` *(new)* | n/a | `'0px 10px 20px -5px rgba(15, 23, 42, 0.10), 0px 4px 6px -2px rgba(15, 23, 42, 0.04)'` | recenter FAB, `MapCallout`, floating chips |
| `level3` *(new)* | n/a | `'0px -16px 36px -8px rgba(15, 23, 42, 0.16)'` | confirm modal, LiveTracking sheet (`tiers.tier2`) |
| `ctaGlow` *(new)* | n/a | `'0px 4px 14px rgba(255, 85, 0, 0.35)'` | `Button` `primary` |
| `glowBrand` | `'0px 0px 16px rgba(255, 85, 0, 0.45)'` | unchanged | vehicle pins, "YOU" pin, tracked segment |
| `glowLive` (was `glowCyan`) | `'0px 0px 16px rgba(0, 229, 255, 0.40)'` | `'0px 0px 12px rgba(0, 179, 126, 0.40)'` | live pulse |
| `focusRing` (was `focusCyan`) | `'0px 0px 8px rgba(0, 229, 255, 0.25)'` | `'0px 0px 0px 3px rgba(255, 85, 0, 0.25)'` | focused search input |

`tiers`:
- `canvas`: `{ backgroundColor: canvas }`
- `tier1`: `{ backgroundColor: surfaceCard, borderWidth: 1, borderColor: borderSubtle, boxShadow: level1 }`
- `tier2`: `{ backgroundColor: surfaceCard, borderWidth: 1, borderColor: borderSubtle, boxShadow: level3 }`
- `infoBox` *(new)*: `{ backgroundColor: surfaceContainerLow, borderWidth: 1, borderColor: surfaceContainerHigh }`

Touch targets: `IconButton` is 48×48. Other pressables keep at least 44 pt height and use `hitSlop` to reach 48.

### Component rules (v3)

- **`Button` variants** (label `labelAction`; press scale 0.98):
  - `primary`: `brandAction` fill, `onBrandAction` label and icon, pressed `brandPressed`, `ctaGlow`.
  - `secondary`: `surfaceCard` fill, 1.5px `brand` border, `brandStrong` label.
  - `fare`: `amber` fill, `onAmber` label.
  - `tonal`: `surfaceContainerHigh` fill, 1px `borderSubtle`, `onSurface` label.
  - `danger-soft`: `errorTint` fill, `error` label.
  - `danger`: `crimsonAlert` fill, `onDark` label.
  - `ghost`: transparent, `textMuted` label.
  - `glass`: `glassFill` + `glassBorder`, `onDark` label (inside the teal and slate gradients).
  - `tonal-dark`: `ink` fill, `onDark` label (inside `viewsAmber`).
  - Disabled: `surfaceContainerHigh` fill, `borderSubtle`, `textMuted` label, `accessibilityState.disabled`, no glow.
- **`Badge` tones** (full pill, JetBrains Mono `labelBadge`, optional 6px dot):

| Tone | Fill | Text | Dot |
|---|---|---|---|
| `brand` | `brandTint` | `brandStrong` | `brand` |
| `brandSolid` | `brandAction` | `onBrandAction` | `onBrandAction` |
| `route` | `brandTint` + 1px `brand` border | `brandStrong` (700) | n/a |
| `fare` | `amberTint` | `amberStrong` | `amber` |
| `fareSolid` | `amber` | `onAmber` | `onAmber` |
| `live` | `liveTint` | `liveStrong` | `live` |
| `liveSolid` | `liveStrong` | `onDark` | `onDark` |
| `neutral` | `surfaceContainerHigh` | `textMuted` | `textSubtle` |
| `offline` | `surfaceContainerHigh` + 1px `borderStrong` | `textMuted` | `textSubtle` |
| `info` | `surfaceContainer` | `secondary` | `secondary` |
| `error` | `errorTint` | `error` | `crimsonAlert` |
| `glass` | `glassFill` + `glassBorder` | `onDark` | `tertiaryFixed` |

  The `onHigh` prop is removed (`brandStrong` passes on every tier).
- **`ProgressBar` tones:** `brand`, `live`, `fare`, `neutral` (`textSubtle`). Track `surfaceContainerHighest`, full radius. Every call site shows the value in text (Q14).
- **Filter chips (CommuteHub) and `SegmentedControl`:**
  - Unselected: `surfaceCard` fill + 1px `borderStrong` + `onSurface` text.
  - Selected: `brandAction` fill + `onBrandAction` text (reference "To Apas (IT Park)").
  - Chips are full pills. Segments use `base`.
- **Selectable cards** (top-up packages, payment channels, LiveTracking direction pills): selected = 1.5px `brand` border + `brandTint` fill; unselected = 1px `borderStrong` on `surfaceCard`.
- **Search input:**
  - `surfaceCard` fill, 1px `borderStrong`, full pill.
  - On focus: `brand` border + `focusRing`.
  - Text `onSurface`, placeholder `textMuted`.
  - `selectionColor`/`cursorColor` `brand`, and `keyboardAppearance="light"`.
- **`Switch`** (Profile GCash): `trackColor={{ false: surfaceContainerHighest, true: brand }}`, `ios_backgroundColor` `surfaceContainerHighest`, `thumbColor` `surfaceCard`.
- **`TopBar`:** `surfaceCard` background with a bottom `borderSubtle`. The "ON DUTY | DRV-0042" chip is `surfaceContainerLow` + `borderSubtle` + `onSurface` text with a `live` dot, full pill.
- **`ScreenScroll`:** `canvas` background, `indicatorStyle="black"`.
- **`MapCanvas`:**
  - `mapLand` ground, a `mapWater` band, `mapRoad` lines with `mapRoadMinor` edges.
  - Callouts are `surfaceCard` + `level2`.
  - Pins: `brand` with a 2px `surfaceCard` border, a white glyph and `glowBrand`.
  - User dot: `liveStrong` with a 3px `surfaceCard` ring and a `liveTint` ring.
- **`Avatar`:** a `brandTint` circle with `brandStrong` initials and a 1px `borderStrong` ring. The verified badge is `liveStrong` with an `onDark` check.
- **`AppText`:** default colour `onSurface`.
- **`Card`:** variants `elevated` → `tier1`, `tinted` → `infoBox`, `sheet` → `tier2`, `dashed` → `surfaceCard` + dashed 1.5px `borderStrong`. Radius `md`.
- **`IconButton` tones:** `tonal` (`surfaceContainerLow` + `ink` icon), `brand` (`brandTint` + `brand` icon), `live` (`liveTint` + `liveStrong` icon).
- **`StatTile`, `ListRow`, `SectionHeader`, `BalancePill`, `ComingSoon`, `TabBarIcon`:** follow the mapping and shape rules above.

### Contrast (WCAG AA, computed for this plan)

Body text and required copy must reach 4.5:1. Large text (`LARGE_TEXT_VARIANTS`) and required non-text UI must reach 3:1.

**White-on-orange rule (Q12):**
- **W1.** White on `brand #FF5500` (3.21:1) is allowed **only** for icons and glyphs (non-text, 3:1) and for text in a `LARGE_TEXT_VARIANTS` style. In practice, `brand` fills carry icons only: the brand mark, icon tiles and pins.
- **W2 (USER DECISION, overrides the AA default).** The user supplied a second Stitch reference (`stitch/light-theme-reference-2.webp`) and chose to match it exactly: every orange fill that carries text (all primary `Button` labels, `ROUTE 17B`/`E-JEEP` badges, selected direction chips, the ETA banner, selected segments) is **bright `#FF5500` with white text**. Set `brandAction: '#FF5500'`, `onBrandAction: '#FFFFFF'`, `brandPressed: '#EA5200'`. White on `#FF5500` is 3.21:1, an accepted, documented AA exception for text on brand fills only. To limit the impact, labels on these fills use a bold weight (≥ 600). AC46 excludes `onBrandAction`/`brandAction` from the 4.5:1 check and asserts ≥ 3.0 instead. Every other contrast rule (W1, W3, W4, body text) is unchanged.
- **W3.** Orange **text** never uses `brand`.
  - Small orange text uses `brandStrong #A63B00`, which reaches at least 5.0:1 on every v3 surface and tint.
  - Large orange text (`LARGE_TEXT_VARIANTS` only) may use `neonOrangeDeep #EA5200` on `surfaceCard`, `canvas`, `surfaceContainerLow`, `brandTint` and `surfaceContainer` (≥ 3.16). Otherwise it uses `brandStrong`.
- **W4.** The same rule applies to the other accents. `live` (`#00B37E`, 2.71 on white) and `amber` (`#F59E0B`, 2.15 on white) are never text colours. Use `liveStrong` and `amberStrong`.
- Lint enforces W3 and W4 for text (step 17).

| Foreground | Background | Ratio | Rule |
|---|---|---|---|
| `onSurface #0B1C30` | `surfaceCard` … `surfaceContainerHighest`, all tints | 17.2 → 13.3 | body text, allowed everywhere |
| `textMuted #475569` | `surfaceCard` / `canvas` / `surfaceContainerLow` / `surfaceContainer` / `High` / `Highest` | 7.58 / 7.21 / 6.88 / 6.50 / 6.19 / 5.88 | secondary text, allowed everywhere |
| `textMuted` | `brandTint` / `liveTint` / `amberTint` / `errorTint` | 6.86 / 7.19 / 7.31 / 6.90 | allowed |
| `onBrandAction #FFFFFF` | `brandAction #FF5500` | **3.21** | user-accepted exception (W2); bold labels; test asserts ≥ 3.0 |
| `#FFFFFF` | `brandPressed #EA5200` | 3.68 | pressed primary (W2) |
| `onBrand #FFFFFF` | `brand #FF5500` | **3.21** | **icons and large text only (W1); forbidden for small text** |
| `#FFFFFF` | `neonOrangeDeep #EA5200` | 3.68 | **forbidden for small text** |
| `brandStrong #A63B00` | `surfaceCard` / `canvas` / `Low` / `Container` / `High` / `Highest` | 6.47 / 6.15 / 5.87 / 5.55 / 5.28 / 5.02 | small orange text, allowed everywhere |
| `brandStrong` | `brandTint` / `primaryFixed` (`#FFDBCE`) | 5.85 / 5.01 | allowed |
| `neonOrangeDeep #EA5200` (large only) | `surfaceCard` / `canvas` / `Low` / `brandTint` / `surfaceContainer` | 3.68 / 3.50 / 3.34 / 3.33 / 3.16 | large text only |
| `neonOrangeDeep` | `surfaceContainerHigh` / `Highest` | 3.00 / 2.86 | **forbidden** |
| `brand #FF5500` as text | `surfaceCard` / `canvas` / `Low` / `brandTint` | 3.21 / 3.05 / 2.91 / 2.90 | **forbidden as text (W3)** |
| `brand` (non-text) | `surfaceCard` | 3.21 | active tab icon and dot, selected borders, Switch track |
| `liveStrong #006C4B` | `surfaceCard` / `liveTint` / `surfaceContainer` | 6.47 / 6.14 / 5.55 | green text |
| `onDark #FFFFFF` | `liveStrong` | 6.47 | `liveSolid` badge |
| `live #00B37E` as text | `surfaceCard` | 2.71 | **forbidden as text** |
| `amberStrong #B45309` | `surfaceCard` / `canvas` / `Low` / `amberTint` / `brandTint` | 5.02 / 4.78 / 4.56 / 4.84 / 4.54 | fare text |
| `amberStrong` | `surfaceContainer` / `High` | 4.31 / 4.10 | **forbidden** |
| `onAmber #0B1C30` | `amber #F59E0B` / `#FBBF24` | 7.99 / 10.29 | fare fills, views card |
| `amber` as text | `surfaceCard` | 2.15 | **forbidden as text** |
| `error #BA1A1A` | `surfaceCard` / `errorTint` / `errorContainer` | 6.46 / 5.88 / 5.00 | error text |
| `onDark` | `crimsonAlert #E11D48` | 4.70 | SOS |
| `crimsonAlert` as text | `errorTint` | 4.28 | **forbidden as text** |
| `secondary #565E74` | `surfaceContainer` | 5.54 | info badge |
| `onDark` | `ink #0F172A` | 17.9 | `tonal-dark` |
| `onDark` / `onDarkMuted` | `broadcast` stops `#0E7490` / `#115E59` | 5.36 / 7.58 and 4.75 / 6.73 | teal gradients |
| `onDark` over `glassFill` | `#0E7490` | ≥ 4.5 (asserted) | glass buttons |
| `onDark` / `onDarkMuted` | `broadcastPaused` `#475569` / `#334155` | 7.58 / 10.35 and 6.72 / 9.19 | paused card |
| `mapLabel #475569` | `mapLand` / `surfaceBg` | 6.92 / 7.24 | map text |
| `liveStrong` (user dot) | `mapLand` | 5.90 | non-text |
| `textSubtle #64748B` | `surfaceCard` / `surfaceContainer` | 4.76 / 4.08 | non-text and disabled only |
| `brand` / `live` / `amber` (segments, pins, dots, progress fills) | `mapLand` / track | 2.93 / 2.47 / 1.96 | exempt supplementary graphics (Q14) |

`packages/ui/src/theme/contrast.ts` exports:
- `contrastRatio(fg, bg, over)`. The default `over` becomes `surfaceCard`.
- `contrastPairs`: every allowed row above, by token.
- `forbiddenPairs`: every forbidden row above.
- `gradientTextColors`: the gradient table.
- `SURFACE_TIERS`: `surfaceCard`, `canvas`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh`, `surfaceContainerHighest`.

`contrast.test.ts` asserts:
- each allowed pair meets its minimum
- each forbidden pair is below 4.5 (for text) or below 3 (for large text or non-text, where so marked)
- each gradient text colour passes against **both** stops
- white on `credits` and `dailyEarnings` is below 4.5

## Architecture notes

- **Reuses:**
  - `react-native-safe-area-context`, `expo-router`, `expo-splash-screen`, `expo-font`, `expo-status-bar`, `expo-image`, `expo-linear-gradient`.
  - `expo-system-ui` (already installed, `~58.0.7`), so the app.json root `backgroundColor` also applies on Android.
  - Nothing from `src/components/` is reused. All of it is starter template.
- **Removed:**
  - `src/app/index.tsx` and `src/app/explore.tsx`.
  - All of `src/components/`: `animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`, `app-tabs.tsx`, `app-tabs.web.tsx`, `external-link.tsx`, `hint-row.tsx`, `themed-text.tsx`, `themed-view.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`.
  - `src/global.css`.
  - `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts`.
  - `src/screens/commuters/.gitkeep` and `src/screens/drivers/.gitkeep` (replaced by real folders).
  - Template-only images: `assets/images/tabIcons/*`, `expo-logo.png`, `react-logo*.png`, `logo-glow.png`, `expo-badge*.png`, `tutorial-web.png`. Keep `icon.png`, `splash-icon.png`, `favicon.png`, the `android-icon-*` files and `expo.icon/`.
  - (v2, done) The packages `@expo-google-fonts/plus-jakarta-sans` and `@expo-google-fonts/inter`, and every `PlusJakartaSans_*` / `Inter_*` reference.
- **New `packages/ui/src/`** components, one folder each with `index.ts`, `styles.ts` and `<Name>.tsx`:
  - `theme/`: not a component. Contains `index.ts`, `colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts`, `fonts.ts`, `contrast.ts`, `contrast.test.ts`, `theme.test.ts`.
  - `AppText/`: the `variant` prop maps to the typography tokens (12 v2 DESIGN styles + `labelAction`, `metricDisplay`). The `tabular` prop sets `fontVariant: ['tabular-nums']`. Also takes `color`, `weight` and `uppercase`. The default colour is `onSurface`.
  - `Icon/`: wraps `MaterialIcons` and `MaterialCommunityIcons` (`family` prop). The name type is the glyph-name union, so a wrong name fails `tsc`.
  - `Button/`: the v3 variants under "Component rules". Supports a leading icon, a `disabled` state, and press scale 0.98. Sets `accessibilityRole="button"`.
  - `IconButton/`: 48×48, radius `base`. Tones `tonal`, `brand`, `live`.
  - `Badge/`: the v3 tones, full pill, mono text, optional status dot. Covers vehicle tags and telemetry badges.
  - `Card/`: variants `elevated`, `tinted`, `sheet`, `dashed` (v3 rules). Radius `md`.
  - `GradientCard/`: wraps `expo-linear-gradient`. Takes named gradient presets from the theme. Keeps the D4 nesting.
  - `SectionHeader/`: icon, title, optional badge or right action.
  - `SegmentedControl/`: typed options, selected value, `onChange`. Sets `accessibilityRole="tab"` and `accessibilityState.selected`. The selected option is `brandAction`.
  - `ListRow/`: leading icon tile, title, subtitle, trailing slot, optional chevron and `onPress`.
  - `StatTile/`: label, big value, sub-caption, optional icon.
  - `ProgressBar/`: value 0–1 and tone. Optionally two segments.
  - `BalancePill/`: wallet icon + ₱ amount (`amberTint` fill, `amberStrong` mono text), `onPress`, full pill.
  - `Avatar/`: initials, size, optional verified badge. Circle (Q11).
  - `TopBar/`: brand-mark variant (logo, title, live dot, subtitle) and a generic left/right slot layout. Applies the top safe-area inset. Background `surfaceCard` with a bottom `borderSubtle`.
  - `MapCanvas/`: light stylised map (`mapLand`, `mapWater`, `mapRoad`) with absolutely positioned children. Also exports `RouteSegment`, `MapPin`, `MapCallout` and `PulseDot`.
  - `ScreenScroll/`: `ScrollView` on a `canvas` background with standard horizontal margin, section gap and bottom padding. Sets `indicatorStyle="black"`.
  - `ComingSoon/`: icon, title, "Coming soon" body, optional action button.
  - `TabBarIcon/`: icon plus the active `brand` dot.
- **Package files:** `packages/ui/tsconfig.json` (extends `../../tsconfig.base.json`). New `para/tsconfig.base.json` (extends `expo/tsconfig.base`, strict, holds `paths`). `para/tsconfig.json` extends `./tsconfig.base.json`.
- **Screens.** Each has `index.ts`, `styles.ts`, `<Name>Screen.tsx`, `<Name>Screen.test.tsx`, and optional screen-local subcomponents in the same folder (e.g. `RouteCard.tsx`):
  - `src/screens/shared/RoleSelect/`
  - `src/screens/commuters/CommuteHub/`
  - `src/screens/commuters/LiveTracking/`
  - `src/screens/commuters/Wallet/`
  - `src/screens/commuters/Activity/`
  - `src/screens/commuters/Account/`
  - `src/screens/drivers/DutyHub/`
  - `src/screens/drivers/EarningsPool/`
  - `src/screens/drivers/CorridorRadar/`
  - `src/screens/drivers/Trips/`
  - `src/screens/drivers/DriverProfile/`
- **Types:**
  - `src/types/commuter.ts`: `VehicleType`, `TransitRoute`, `RouteFilter`, `RecentView`, `DirectionUnits`, `LiveTrip`, `TopUpPackage`, `PaymentChannel`, `LedgerEntry`, `LedgerFilter`, `WalletSummary`.
  - `src/types/driver.ts`: `DriverIdentity`, `Assignment`, `DirectionInfo`, `BroadcastStatus`, `DutyBaseSupport`, `PoolShare`, `EarningsSummary`, `PoolTelemetry`, `Disbursement`, `StopDemand`, `RadarSnapshot`, `ComplianceDoc`, `DriverMetrics`.
- **Services:**
  - `src/services/mock/commuterData.ts`, `src/services/mock/driverData.ts`.
  - `src/services/commuterService.ts`, `src/services/driverService.ts`: getters plus the pure helpers `filterRoutes(routes, filter, query)` and `filterLedger(entries, filter)`.
- **Utils:** `src/utils/currency.ts` exports `formatPeso(amount, { decimals?, sign? })`, e.g. `₱45.00`, `-₱1.00`, `+₱50.00`, `₱1,420.50`. It formats by hand (`toFixed` plus a thousands-separator regex) rather than through `Intl`, so output is the same on Hermes and Jest.

## Affected areas

### Screens

Content below is taken from the HTML and PNG. The dev must copy the strings exactly from the HTML. Colour words in brackets are v3 roles (see "Design system v3 (light)"). The screen PNG colours are not used.

#### RoleSelect (shared, no design)

See D9.

#### CommuteHub (`commuters-commute-hub`)

- **Top bar:** brand mark "JeepTrack Live" + live dot, subtitle "COMMUTE", `BalancePill` ₱45.00 (opens Wallet), avatar "M".
- **Greeting:** "Mabuhay, Maria! 👋" and "Saan ang biyahe mo ngayon?", with a round icon button on the right [`IconButton` tone `tonal`].
- **Search input:** `location-on` prefix, placeholder "Search route, terminal, or stop (e.g. Cubao)", `my-location` suffix.
- **Filter chips** (horizontal scroll):
  - "All Transit (24)" (selected by default)
  - "Jeepneys Only (16)"
  - a bus chip (text from the HTML)
- **Balance card** [`amberTint` card]:
  - "₱45.00" BALANCE
  - "45 instant live views available"
  - "+ Cash-in" button (opens Wallet) [`fare`]
  - inner box [`infoBox`]: "₱1 Viewing Access • Active Verified Drivers Only" with a "₱0 If Inactive" tag, and "Walay Driver / No GPS = Automatic ₱0 Deduction" with "GUARANTEED REFUND"
- **"Approved Transit Routes"** header:
  - badges "LIVE RADAR" and "Verified Drivers Only" [`live`]
  - caption "Accurate ETA Tracking • Real-time Jeepney & Bus Telemetry"
- **Four route cards** from the mock:

  | Route | Vehicle badge | Code | On road | Via | Corridor | Base fare |
  |---|---|---|---|---|---|---|
  | Cubao — Divisoria | Traditional & Modern Jeepney | #04-C | 6 on road | Aurora Blvd • Legarda • Recto | 9.2 km • 14 Stops | ₱13.00 |
  | Fairview — PITX | City Bus (Aircon) | #11-Q | 4 on road | Quezon Ave • España • Roxas Blvd | 34 km • 28 Stops | ₱15.00 |
  | Monumento — Baclaran | Modern Jeepney (BEEP) | #01-T | 8 on road | Rizal Ave • Taft Avenue Corridor | 18 km • 22 Stops | ₱15.00 |
  | Pasig Palengke — Quiapo | Traditional Jeepney | #09-P | "0 on road (Offline)" | Shaw Blvd • Magsaysay Blvd | (offline) | ₱13.00 |

  - Active cards show Track Pass "₱1 / view" and a "View Live (₱1)" button [`primary`].
  - The offline card is drawn with a dashed border, live status "Walay Available Driver", Track Pass "₱0 (No Charge)", the note "Dili ma-deduct ang ₱1 (0 driver online)", and a disabled "No Charge (₱0)" button.
- **Confirm drawer** (RN `Modal`, transparent, slide, `tier2` with radius `lg` over `scrim`), opened by "View Live (₱1)":
  - "LIVE SATELLITE UPLINK", then the route name
  - "GPS View Access ₱1.00"
  - "Wallet Remaining After ₱44.00" (balance − 1)
  - "Active vehicle radar guaranteed for 15 mins"
  - buttons "Cancel" and "Confirm & Track (₱1)"
- **"Recent Viewing Activity"** with a "Clear Log" action. Row: "Cubao — Divisoria", "Active" badge, "Viewed 12 mins ago • 2 vehicles tracked", "Re-open" button.
- **Guarantee card:** "Walay Driver = ₱0 Deduction Guarantee" with a "Zero-Risk" badge [`live`] and the Bisaya body copy.

#### LiveTracking (`commuters-live-tracking`)

- **Top bar:** "←" + "Commute Hub" back link, title "Live Corridor", subtitle "ON-DEMAND VIEW (₱1.00)", `BalancePill` ₱45.00, avatar.
- **Route card:**
  - "ROUTE 17B" tag [route badge], "IT Park ⇄ Carbon (via Escario)", "18m left" pass chip
  - "ROUTE 17B CORRIDOR • ₱1 PAID", "4 Vehicles Active"
  - two direction panels:
    - "To Apas (IT Park)": "2 Units"; Unit 14 "4m away", Unit 08 "9m away"
    - "To Colon (Carbon)": "2 Units"; Unit 23 "3m (Tracked)" highlighted [`brandTint` + `brand` border, `brandStrong` text]; Unit 11 "12m away"
  - description line
  - footer "GPS: 5s Real-Time Telemetry" and "No Charge If Walay Driver"
- **MapCanvas:**
  - user dot [`liveStrong`]
  - callout "Go to pickup point / Near Escario Central Mall, N. Escario St."
  - route polyline segments [live, amber, live, brand, live] (green, amber, green, red, green in v1)
  - vehicle pin labelled "GMD-1782" [brand + glow]
  - callout "Making 1 stop first"
  - "17B" road shield [route badge], "SAFETY CENTRE" chip, recenter FAB [floating control]
- **Sheet card:**
  - handle
  - ETA banner [`brandTint` + `brand` border; "3 MINS" in `neonOrangeDeep`]: "UNLOCKED ARRIVAL ETA", "Next Stop: Escario Capitol", "3 MINS", "ON SCHEDULE"
  - tags "ROUTE 17B", "Modern Jeep", plate "GMD-1782", and the line "17B: Apas (IT Park) ⇄ Carbon via Escario / Capitol / Fuente"
  - direction selector: "Towards Colon (Tracking GMD-1782 • 3m ETA)" and "Towards Apas (2 active units)"
  - driver row: "Mang Ernesto Santos", ★ 4.9 • 2,410 safe trips, thumbs-up button
  - the direction panels repeated, as in the design
  - "Last GPS: 3s ago (High Accuracy 3m)" with "VERIFIED RTK"
  - pass row [amber] "₱1.00 Paid • Live Route 17B Telemetry", "Walay Driver = ₱0 Refund Guarantee", "ACTIVE"
  - buttons "Refresh", "Signal Stale", "Switch"

#### Wallet (`commuters-wallet`)

- **Top bar:** brand mark + subtitle "WALLET", `BalancePill` ₱45.00, avatar.
- **Notice:** "Instant GPS pass issuance. Powered by BSP-regulated e-wallet gateways."
- **Credits card** (`credits` gradient, orange tint, `onSurface` text, amount in `brandStrong`):
  - "COMMUTER TRANSIT CREDITS", "Active Pass", "₱45.00" "PHP"
  - "Equates to 45 vehicle live tracking sessions (₱1/session)"
  - "Non-withdrawable credits • Used exclusively for JeepTrack Live tracking services"
- **"Top-Up Commuter Wallet"** with a "Zero Fee Promo" badge. 2×2 packages:
  - ₱20: "20 Live Views", "₱1.00 / trip"
  - ₱40: "40 Live Views", "₱1.00 / trip"
  - ₱50: "POPULAR", "50 Live Views + 2 Bonus", "52 Total Sessions"
  - ₱100: "BEST VALUE", "100 Views + 5 Bonus", "105 Total Sessions"
- **"Payment Channel":** GCash, Maya, ShopeePay, 7-Eleven.
- **CTA:** "Cash In ₱{amount} via {channel}" [`primary`].
- **"Transit Ledger"** with "Real-time sync". Segmented filter: "All (18)", "Views (-₱1)", "Cash-In (+₱)". Four entries:

  | Entry | Time | Ref | Status | Amount | Note |
  |---|---|---|---|---|---|
  | Live View: Cubao — Divisoria | 2 mins ago | TXN-83910 | Completed (3 vehicles viewed) | -₱1.00 | Active Pass |
  | Live View: Monumento — Baclaran | Today 8:15 AM | TXN-83742 | Completed | -₱1.00 | Active Pass |
  | Cash-in via GCash | Yesterday 4:30 PM | CAS-19402 | Verified | +₱50.00 | +2 Bonus views |
  | Zero-Charge View | Yesterday 1:10 PM | REV-00214 | No Deduction (Guarantee applied) | ₱0.00 | No active drivers |

- **"100% Fair-Transit Guarantee"** card.

#### DutyHub (`drivers-duty-hub`; light reference `drivers-duty-hub-light-reference.png`)

- **Top bar:** brand mark + "DRIVER HUB", chip "ON DUTY | DRV-0042", avatar "E".
- **Profile card:**
  - "Mang Ernesto Santos", ★4.9, "Verified Driver" [`live`], "ID: DRV-0042"
  - vehicle row [`infoBox`]: "E-JEEP" [route badge], "Jeepney #08 • NDF-4821", "Modern Electric Mini-Bus (22-seater • CCTV Active)"
  - "Cebu City Route 17B • Apas ⇄ Carbon" + "ACTIVE ASSIGNMENT" [`brand` badge]
- **"Route 17B Direction" card:**
  - "LIVE GPS ACTIVE" [`live`], "IT Park (Apas) ⇄ Carbon Market (Colon)", "Switch" button [`secondary`]
  - segmented control "To Apas (IT Park)" / "To Colon (Carbon)" [selected `brandAction`]
  - direction detail [`infoBox`]: badge, origin, density, headway, waypoint sequence with the current stop highlighted [DESIGN timeline], "Next Stop: …", "+14 pax waiting"
  - The data for both directions is in the HTML script `initRoute17BSwitcher` (apas and colon objects).
- **Broadcast card** (`broadcast` gradient, teal):
  - "BROADCASTING LIVE", "SATELLITE SYNC: ACTIVE", battery "94%"
  - "GPS Ping: Every 6s", "Foreground Service: STABLE"
  - buttons "Stop Tracking" and "Report Delay / Issue" [glass]
- **Corridor mini-map** (`MapCanvas`, 128 px high):
  - header "Route 17B Escario Corridor Live", "Speed: 22 km/h" [`live`]
  - overlay "Escario Central / Cebu Parklane - 350m", "Next scheduled Route 17B stop", "14 Waiting" [`brandSolid`]
  - The overlay follows the selected direction.
- **"Daily Duty Base Support":**
  - "₱600 ÷ 30 Days Completed Duty", "Active Duty" [`live`]
  - "₱20.0" [large `neonOrangeDeep`] "/ day credited", "Credited Daily" [`liveStrong`]
  - progress 18/30 [`live`], "Duty Log: 18 / 30 Days Completed", "₱360.00 accrued this month"
- **"Route View Bonus Pool Sharing":**
  - "Corridor: Cebu 17B (Apas ⇄ Carbon via Escario)", "Unlocked" [`info`]
  - qualified box [`infoBox`] "194 / 100 VIEWS (194%) - UNLOCKED • QUALIFIED" with a full progress bar and the minimum-requirement copy
  - rows: "Corridor ₱1 Views Pool Today 194 views (₱194.00)", "Active Drivers on Route 17B Corridor 4 drivers on road", "Your Equal Share Today ₱48.5" [large `neonOrangeDeep`]
  - formula box [`infoBox`], then the condition note [`infoBox`]
- **"TODAY'S INSTANT DAILY EARNINGS"** (`dailyEarnings` gradient, orange tint): "₱68.5", "(₱20 Duty Base + ₱48.50 Route Pool)", "Daily Auto-Release to GCash every 11:59 PM", "Payout Log" button [`primary`].
- **"Dispatcher Support":** "Cebu Central Terminal • Route 17B Dispatch Desk", "Call Hotline" button [`secondary`].

#### EarningsPool (`drivers-earnings-pool`)

- **Top bar:** "DRV-0042 • Mang Ernesto", "ON DUTY", "₱1,420.50", bell `IconButton`, person `IconButton` [tone `brand`].
- **Banner** (`poolBanner` gradient, teal): "ROUTE 17B DRIVER POOL", "Corridor Pool Active & Earning", "LIVE".
- **Total card:**
  - "TODAY'S ESTIMATED TOTAL" "₱682.50" [large `neonOrangeDeep`] "+13.7%" [`liveStrong`]
  - "Scheduled Auto-Release: Today at 11:59 PM • Direct to GCash"
  - "Instant GCash Cash-in" button [`fare`]
  - "Verified Destination: 0917••••421"
- **"Shift Breakdown Logic"** with "Automated Audit":
  - "Guaranteed Base Duty Wage ₱600.00" with copy, "Shift Active: 7.5 hrs", "Shift Target: 8.0 hrs"
  - [amber] "Shared Route 17B Bonus Pool ₱82.50" with the "POOL REVENUE FORMULA" box [`infoBox`]
  - "1,650 / 1,000 min corridor views", "165% UNLOCKED" with a two-tone progress bar [live + amber]
  - "Corridor threshold achieved at 11:20 AM…"
- **"Unit & Pool Telemetry"** "UPDATED 1M AGO":
  - "412 Commuter Unlocks" "High Trajectory"
  - "20 Drivers On-Duty" "Co-op Verified"
  - "Tier 2 Unlocked" "1,000–1,999"
- **"Recent Disbursements"** "ALL LOGS":
  - "November Payout MTD ₱14,840.00", "21 Shifts Completed"
  - rows "Yesterday (Nov 8) ₱710.00" and "Thursday (Nov 7) ₱665.00" with GCash refs
- **"Verified LTFRB Fleet Partnership"** footer card.

#### CorridorRadar (`drivers-corridor-radar`)

- **Top bar:** same as EarningsPool.
- **Lock strip:** "RTK LOCK 99.8%", "17B: IT Park ⇄ Carbon", "₱1/view active". Unit card: "GMD-1782", "UNIT #23", "N. Escario → Carbon", "2s Ping".
- **Radar MapCanvas** (`radarMap` ground):
  - "Headway: +4m 12s ideal"
  - recenter `IconButton`
  - "Unit 14 650m ahead (3m gap)"
  - "ESCARIO CENTRAL 18 pax"
  - "YOU • 28 km/h" pin with pulse [brand]
  - "Unit 09 -1.2km"
  - "Capitol Stop 14 pax waiting"
  - "Escario: Moderate Flow"
- **"Live Stop Demand Heatmap"** "Peak Commuter Surge", three tiles:
  - IT PARK TERM 32 "High Surge" [`brandTint` tile, `brandStrong` label]
  - ESCARIO CTR 18 "Approaching" [`amberTint` tile, `amberStrong` label]
  - FUENTE ROTUNDA 14 "Steady Flow" [`liveTint` tile, `liveStrong` label]
- **Telemetry card:**
  - "SPEED TELEMETRY" 28 km/h "SAFE", "Corridor Limit: 35 km/h"
  - "SEATING MANIFEST" 15 / 23 pax "8 VACANT" with a progress bar
  - "NEXT TARGET STATION Escario Central Mall", "ESTIMATED ARRIVAL 2m 40s"
- **Views card** (`viewsAmber` gradient): "412 Commuter Views", "LIVE POOL", "₱412.00 earned from active commuter radar…", "View Pot" button (opens Earnings) [`tonal-dark`].
- **Action tiles:** "Report Hazard / Baha" [amber], "Terminal Check-In", "SOS Dispatch" [`danger`].

#### DriverProfile (`drivers-profile`)

- **Top bar:** same as EarningsPool.
- **Identity card:**
  - "DRV-0042", "Active Master", "Ernesto V. Santos", "Cebu City South Transport Coop (CCSTC)"
  - "4.9", "2,410 safe trips"
  - chips "LTFRB Modern PUV Verified", "RTK Telemetry Certified", "Clean Driving Record 2026"
- **Metrics:** "96.4% Headway Punctuality", "8.2 hrs Avg Active Daily", "92/100 Eco Efficiency".
- **"Assigned Unit & Route"** "UNIT #17":
  - "PLATE NUMBER GMD-1782", "CLASSIFICATION Isuzu NLR Class 2"
  - "ROUTE 17B", "IT Park ⇄ Carbon Terminal", "via Escario, Capitol & Osmeña Blvd"
  - "Capacity 23 Passengers", "Dual Cam & Telemetry Online & Beaconing"
  - "Daily Pre-Shift Checklist Cleared Nov 9, 2026 • 05:15 AM (Terminal South)" with "View Log"
- **"Cooperative & Payouts"** "Auto-Sync":
  - "GCash Transit Wallet" "VERIFIED" "0917-882-9421" with a toggle switch (on)
  - copy line
  - "Coop Capital Savings 5.0% withheld from fare total ₱42,150.00"
  - "Dispatch Hub" and "SOS Terminal" buttons
- **"Compliance & Document Vault"** "3 / 3 Valid", three chevron rows:
  - Professional Driver's License
  - LTFRB Operator CPC Franchise
  - PhilHealth & SSS Transit ID
- **Footer:** "End Shift & Submit Daily Manifest" button, then "JEEPTRACK OPERATOR V2.4.1 • CCSTC FLEET ID: 0042".

#### Placeholders

- Commuter Activity: `history` icon, "Activity".
- Commuter Account: `account-circle` icon, "Account", plus a "Switch role" button.
- Driver Trips: `alt-route` icon, "Trips".
- Each shows its role's top-bar style, the copy "Coming soon", and one line of description.

### Interactions (local `useState` only, no persistence)

- **CommuteHub:**
  - The chip filter and the search text filter the route list through `filterRoutes`.
  - Search matches the route name, code and via line, case-insensitive.
  - No matches shows the empty state "No routes match your search".
  - "View Live (₱1)" opens the confirm drawer. "Confirm & Track" closes it and navigates to `/live-map`. "Cancel" closes it.
  - "+ Cash-in" and `BalancePill` navigate to `/wallet`.
  - "Clear Log" empties the recent list and shows "No recent views yet".
  - "Re-open" navigates to `/live-map`.
- **LiveTracking:**
  - "Commute Hub" navigates to `/commute`.
  - The direction selector and "Switch" toggle the tracked direction (colon ↔ apas). The selected pill changes.
  - "Refresh" resets "Last GPS" to "just now".
  - "Signal Stale" and the thumbs-up button are pressable but do nothing in this feature. They have accessibility labels.
- **Wallet:**
  - Package and channel selection. Defaults are ₱50 and GCash.
  - The CTA label follows the selection.
  - Pressing the CTA shows `Alert.alert('Demo only', 'Cash-in is not available in this demo build.')`. The balance does not change.
  - The ledger filter calls `filterLedger`. Views shows the 3 `view` entries, including the ₱0 one. Cash-In shows the 1 `cashIn` entry.
- **DutyHub:**
  - Direction segmented control and "Switch": the apas/colon data from the HTML updates the badge, origin, density, headway, waypoints, next stop and the mini-map overlay.
  - "Stop Tracking" toggles broadcasting. When paused:
    - the status reads "TRACKING PAUSED"
    - the card uses the `broadcastPaused` gradient preset
    - the button reads "Resume Tracking", with a `play-arrow` icon

    Pressing again restores the live state.
  - "Report Delay / Issue" shows "Reported!" for 2.2 s. The timer is cleared on unmount.
- **EarningsPool:** static. Buttons are pressable no-ops.
- **CorridorRadar:** "View Pot" navigates to `/earnings`. The other buttons are no-ops.
- **DriverProfile:**
  - The GCash `Switch` toggles locally.
  - "End Shift & Submit Daily Manifest" calls `router.replace('/')`.
- **Placeholders:** Account "Switch role" calls `router.replace('/')`.

### Components

See the `packages/ui/src/` list under Architecture notes and "Component rules (v3)".

### Hooks / services / types

- `src/services/*`, `src/types/*`, `src/utils/currency.ts`.
- No new hooks are needed. Font loading stays inline in the root layout.

### Navigation

- Root `Stack` with the groups `(auth)`, `(commuters)` and `(drivers)`.
- Two `Tabs` layouts (D1, D2, D3).
- `headerShown: false` everywhere. Screens draw their own `TopBar`.
- (v3) Tab options in `src/constants/navigation.ts`:
  - `tabBarActiveTintColor = colors.brandStrong`, `tabBarInactiveTintColor = colors.textMuted`
  - `TabBarIcon` paints the focused icon and dot in `colors.brand`
  - `tabBarStyle`: `colors.surfaceCard` background with a 1px `colors.borderSubtle` top border
  - `tabBarLabelStyle`: `typography.labelBadge`
  - `sceneStyle`: `colors.canvas`
- (v3) The root `Stack` `contentStyle` uses `colors.canvas`. The root is wrapped in `ThemeProvider` (exported from `expo-router`) with a customised **`DefaultTheme`**:
  - `dark: false`
  - `colors.background` = `canvas`, `card` = `surfaceCard`, `text` = `onSurface`, `border` = `borderSubtle`, `primary` = `brand`

  This prevents a dark flash during transitions. `DefaultTheme` is exported at `node_modules/expo-router/build/exports.d.ts:25`.

### APIs

None. Mock data only.

## Dependencies and risks

### Packages

**No package changes in revision 3.** All needed packages are already installed. Verified in `package.json`:
- `@expo-google-fonts/space-grotesk ^0.4.1`, `@expo-google-fonts/hanken-grotesk ^0.4.3`, `@expo-google-fonts/jetbrains-mono ^0.4.1`
- `expo-linear-gradient ~58.0.3`, `expo-status-bar ~58.0.4`, `expo-system-ui ~58.0.7`
- `@expo-google-fonts/plus-jakarta-sans` and `@expo-google-fonts/inter` are gone. Do **not** reinstall them, even though DESIGN.md v3 names those fonts (Q6).

| Package | Reason | In Expo Go |
|---|---|---|
| `@expo/vector-icons` | icons | yes |
| `@expo-google-fonts/space-grotesk` | headlines and display | JS + font assets |
| `@expo-google-fonts/hanken-grotesk` | body and `labelAction` | JS + font assets |
| `@expo-google-fonts/jetbrains-mono` | labels, badges, telemetry, metrics, tab labels | JS + font assets |
| `expo-linear-gradient` | gradient cards (D5) | yes |
| dev: `eslint`, `eslint-config-expo` (`~58.0.4`) | `npx expo lint` | n/a |
| dev: `jest`, `jest-expo` (`~58.0.14`), `@types/jest` | unit and component tests | n/a |
| dev: `@testing-library/react-native` (+ its declared renderer peer) | component tests | n/a |

- `react-native-maps` is **not** added (D4).
- Unused template dependencies (`expo-device`, `expo-web-browser`, `expo-glass-effect`, `@expo/ui`, `expo-symbols`) are left in `package.json`. Removing them is out of scope.

### Native / dev build needed

No. Every module is in Expo Go SDK 58. Fonts load at runtime with `useFonts`, and no config plugin is needed for Expo Go.

### Expo docs verification

The planner had no web access in any revision of this plan. These facts were checked locally:
- `bundledNativeModules.json` versions for `@expo/vector-icons`, `expo-linear-gradient`, `react-native-maps`, `jest-expo` and `eslint-config-expo`.
- `Tabs` (`expo-router/js-tabs`), `Stack`, `ThemeProvider`, `DarkTheme` and **`DefaultTheme`** are exported by the installed `expo-router` (`node_modules/expo-router/build/exports.d.ts:24–25`). `sceneStyle` is a bottom-tabs option.
- The installed font and system-UI packages are listed above.
- `@expo/cli` enables `experiments.tsconfigPaths` by default, so Metro resolves `@packages/ui/*` from `tsconfig.json` paths.

**Before step 17, the developer must read these SDK 58 pages** (as `AGENTS.md` requires) and adjust the plan if anything differs:
- (v3) Color themes / `userInterfaceStyle: "light"`: https://docs.expo.dev/develop/user-interface/color-themes/
- (v3) App config (`userInterfaceStyle`, root `backgroundColor`): https://docs.expo.dev/versions/v58.0.0/config/app/
- (v3) System UI: https://docs.expo.dev/versions/v58.0.0/sdk/system-ui/
- (v3) Status bar (`style="dark"`): https://docs.expo.dev/versions/v58.0.0/sdk/status-bar/
- (v3) Splash screen (plugin `backgroundColor`; do not add a `dark` sub-key): https://docs.expo.dev/versions/v58.0.0/sdk/splash-screen/
- Linear gradient: https://docs.expo.dev/versions/v58.0.0/sdk/linear-gradient/
- (v3) React Native `boxShadow` (multiple shadows, negative spread) for the SDK 58 React Native version: https://reactnative.dev/docs/view-style-props#boxshadow
- Fonts: https://docs.expo.dev/versions/v58.0.0/sdk/font/ and https://docs.expo.dev/develop/user-interface/fonts/
- Router: Tabs https://docs.expo.dev/router/advanced/tabs/, layouts https://docs.expo.dev/router/basics/layout/, navigation https://docs.expo.dev/router/basics/navigation/, testing https://docs.expo.dev/router/reference/testing/
- ESLint: https://docs.expo.dev/guides/using-eslint/
- Jest: https://docs.expo.dev/develop/unit-testing/

### Risks

- **Template removal and typed routes.** `typedRoutes: true` regenerates `.expo/types` when `expo start` runs. `tsc` may flag `router.replace('/commute')` until the types regenerate. Run Metro once before `tsc`, or type the hrefs as `Href`. Do not commit generated files.
- **Custom fonts and `fontWeight`.** On Android, a custom family plus `fontWeight` can fall back to the system font. Each typography token sets the weight-specific family and **no** `fontWeight`.
- **(v3) Silent role changes.** Some keys keep their names but change meaning (see that table): `surface`, `surfaceContainerLow`, `surfaceContainerHigh`, `tertiary*`, `onSecondaryFixed*`, `errorContainer`, `onBrand`, `amber`, `brand`. `tsc` does not flag them.
  - The three screens already migrated to v2 (RoleSelect, CommuteHub, LiveTracking) use these keys in their v2 roles. They must be re-audited, not assumed done.
  - Mitigations: the lint rule from step 17 (accent text), the AC52 greps, and screen tests that assert v3 colours.
- **(v3) Dark leftovers.** Dark v2 values must not survive, for example the `onBrand` dark text, the `canvas` route-badge fill, `indicatorStyle="white"` and `keyboardAppearance="dark"`. The `theme.test.ts` dark-value check plus AC44 cover these.
- **(v3) Bright-orange CTAs with white text.** The user chose the Stitch look (W2): `#FF5500` with white labels, 3.21:1. This is a known AA shortfall for small text on brand fills, accepted by the user.
- **(v3) `boxShadow` on light surfaces.** Shadows are back (`level1`–`level3`, `ctaGlow`).
  - Verify that iOS renders the multi-shadow string and the negative spread. If not, fall back to a single shadow per level.
  - Android may render them differently, which is acceptable.
  - The `GradientCard` D4 nesting already separates the shadowed outer view from the clipping inner view.
- **Wider fonts and truncation (unchanged from v2).** The cycle-1 truncation fixes (D1, D2, D3, D5, D6, D7, D8) must hold at **402 pt and 375 pt**. Hot spots:
  - the driver `TopBar` variant
  - the LiveTracking direction pills and panel headers
  - the CommuteHub route-card meta rows
  - the Wallet top-up grid and the ledger rows
  - the Radar map labels
  - the heatmap tiles
  - the long button labels
  - the tab labels (about 75 pt per tab at 375 pt)
  - (v3) Pill badges need 8 px horizontal padding instead of 6, which adds about 4 pt per badge. Re-check the badge rows (route cards, Duty profile card, DriverProfile chips).
  - Required copy must wrap, never truncate.
- **D12 `minHeight` on the broadcast actions row.** Derive it from tokens (`buttonHeightForLines`), not a literal, so the "Reported!" height stays stable.
- **Native chrome in Expo Go** (Q10): a dark system `Alert` is possible when the simulator is in Dark appearance.
- **Splash icon.** `assets/images/splash-icon.png` was designed for a light background. Confirm it is visible on `#F8F9FF`.
- **Material Symbols to MaterialIcons name gaps.** Use the closest MaterialIcons or MaterialCommunityIcons glyph. Record the substitutions in `ICON_MAP` in `Icon.tsx`.
- **Jest:** `@expo-google-fonts/*`, `@expo/vector-icons` and `expo-linear-gradient` are in `transformIgnorePatterns`, and `moduleNameMapper` covers `@/` and `@packages/ui/`.
- **`theme.test.ts` reads DESIGN.md.** v3 has 57 colour keys, including an rgba one, a different `rounded` table and spacing keys `gutter-sm`/`margin-lg`. Its typography is not the app's. The test must read colours, `rounded` and `spacing` from `stitch/DESIGN.md`, and typography from `stitch/DESIGN-v2-dark.md`.
- **Long scroll screens.** Static `ScrollView`s with fewer than 30 cards each. No `FlatList` is needed.
- **Safe areas.** Screens apply only the top inset (via `TopBar`). JS `Tabs` handles the bottom inset. Map overlays sit inside the scroll content.
- **Platform.** Web is not a QA target but must still bundle.
- **Offline / permissions.** No network calls and no permissions are involved.
- **Expo Go automation.** QA uses Expo Go plus the iOS simulator, so every pressable gets a stable `testID` (step 15).

## Implementation steps

Each step is one reviewable commit. Run `npx tsc --noEmit` after every step from step 3 onward.

Steps 1–16 were built in cycle 1. Steps 3, 5, 6 and 9 are edited below to describe the v3 target. The v2 migration (old steps 17–23) was stopped partway. It is **replaced** by the v3 migration list, steps 17–23, which must be done in order.

1. **Tooling: ESLint.**
   - Install `eslint` and `eslint-config-expo` as dev dependencies.
   - Add `eslint.config.js` (flat config, `eslint-config-expo/flat`) that ignores `node_modules`, `.expo`, `dist`, `docs` and `scripts`.
   - Add these rules:
     - `no-restricted-imports`:
       - In `src/screens/commuters/**`, forbid `@/screens/drivers/*` and `**/screens/drivers/**`.
       - In `src/screens/drivers/**`, forbid `@/screens/commuters/*` and `**/screens/commuters/**`.
       - In `packages/**`, forbid `@/*` and any relative import that reaches `src/`.
     - `no-restricted-syntax` on string `Literal`s matching `/^#[0-9a-fA-F]{3,8}$/` or `/^rgba?\(/`, for `src/**` and `packages/**`. It is turned off for `packages/ui/src/theme/**`.
   - Keep the `"lint": "expo lint"` script.
2. **Tooling: Jest.**
   - Install `jest`, `jest-expo`, `@types/jest` and `@testing-library/react-native` (plus its declared peer).
   - Add the `"test": "jest"` script.
   - Add a `jest` config in `package.json`:
     - `preset: "jest-expo"`
     - `moduleNameMapper` for `@/` and `@packages/ui/`
     - `transformIgnorePatterns` from the Expo doc, extended with `@expo-google-fonts/.*`
     - `testPathIgnorePatterns` for `/docs/`
   - Add one smoke test.
3. **Remove the starter template.** *(edited v3)*
   - Delete the files listed under "Removed" and the `import '@/global.css'`.
   - Add a temporary minimal `src/app/_layout.tsx` and `src/app/(auth)/index.tsx` placeholder.
   - `app.json`:
     - `userInterfaceStyle` is `"light"`
     - the top-level `backgroundColor` is `#F8F9FF`
     - the `expo-splash-screen` plugin `backgroundColor` is `#F8F9FF`
4. **TS config and package scaffold.**
   - Create `tsconfig.base.json` (extends `expo/tsconfig.base`, `strict`, paths `@/*`, `@/assets/*`, `@packages/ui/*` → `packages/ui/src/*`).
   - Make `tsconfig.json` extend it and keep `include`.
   - Add `packages/ui/tsconfig.json` (extends `../../tsconfig.base.json`).
   - Confirm Metro resolves the alias.
5. **Theme tokens and fonts.** *(edited v3; every value is in "Design system v3 (light)")*
   - `packages/ui/src/theme/`:
     - `colors.ts`: one light palette made of `designColors` (57 DESIGN.md v3 keys), `brandColors` and `extensionColors` (v3 tables), plus `gradients` (v3 stops).
     - `typography.ts`: unchanged v2 scale, plus `LARGE_TEXT_VARIANTS`.
     - `spacing.ts`: v3 (`xl 32`).
     - `radius.ts`: v3 (`sm 4, base 8, md 12, lg 16, xl 24, full 9999`).
     - `elevation.ts`: `level1`–`level3`, `ctaGlow`, `glowBrand`, `glowLive`, `focusRing`, and `tiers` with `infoBox`.
     - `fonts.ts`: 11 faces.
     - `contrast.ts` and `contrast.test.ts`.
   - `src/constants/theme.ts` re-exports these and exports `fontAssets`.
   - Add `src/utils/currency.ts` and its test.
6. **Base UI primitives in `packages/ui`:** *(edited v3)* `AppText`, `Icon`, `Button`, `IconButton`, `Badge`, `Card`, `GradientCard`, `ScreenScroll`, `TopBar`, `Avatar`, `BalancePill`, `TabBarIcon`, styled per "Component rules (v3)" and the shape table. Each folder has `index.ts`, `styles.ts` and the component. Add one render test each for `Button` (press and disabled) and `Badge`.
7. **Composite UI primitives:** `SectionHeader`, `SegmentedControl` (with a test), `ListRow`, `StatTile`, `ProgressBar` (clamps to 0–1, with a test), `MapCanvas` (+ `RouteSegment`, `MapPin`, `MapCallout`, `PulseDot`), `ComingSoon`.
8. **Types and mock services.**
   - Write `src/types/commuter.ts`, `src/types/driver.ts`, `src/services/mock/*Data.ts`, `src/services/commuterService.ts` and `src/services/driverService.ts`.
   - Write the pure helpers `filterRoutes` and `filterLedger`, with tests.
9. **Navigation shell.** *(edited v3)*
   - Root `_layout.tsx`:
     - `SplashScreen.preventAutoHideAsync().catch(() => {})` (cycle-1 D13)
     - `useFonts(fontAssets)`; hide the splash when loaded or on error (`.catch(() => {})`)
     - **`StatusBar style="dark"`**
     - `ThemeProvider` with the customised **`DefaultTheme`** (see Navigation)
     - `Stack` with `headerShown: false` and `contentStyle: { backgroundColor: colors.canvas }`
   - `(auth)/_layout.tsx` (`Stack`).
   - `(commuters)/_layout.tsx` and `(drivers)/_layout.tsx` (`Tabs` per D1–D3, using `TabBarIcon` and `tabScreenOptions` from `src/constants/navigation.ts`).
   - All 11 route files, each a one-line import and re-export.
10. **RoleSelect and placeholder screens**, each with tests. The RoleSelect test checks that pressing `role-commuter` and `role-driver` calls `router.replace` with `/commute` and `/duty`.
11. **CommuteHub screen**, with the screen-local `RouteCard.tsx` and `ConfirmTrackModal.tsx`. Tests cover:
    - content
    - chip filtering
    - search with the empty state
    - the modal open, confirm and cancel flow
    - Clear Log
12. **LiveTracking screen**, with the screen-local `DirectionPanels.tsx`, `CorridorMap.tsx` and `EtaSheet.tsx`. Tests cover content, the back link, Switch and Refresh.
13. **Wallet screen**, with `TopUpGrid.tsx`, `PaymentChannels.tsx` and `LedgerList.tsx`. Tests cover:
    - content
    - the CTA label after selection
    - the ledger filters
    - the CTA Alert
14. **Driver screens (one commit each):**
    - **14a:** `DutyHub`. Tests: direction toggle, tracking toggle, "Reported!" with fake timers.
    - **14b:** `EarningsPool`. Content test.
    - **14c:** `CorridorRadar`. Content test, and View Pot navigating.
    - **14d:** `DriverProfile`. Content test, GCash switch, End Shift.
15. **Navigation integration tests and testIDs.**
    - `src/__tests__/navigation.test.tsx` uses `renderRouter` from `expo-router/testing-library`.
    - These testIDs must exist:
      - roots: `screen-role-select`, `screen-commute-hub`, `screen-live-tracking`, `screen-wallet`, `screen-activity`, `screen-account`, `screen-duty-hub`, `screen-earnings`, `screen-radar`, `screen-trips`, `screen-driver-profile`
      - `role-commuter`, `role-driver`
      - `filter-all`, `filter-jeepney`, `filter-bus`, `route-search`, `route-card-<code>`, `view-live-<code>`, `confirm-track`, `cancel-track`, `clear-log`, `cash-in-button`
      - `back-to-hub`, `direction-switch`
      - `package-<amount>`, `channel-<id>`, `cashin-cta`, `ledger-filter-<all|views|cashin>`
      - `duty-direction-<apas|colon>`, `tracking-toggle`, `report-delay`
      - `view-pot`, `end-shift`, `switch-role`
16. **Final pass.** Run `npx tsc --noEmit`, `npx expo lint`, `npm test` and `npx expo-doctor`. Then walk through every screen in Expo Go.

### Design system v3 migration (cycle 2, replaces the v2 steps 17–23)

Start state:
- `colors.ts` is v2 dark.
- CommuteHub, LiveTracking and RoleSelect use v2 names.
- The other screens use v1 names.
- `tsc` has about 93 errors.

Steps 17–21 may leave `tsc` red between commits. Land them as one PR with one commit per step. AC1 applies at the end of step 21.

17. **v3 theme tokens and lint.**
    - Replace `packages/ui/src/theme/colors.ts` **as a whole** with the v3 file: the 57 `designColors`, `brandColors`, `extensionColors` and `gradients` from the v3 tables. Update the header comment (light-only, the W1–W4 rule).
    - Rewrite `radius.ts` (v3 table), `spacing.ts` (`xl 32`; comments say `gutter-sm`/`margin-lg`) and `elevation.ts` (v3 exports and `tiers`, including `infoBox`).
    - Add `LARGE_TEXT_VARIANTS` to `typography.ts`. Leave the styles unchanged.
    - Rewrite `contrast.ts`: `SURFACE_TIERS`, default `over: 'surfaceCard'`, and `contrastPairs`, `forbiddenPairs` and `gradientTextColors` per the v3 contrast and gradient tables. Allow an optional `max` on forbidden pairs, for the large-text rows.
    - Rewrite `contrast.test.ts` per the "Contrast" section.
    - Rewrite `theme.test.ts`:
      - Colours: parse the DESIGN.md v3 front matter with hex **and rgba** values. Expect 57 keys and exact values.
      - Overrides: `brand === '#FF5500'`, `onBrand === '#FFFFFF'`, `brandAction === '#FF5500'`, `onBrandAction === '#FFFFFF'`, `live === '#00B37E'`, `liveStrong === '#006C4B'`, `amber === '#F59E0B'`, `amberStrong === '#B45309'`, `canvas === '#F8F9FF'`.
      - Every key matching `/^(surface|background|canvas)/` except `surfaceTint` has relative luminance > 0.6 (light).
      - The removed keys and v2 dark values listed under "Colour tokens" are absent.
      - `gradients` equals the v3 table.
      - `radius` equals the DESIGN.md v3 `rounded` table. `spacing` equals the v3 `spacing` table (keys `gutter-sm`, `margin-lg`).
      - Typography is parsed from `stitch/DESIGN-v2-dark.md`.
      - Elevation keys are `ctaGlow`, `focusRing`, `glowBrand`, `glowLive`, `level1`, `level2`, `level3`.
      - The `tiers` objects match the v3 definitions.
    - `eslint.config.js`:
      - Keep the `colors.primaryContainer` restriction. Change its message to "Use colors.brand (#FF5500) or colors.brandAction".
      - **Add** the accent-text restriction for `src/**` and `packages/**`, turned off in `packages/ui/src/theme/**`. Selectors:
        - `Property[key.name='color'] > MemberExpression[object.name='colors'][property.name=/^(brand|live|amber|crimsonAlert)$/]`
        - `JSXAttribute[name.name='color'] MemberExpression[object.name='colors'][property.name=/^(brand|live|amber|crimsonAlert)$/]`, scoped to `AppText` via `JSXOpeningElement[name.name='AppText']`

        Message: "Accent is non-text only. Use brandStrong / liveStrong / amberStrong / error (neonOrangeDeep for large orange text)."
      - `Icon` `color` props are not restricted, because icons are non-text.
18. **Light app shell.**
    - `app.json`: `"userInterfaceStyle": "light"`, `"backgroundColor": "#F8F9FF"`, splash plugin `"backgroundColor": "#F8F9FF"`. Leave the Android adaptive icon unchanged.
    - `src/app/_layout.tsx`:
      - `StatusBar style="dark"`
      - import `DefaultTheme` instead of `DarkTheme`
      - `navigationTheme = { ...DefaultTheme, dark: false, colors: { ...DefaultTheme.colors, background: canvas, card: surfaceCard, text: onSurface, border: borderSubtle, primary: brand } }`
      - update the comment to "Light-only"
      - keep the D13 `.catch` calls
    - `src/constants/navigation.ts`: the v3 tab options (Navigation section).
19. **`packages/ui` restyle to v3.** Apply "Component rules (v3)" and the shape table to every component:
    - **Small components:**
      - `AppText`: default `onSurface`
      - `Button`: v3 variants, `ctaGlow`, `brandPressed`
      - `IconButton`: tones and radius `base`
      - `Badge`: v3 tone table, `full` radius, padding at least 8; remove `onHigh`
      - `Card`: tiers and `infoBox`, radius `md`
    - **`GradientCard`:** D4 nesting kept, radius `md`, outer view with `borderSubtle` and the `level1` shadow.
    - **Controls:**
      - `SegmentedControl`: selected `brandAction`
      - `ProgressBar`: `full` radius, tones
      - `BalancePill`: `amberTint`/`amberStrong`, `full`
    - **Content components:**
      - `Avatar`: `brandTint`/`brandStrong`, verified `liveStrong`
      - `TopBar`: `surfaceCard`
      - `ListRow`, `StatTile` (radius `base`), `SectionHeader`
    - **Containers and map:**
      - `ScreenScroll`: `indicatorStyle="black"`
      - `MapCanvas` with `RouteSegment`, `MapPin`, `MapCallout` (radius `base`, `level2`) and `PulseDot` (`pulseLive`, `glowLive`)
      - `TabBarIcon`: `brand` dot
      - `ComingSoon`: keep the D9 `alignSelf: 'center'`
    - Update the package tests:
      - `Badge.test.tsx`: the `live` tone expects `liveTint`/`liveStrong`; the route tone expects `brandTint` + `brand` border; the `onHigh` case expects `brandStrong`.
      - `GradientCard.test.tsx`: keep the structure assertions; the outer view asserts radius `md`, `borderSubtle` and the `level1` `boxShadow`.
      - `ProgressBar.test.tsx`: the tone colours.
20. **Commuter screens** (`RoleSelect`, `CommuteHub`, `LiveTracking`, `Wallet`, `Activity`, `Account`).
    - **Re-audit the three v2-migrated screens** against "Silent role changes". In particular:
      - every direct `colors.surfaceContainerLow`/`surfaceContainerHigh` card or sheet fill → `tiers.tier1`/`tier2`
      - every `colors.brand`/`colors.amber` text → `brandStrong`/`amberStrong`
      - every `colors.primary` → `brandStrong`
      - `DirectionPanels` `onHigh ? primary : brand` → `brandStrong`
      - `EtaSheet`: the ETA banner becomes `brandTint` + `brand` border
      - `CorridorMap`: user dot, segments, FAB
      - `ConfirmTrackModal`: `tier2`, radius `lg`, `scrim`
      - the route badges → `route` tone
    - Migrate Wallet, Activity and Account from v1 names: rename variants per the typography table, and replace colour keys per the v2 → v3 mapping.
    - Search `TextInput`: `placeholderTextColor={colors.textMuted}`, `selectionColor`/`cursorColor` `brand`, **`keyboardAppearance="light"`**, `brand` focus border + `focusRing`, full radius.
    - Keep every cycle-1 layout fix:
      - D1: `flexWrap` on the unit row
      - D6: `flex: 1` pills with no `ScrollView`
      - D8: non-overlapping map labels
      - D11: service-driven values
21. **Driver screens** (`DutyHub` + local parts, `EarningsPool`, `CorridorRadar` + `RadarMap`, `DriverProfile`, `Trips`).
    - Same as step 20, plus:
      - the `Switch` colours
      - the DESIGN timeline for waypoints
      - the heatmap tile tones
      - the reference-image semantics for Duty (green badges, teal broadcast, `infoBox` boxes, orange-tint earnings card, `brandAction` segment and "Payout Log", large `neonOrangeDeep` metrics)
      - `danger` for "SOS Dispatch"
    - Keep these cycle-1 fixes:
      - D2: the driver name uses `headlineSm` with `numberOfLines` ≥ 2
      - D3: `numberOfLines` ≥ 2 on the banner title and the telemetry value
      - D5: `flexShrink: 1` on the next stop
      - D7: the payout label row wraps
      - D11: `fullInitials`
      - D12: a stable broadcast actions height, derived from tokens
    - `DutyHubScreen.test.tsx` asserts `fontSize: typography.headlineSm.fontSize` and keeps its `numberOfLines` assertion.
    - At the end of this step: `npx tsc --noEmit` exits 0 and `npx expo lint` exits 0.
22. **Font-role and light-mode tests.** Add `src/__tests__/design-system.test.tsx` (or extend the screen tests):
    - **Fonts:**
      - RoleSelect "JeepTrack Live" uses a `SpaceGrotesk_` family.
      - "Saan ang biyahe mo ngayon?" uses `HankenGrotesk_`.
      - "TXN-83910", Radar "28" and a tab label use `JetBrainsMono_`.
    - **Brand fills and text:**
      - "Confirm & Track (₱1)" has `backgroundColor: colors.brandAction` and a label colour of `colors.onBrandAction`.
      - No rendered `AppText` inside a `brand`-filled view has `color` `#FFFFFF` unless its variant is in `LARGE_TEXT_VARIANTS`.
    - **Backgrounds:**
      - Each screen root's background is `colors.canvas`.
      - The tab bar `backgroundColor` is `colors.surfaceCard`.
    - **Semantic colours:**
      - Duty "Active Duty" text is `colors.liveStrong`.
      - The broadcast card's `GradientCard` preset is `broadcast`.
      - The daily-earnings card's preset is `dailyEarnings`.
      - "₱68.5" is `colors.neonOrangeDeep` with variant `metricDisplay`.
23. **v3 visual and truncation pass at 402 pt and 375 pt.**
    - Run `npx tsc --noEmit`, `npx expo lint`, `npm test -- --watchAll=false` and `npx expo-doctor`.
    - Run Expo Go on a 402 pt-wide and a 375 pt-wide iOS simulator, each in Light and then Dark system appearance.
    - Walk every screen and compare DutyHub with `drivers-duty-hub-light-reference.png`.
    - Fix truncation or overlap, especially in the AC42 strings and the pill badge rows.
    - Confirm there is no dark flash on launch, role switch or tab switch.


### Revision 4: Live Map route options (user request, 2026-11-10)

The user marked a region of the Live Map bottom sheet (`stitch/live-tracking-annotation.webp`) and asked for it to follow a new layout (`stitch/live-tracking-route-options.png`).

- **Replace** in `EtaSheet.tsx` everything from the orange "UNLOCKED ARRIVAL ETA" banner down to and including the driver card: the ETA banner, the route-tag row ("ROUTE 17B" / "Modern Jeep" / "GMD-1782"), the route description line, the two direction pills, and the driver card.
- **Keep**, unchanged and in the same order: the sheet handle, `DirectionPanels`, the GPS row, the pass card and the Refresh / Signal / Switch actions. Direction state stays in `LiveTrackingScreen`, and "Switch" still toggles it.
- **New screen-local component** `src/screens/commuters/LiveTracking/RouteOptions.tsx` (styles in the screen's `styles.ts`). It renders a vertical list of three tappable route-option cards. Each card has:
  - a left route-code tile: a rounded 8 px square with a mono bold code
  - the route name: Hanken Grotesk, bold, `onSurface`
  - a pill badge in mono caps
  - a muted subtitle
  - on the right, a large ETA value with a small mono caption under it
- **Data** comes from the commuter service, not the screen. Add a typed `RouteOption` to `src/types/commuter.ts` and a mock list plus a getter in the commuter service/mocks:
  - `17D`, "Route 17D", badge "BEST OPTION", subtitle "Alternative route · 1 vehicle approaching", ETA "5 min", caption "ETA"
  - `44B`, "Route 44B", badge "ALTERNATIVE", subtitle "2 vehicles approaching", ETA "9 min", caption "ETA"
  - `17B`, "Route 17B", badge "YOUR PREFERRED ROUTE", subtitle "1 vehicle approaching", ETA "18 min", caption "18m left"
- **Tones**, all from theme tokens and with no hex outside `theme/`:
  - **Best option:** solid `brand` code tile with white text, solid `brandAction` badge with white text, ETA in `neonOrangeDeep` (large text, W3).
  - **Alternative:** `ink` code tile with white text, neutral grey pill badge, ETA in `onSurface`.
  - **Preferred:** light-blue/cyan code tile with white text, light-blue tinted pill badge with blue text, and a blue ETA. Use or add tokens that reach AA for the blue text on its tint and on white. Add the pairs to `contrastPairs` and `contrast.test.ts`.
- **Selection.** One card is selected at a time, with local state in `RouteOptions` and `17D` selected by default. The selected card has a `brandTint` fill and a 2 px `brand` border; unselected cards are white with a 1 px `borderSubtle` border. Corners are 12 px. Tapping a card selects it. Each card has `accessibilityRole="radio"` and `accessibilityState={{ checked }}`, and the list has `accessibilityRole="radiogroup"`.
- **Layout.** Nothing is truncated at 402 pt or 375 pt. The name and badge row wraps if it must, and the ETA column has a fixed minimum width.
- **testIDs:** `route-options`, `route-option-<code>` (e.g. `route-option-17D`), `route-option-<code>-eta`.
- **Tests:**
  - Update `LiveTrackingScreen.test.tsx`: the removed elements (`eta-box`, `direction-selector`, `thank-driver`) are gone, the three options render with their copy, 17D is checked by default, pressing 44B checks it and unchecks 17D, and direction panels and Switch still work.
  - Remove or update any design-system test that asserted the removed ETA banner or route badges on this screen.

## Acceptance criteria

### Quality gates

- **AC1:** `npx tsc --noEmit`, run from `para/`, exits 0 with zero errors. This includes `packages/ui`.
- **AC2:** `npx expo lint`, run from `para/`, exits 0 with zero errors.
  - `para/eslint.config.js` exists and extends `eslint-config-expo`.
  - It contains the role-isolation `no-restricted-imports` rules, the colour-literal `no-restricted-syntax` rule from step 1, and the `colors.primaryContainer` restriction.
- **AC3:** `npm test`, run from `para/`, exits 0.
  - `package.json` has `"test": "jest"`, and the Jest config uses `preset: "jest-expo"`.
  - There is at least one passing test file for each of the 11 screens, plus `currency`, `filterRoutes`, `filterLedger`, `SegmentedControl`, `ProgressBar`, `Button`, and the navigation integration test.
- **AC4:** `npx expo-doctor` reports no dependency-version mismatch for any package added in this feature.
- **AC5:** Expo Go compatibility. *(edited v3)*
  - `package.json` does not contain `react-native-maps` or any package outside Expo Go's bundled set.
  - `package.json` dependencies are unchanged by revision 3. In particular, `@expo-google-fonts/plus-jakarta-sans` and `@expo-google-fonts/inter` are absent.
  - Given the app is opened in Expo Go on the iOS simulator, when it launches, then no red-box error or "native module not found" warning appears.
  - The role select screen renders on the light `#F8F9FF` background, with dark text, Space Grotesk headings and JetBrains Mono labels rather than the system font.

### Structure and conventions

- **AC6:** None of these exist: `src/app/explore.tsx`, `src/global.css`, `src/components/` (or it contains no starter files), `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme*.ts`. No file imports them.
- **AC7:** Route files.
  - The 11 route files listed in D7 exist, plus the four layouts.
  - Each non-layout route file contains only an import and re-export of one screen.
  - `(commuters)` route files import only from `@/screens/commuters/`, `(drivers)` only from `@/screens/drivers/`, and `(auth)` only from `@/screens/shared/`.
- **AC8:** Screen folders.
  - Each of the 11 screen folders contains `index.ts`, `styles.ts` and `<Name>Screen.tsx`.
  - No `*Screen.tsx` file calls `StyleSheet.create` or passes a literal style object (`style={{`).
- **AC9:** Role isolation. A search for `screens/drivers` inside `src/screens/commuters/` returns no matches, and the reverse also returns none. Lint (AC2) enforces this.
- **AC10:** `packages/ui`.
  - Nothing under `packages/` imports `@/` or a path into `src/`.
  - Every component folder has `index.ts`, `styles.ts` and `<Name>.tsx`.
  - `@packages/ui/*` is mapped in the tsconfig and in Jest's `moduleNameMapper`.
- **AC11:** Tokens match DESIGN.md v3, with the user's overrides. *(edited v3)*
  - **`colors.ts`, DESIGN keys:** defines all 57 colour keys from `stitch/DESIGN.md`'s front matter (camelCased) with the exact values. Examples: `surface #f8f9ff`, `surfaceContainerLow #eff4ff`, `surfaceContainer #e5eeff`, `onSurface #0b1c30`, `primary #a63b00`, `tertiary #006c4b`, `neonOrangeDeep #ea5200`, `emeraldActive #00b37e`, `amberFare #f59e0b`, `crimsonAlert #e11d48`, `surfaceCard #ffffff`, `neonOrangeGlow rgba(255, 94, 0, 0.28)`.
  - **`colors.ts`, overrides and semantic tokens:** `brand #FF5500`, `onBrand #FFFFFF`, `brandAction #FF5500`, `onBrandAction #FFFFFF`, `brandPressed #EA5200`, `brandStrong #A63B00`, `live #00B37E`, `liveStrong #006C4B`, `amber #F59E0B`, `onAmber #0B1C30`, `amberStrong #B45309`, `ink #0F172A`, `onDark #FFFFFF`, `canvas #F8F9FF`, and every extension token in the v3 table.
  - **Removed keys:** `cyan`, `cyanTint`, `onCyan`, `pulseCyan`, and the v1 hue-named keys do not exist. No v2 dark value (`#0a0e17`, `#0f131c`, `#181b25`, `#1c1f29`, `#262a34`, `#31353f`, `#dfe2ef`) appears in the theme.
  - **`typography.ts`:** the 12 v2 styles with the sizes, line heights and px letter-spacing of `stitch/DESIGN-v2-dark.md`, plus only `labelAction` and `metricDisplay`. It exports `LARGE_TEXT_VARIANTS`.
  - **`radius.ts`:** `sm 4, base 8, md 12, lg 16, xl 24, full 9999`, equal to the DESIGN.md v3 `rounded` table.
  - **`spacing.ts`:** matches the DESIGN.md v3 `spacing` table (`xl 32`).
  - **`elevation.ts`:** exports exactly `level1`, `level2`, `level3`, `ctaGlow`, `glowBrand`, `glowLive`, `focusRing` and `tiers` (`canvas`, `tier1`, `tier2`, `infoBox`).
  - `src/constants/theme.ts` re-exports them.
  - No hex or `rgb(a)` colour literal appears in `src/**` or in `packages/ui/src/**` outside `packages/ui/src/theme/`.
  - `theme.test.ts` (step 17) passes.
- **AC12:** Fonts. *(edited v3)*
  - The root layout loads Space Grotesk 500/600/700, Hanken Grotesk 400–700 and JetBrains Mono 400–700 via `useFonts(fontAssets)`, and keeps the splash visible until the fonts are loaded or failed.
  - Families by role:
    - display and headline tokens: `SpaceGrotesk_*`
    - body tokens and `labelAction`: `HankenGrotesk_*`
    - `labelTelemetry`, `labelEta`, `labelBadge` and `metricDisplay`: `JetBrainsMono_*`
  - No typography token sets `fontWeight`.
  - Although DESIGN.md v3 names Plus Jakarta Sans / Inter, a search for `PlusJakartaSans`, `Plus Jakarta`, `Inter_` and `fontFamily: 'Inter'` in `src/` and `packages/` returns no matches, and `package.json` lists neither package.
- **AC13:** Icons. All icons render through `@packages/ui/Icon` (`@expo/vector-icons`). No PNG tab icons remain, and `assets/images/tabIcons/` is deleted.
- **AC14:** Mock data lives in `src/services/mock/` and is typed by `src/types/`. Screen files contain no inline arrays of domain data.
- **AC15:** Light-only configuration. *(edited v3; was "Dark-only")*
  - `app.json` has `"userInterfaceStyle": "light"`, a top-level `"backgroundColor": "#F8F9FF"`, and the `expo-splash-screen` plugin `backgroundColor` `"#F8F9FF"` (no `dark` sub-key).
  - The root layout renders `StatusBar` with `style="dark"`. It wraps navigation in a `ThemeProvider` whose theme spreads `DefaultTheme` with `dark: false`, `colors.background === colors.canvas` and `colors.card === colors.surfaceCard`. `DarkTheme` is not imported anywhere.
  - `colors.ts` exports a single palette. Nothing named `dark`, `colorSchemes` or `darkColors` exists in the theme.
  - Given the simulator is switched between Light and Dark appearance, then no screen's app-drawn colours change.

### Navigation

- **AC16:** Given a fresh launch, when the splash hides, then the screen at `/` (`screen-role-select`) shows "JeepTrack Live", "I'm a commuter" and "I'm a driver".
- **AC17:** Given role select, when the user taps "I'm a commuter", then the Commute Hub (`screen-commute-hub`) shows. The tab bar shows exactly five tabs labelled, in order, "Commute", "Live Map", "Activity", "Wallet", "Account", with "Commute" active.
- **AC18:** Given role select, when the user taps "I'm a driver", then the Duty Hub (`screen-duty-hub`) shows. The tab bar shows exactly five tabs labelled, in order, "Duty", "Earnings", "Radar", "Trips", "Profile", with "Duty" active.
- **AC19:** Tab switching and styling. *(edited v3)*
  - Given either role's tabs, when the user taps each tab in turn, then the matching screen root testID appears.
  - The active tab's label uses `colors.brandStrong` (`#A63B00`). Its icon and indicator dot use `colors.brand` (`#FF5500`).
  - Inactive tabs use `colors.textMuted` (`#475569`) and show no dot.
  - The tab bar background is `colors.surfaceCard` (`#FFFFFF`) with a 1px `colors.borderSubtle` (`#E2E8F0`) top border. The scene background is `colors.canvas`.
  - The tab labels use JetBrains Mono (`labelBadge`), and all five labels are fully visible at 375 pt.
- **AC20:** Placeholders. Given the commuter Activity or Account tab, or the driver Trips tab, when it opens, then it shows its title, an icon, and the text "Coming soon", in the role's top-bar style.
- **AC21:** Exiting a role.
  - Given the commuter Account tab, when the user taps "Switch role", then role select shows.
  - Given the driver Profile tab, when the user taps "End Shift & Submit Daily Manifest", then role select shows.
  - In both cases, back does not return to the previous role's tabs.

### Commute Hub

- **AC22:** Given the Commute Hub, then all of these are visible, with the design's copy, after scrolling:
  - "Mabuhay, Maria!"
  - the search input placeholder
  - chips "All Transit (24)" and "Jeepneys Only (16)"
  - the balance card with "₱45.00", "45 instant live views available" and "Cash-in"
  - "Approved Transit Routes"
  - four route cards ("Cubao — Divisoria", "Fairview — PITX", "Monumento — Baclaran", "Pasig Palengke — Quiapo"), each with its code, corridor distance and stops, and base fare
  - "Recent Viewing Activity"
  - "Walay Driver = ₱0 Deduction Guarantee"
- **AC23:** Given the Commute Hub:
  - When the user taps "Jeepneys Only", then "Fairview — PITX" is hidden and the three jeepney routes remain.
  - When the user taps the bus chip, then only "Fairview — PITX" remains.
  - When the user taps "All Transit", then all four show again.
- **AC24:** Given the Commute Hub:
  - When the user types "PITX" in search, then only "Fairview — PITX" is listed.
  - When the user types "zzz", then "No routes match your search" shows and no route cards render.
- **AC25:** The "Pasig Palengke — Quiapo" card shows "0 on road (Offline)", "Walay Available Driver" and "₱0 (No Charge)". Its "No Charge (₱0)" button has `accessibilityState.disabled === true`, and the card has no "View Live (₱1)" button.
- **AC26:** Confirm drawer.
  - Given an active route card, when the user taps "View Live (₱1)", then a drawer shows the route name, "GPS View Access ₱1.00", "Wallet Remaining After ₱44.00", "Cancel" and "Confirm & Track (₱1)".
  - "Cancel" closes the drawer and stays on the hub.
  - "Confirm & Track (₱1)" closes the drawer and opens the Live Map tab.
- **AC27:** Given the Commute Hub:
  - When the user taps "Cash-in" or the ₱45.00 balance pill, then the Wallet tab opens.
  - When the user taps "Clear Log", then the recent row disappears and "No recent views yet" shows.
  - When the user taps "Re-open" (before clearing), then the Live Map tab opens.

### Live Tracking

- **AC28:** Given the Live Map tab, then all of these are visible after scrolling:
  - "Commute Hub" and "Live Corridor"
  - "ROUTE 17B", "IT Park ⇄ Carbon (via Escario)" and "4 Vehicles Active"
  - "Unit 14", "4m away", "Unit 23" and "3m (Tracked)"
  - "Go to pickup point", "GMD-1782", "Making 1 stop first" and "SAFETY CENTRE"
  - "UNLOCKED ARRIVAL ETA", "3 MINS" and "ON SCHEDULE"
  - "Mang Ernesto Santos", "4.9" and "2,410 safe trips"
  - "Last GPS: 3s ago" and "VERIFIED RTK"
  - "Refresh", "Signal Stale" and "Switch"
- **AC29:** Given the Live Map tab:
  - When the user taps "Switch", then the selected direction pill moves from "Towards Colon…" to "Towards Apas…", and tapping again restores it.
  - When the user taps "Refresh", then the last-GPS text reads "just now".
  - When the user taps "Commute Hub", then the Commute tab is active.
- **AC30:** The map area uses `MapCanvas` (Views only). No file imports `react-native-maps`, `expo-maps` or `expo-location`.

### Wallet

- **AC31:** Given the Wallet tab, then all of these are visible after scrolling:
  - "COMMUTER TRANSIT CREDITS", "₱45.00", "Active Pass" and "Equates to 45 vehicle live tracking sessions"
  - "Top-Up Commuter Wallet" and "Zero Fee Promo"
  - packages ₱20, ₱40, ₱50 (with "POPULAR") and ₱100 (with "BEST VALUE")
  - channels GCash, Maya, ShopeePay and 7-Eleven
  - "Transit Ledger" with "All (18)", "Views (-₱1)" and "Cash-In (+₱)"
  - four ledger rows with amounts "-₱1.00", "-₱1.00", "+₱50.00" and "₱0.00", and refs "TXN-83910", "TXN-83742", "CAS-19402" and "REV-00214"
  - "100% Fair-Transit Guarantee"
- **AC32:** Given the Wallet tab, the CTA reads "Cash In ₱50 via GCash" by default, with ₱50 and GCash marked selected. When the user taps ₱100 and then Maya, then the CTA reads "Cash In ₱100 via Maya", and only those two items are marked selected.
- **AC33:** Given the Wallet tab:
  - When the user taps "Views (-₱1)", then only the three view entries show.
  - When the user taps "Cash-In (+₱)", then only "Cash-in via GCash" shows.
  - When the user taps "All (18)", then all four show.
- **AC34:** Given the Wallet tab, when the user taps the CTA, then an alert titled "Demo only" appears, and the balance stays "₱45.00".

### Duty Hub

- **AC35:** Given the Duty tab, then all of these are visible after scrolling:
  - "DRIVER HUB", and "ON DUTY" with "DRV-0042"
  - "Mang Ernesto Santos", "4.9", "Verified Driver", "Jeepney #08 • NDF-4821" and "ACTIVE ASSIGNMENT"
  - "Route 17B Direction" with "LIVE GPS ACTIVE"
  - "BROADCASTING LIVE", "94%", "GPS Ping: Every 6s", "Stop Tracking" and "Report Delay / Issue"
  - "Route 17B Escario Corridor Live" and "Speed: 22 km/h"
  - "Daily Duty Base Support", "₱20.0" and "18 / 30 Days"
  - "Route View Bonus Pool Sharing", "194 / 100 VIEWS" and "₱48.5"
  - "TODAY'S INSTANT DAILY EARNINGS", "₱68.5" and "Payout Log"
  - "Dispatcher Support" and "Call Hotline"
- **AC36:** Given the Duty tab, the direction defaults to To Apas:
  - badge "OUTBOUND • TO APAS"
  - "Next Stop: N. Escario Central (Parklane)"
  - mini-map overlay "14 Waiting"

  When the user taps "To Colon (Carbon)" or "Switch", then:
  - the badge reads "INBOUND • TO COLON"
  - the next stop reads "Fuente Osmeña Circle / Bogo Bus"
  - the waypoints start at "Apas IT Park"
  - the overlay reads "Fuente Osmeña Circle - 280m" with "22 Waiting"
- **AC37:** Given the Duty tab:
  - When the user taps "Stop Tracking", then the status reads "TRACKING PAUSED" and the button reads "Resume Tracking". Tapping again restores "BROADCASTING LIVE" and "Stop Tracking".
  - When the user taps "Report Delay / Issue", then it reads "Reported!" and reverts after about 2.2 s.

### Earnings, Radar, Profile

- **AC38:** Given the Earnings tab, then all of these are visible after scrolling:
  - "DRV-0042", "Mang Ernesto", "ON DUTY" and "₱1,420.50"
  - "Corridor Pool Active & Earning"
  - "TODAY'S ESTIMATED TOTAL", "₱682.50" and "+13.7%"
  - "Instant GCash Cash-in"
  - "Shift Breakdown Logic", "Guaranteed Base Duty Wage", "₱600.00", "Shared Route 17B Bonus Pool" and "₱82.50"
  - "165% UNLOCKED"
  - "Unit & Pool Telemetry", "412 Commuter Unlocks", "20 Drivers On-Duty" and "Tier 2 Unlocked"
  - "Recent Disbursements", "₱14,840.00", "₱710.00" and "₱665.00"
  - "Verified LTFRB Fleet Partnership"
- **AC39:** Given the Radar tab, then all of these are visible after scrolling:
  - "RTK LOCK 99.8%", "GMD-1782" and "UNIT #23"
  - "Headway: +4m 12s ideal", "YOU • 28 km/h", "ESCARIO CENTRAL", "18 pax" and "Capitol Stop"
  - "Live Stop Demand Heatmap" with "32", "18" and "14"
  - "SPEED TELEMETRY", "28" and "SAFE"
  - "SEATING MANIFEST", "15" and "/ 23 pax"
  - "Escario Central Mall" and "2m 40s"
  - "412 Commuter Views" and "View Pot"
  - "Report Hazard / Baha", "Terminal Check-In" and "SOS Dispatch"

  When the user taps "View Pot", then the Earnings tab is active.
- **AC40:** Given the Profile tab, then all of these are visible after scrolling:
  - "Ernesto V. Santos", "Active Master", "4.9" and "2,410 safe trips"
  - the three certification chips
  - "96.4%", "8.2 hrs" and "92/100"
  - "Assigned Unit & Route", "GMD-1782" and "Isuzu NLR Class 2"
  - "Cooperative & Payouts", "GCash Transit Wallet", "0917-882-9421" and "₱42,150.00"
  - "Compliance & Document Vault", "3 / 3 Valid" and the three document rows
  - "End Shift & Submit Daily Manifest"

  When the user toggles the GCash switch, then its value flips.

### Layout and safe areas

- **AC41:** Safe areas.
  - Given an iPhone with a notch or Dynamic Island, then on every screen the top bar content sits below the status bar.
  - The last scroll content stays visible above the tab bar.
  - The tab bar sits above the home indicator.
  - On role select, the content clears both insets.
- **AC42:** No truncation or overlap at 402 pt and 375 pt, with the v2 fonts and the v3 theme. *(edited v2; v3 note added)*
  - Given a 402 pt-wide and a 375 pt-wide simulator, then no screen has horizontally clipped or overlapping text.
  - Only strings the design itself truncates may end in an ellipsis.
  - No horizontal scroll appears, except on the commuter filter chips and the payment and stop rows that scroll in the design.
  - These cycle-1 strings render in full (wrapping is allowed) at both widths:
    - "Unit 23" (D1)
    - "Mang Ernesto Santos" on Duty (D2)
    - "Corridor Pool Active & Earning" and "412 Commuter Unlocks" (D3)
    - "Fuente Osmeña Circle / Bogo Bus" including the " /" (D5)
  - At both widths, the other cycle-1 layout fixes still hold:
    - both LiveTracking direction pills are visible side by side after "Switch" (D6)
    - the VERIFIED badge is clear of the GCash switch (D7)
    - no map labels overlap on LiveTracking or Radar (D8)
    - the "Coming soon" badge is centred (D9)
    - the broadcast card height does not jump on "Reported!" (D12)
  - (v3) With the full-pill badges, the badge rows on the route cards, the Duty profile card and the DriverProfile certification chips wrap rather than clip.
  - QA attaches 375 pt screenshots for every screen.
- **AC43:** Accessibility and testIDs.
  - Every pressable element has `accessibilityRole="button"` (or `tab` or `switch`) and an accessible label.
  - The testIDs listed in step 15 exist.
  - (v3) Every `ProgressBar` sets `accessibilityValue` and has its value in adjacent text (Q14).

### Design system v3 (revision 3; AC44–AC50 replace the v2 versions)

- **AC44:** Light-only appearance on every screen, with no dark surfaces left over. *(edited v3)*
  - Given each of the 11 screens, plus the confirm drawer, the paused broadcast state and each tab bar, with the simulator in Light and then Dark appearance, then:
    - every app-drawn background (screen, cards, sheets, modal, top bar, tab bar, map canvas, inputs, chips, segmented controls, progress tracks) is a v3 light surface, a v3 tint, or one of the deliberate saturated fills (`brand`, `brandAction`, `amber`, `liveStrong`, `crimsonAlert`, `ink`, the teal and slate gradients)
    - no near-black panel appears, other than the `ink` `tonal-dark` button and the slate paused card
    - there is no dark flash on launch, role switch or tab switch
    - the status bar content is dark
  - In code:
    - every `surface*`, `background` and `canvas` token (except `surfaceTint`) has relative luminance > 0.6 (`theme.test.ts`)
    - each screen root and `ScreenScroll` use `colors.canvas`
    - every `TextInput` sets `keyboardAppearance="light"` and `placeholderTextColor={colors.textMuted}`
    - `ScreenScroll` sets `indicatorStyle="black"`
    - the GCash `Switch` sets `trackColor`, `ios_backgroundColor` and `thumbColor` from tokens
    - the modal backdrop uses `colors.scrim`
  - A grep in `src/` and `packages/` for `keyboardAppearance="dark"`, `indicatorStyle="white"`, `DarkTheme` and `style="light"` returns nothing.
  - The native `Alert` is excluded only if Expo Go ignores `userInterfaceStyle` (Q10). QA notes it.
- **AC45:** `#FF5500` is the primary brand colour, and orange is applied per the white-on-orange rule. *(edited v3)*
  - `colors.brand === '#FF5500'`. No file outside `packages/ui/src/theme/` reads `colors.primaryContainer` (lint).
  - These use `colors.brand`:
    - the active tab icon and dot
    - the RoleSelect and TopBar brand mark tile (white icon)
    - the tracked route segment and the vehicle and "YOU" pins on both maps
    - the `route` badge border
    - the selected borders on packages, channels and direction pills
    - the ETA banner border
    - the focused search border
    - the GCash `Switch` on-track
  - These use `colors.brandAction` fill with `colors.onBrandAction` label and icon:
    - the `Button` `primary` variant ("View Live (₱1)", "Confirm & Track (₱1)", the Wallet CTA, "Payout Log")
    - the `brandSolid` badge
    - the selected `SegmentedControl` option and the selected filter chip
  - Given the Commute Hub, the "View Live (₱1)" button renders bright orange (`#FF5500`) with a bold white label (user decision W2). When pressed, it renders `#EA5200`.
  - No v1 red (`#DC2626`, `#b70011`, `#bf0715`) and no DESIGN `#ff5e00` appears in `src/` or `packages/` outside the theme's `designColors`.
- **AC46:** WCAG AA contrast. *(edited v3)*
  - `contrast.test.ts` passes. For every pair in `contrastPairs` it asserts:
    - **Body and required text reach at least 4.5:1.** This covers:
      - `onSurface` and `textMuted` on every surface tier and tint
      - `onBrandAction` on `brandAction` and `brandPressed`: **≥ 3.0 only** (user-accepted exception, Q12/W2)
      - `brandStrong` on every surface tier, `brandTint` and `primaryFixed`
      - `liveStrong` on `surfaceCard`, `liveTint` and `surfaceContainer`
      - `amberStrong` on `surfaceCard`, `canvas`, `surfaceContainerLow`, `amberTint` and `brandTint`
      - `error` on `surfaceCard`, `errorTint` and `errorContainer`
      - `onDark` on `crimsonAlert`, `ink`, `liveStrong`, and the teal and slate stops
      - `onAmber` on both `viewsAmber` stops
      - `secondary` on `surfaceContainer`
      - `mapLabel` on `mapLand` and `surfaceBg`
    - **Large text reaches at least 3:1:** `neonOrangeDeep` on `surfaceCard`, `canvas`, `surfaceContainerLow`, `brandTint`, `surfaceContainer`, and the `dailyEarnings` stops.
    - **Each gradient preset's text colours reach their minimum against both stops**, including `onDark` over `glassFill` on the teal top stop.
    - **Required non-text graphics reach at least 3:1:** `brand` on `surfaceCard` (active tab icon and dot, selected borders), white on `brand` (pin and brand-mark glyphs), `liveStrong` on `mapLand` (user dot), and `tertiaryFixed` on the teal stops (broadcast live dot).
  - `forbiddenPairs` asserts these stay below their threshold:
    - white on `brand` and on `neonOrangeDeep` (text, < 4.5)
    - `brand`, `live`, `amber` and `crimsonAlert` as text on their surfaces (< 4.5)
    - `amberStrong` on `surfaceContainer` and `surfaceContainerHigh` (< 4.5)
    - `neonOrangeDeep` on `surfaceContainerHighest` (< 3)
    - `textSubtle` on `surfaceContainer` (< 4.5)
  - Lint (step 17) rejects `colors.brand`, `colors.live`, `colors.amber` and `colors.crimsonAlert` as an `AppText` `color` prop or a style `color` value anywhere in `src/**` and `packages/**`.
  - White text appears on `brand` only in `LARGE_TEXT_VARIANTS` styles (step 22 test). In this feature, `brand` fills carry icons only.
- **AC47:** The fonts are applied per role (unchanged roles). *(edited v3)*
  - AC12 holds.
  - Given rendered screens in Jest (step 22):
    - RoleSelect's "JeepTrack Live" and every screen and section title use `SpaceGrotesk_*`.
    - Body copy uses `HankenGrotesk_*`.
    - Codes, plates, ETAs, prices, ledger refs, badges, chips and tab labels ("TXN-83910", "GMD-1782", "3 MINS", "28", "LIVE") use `JetBrainsMono_*`.
  - Given the app in Expo Go, then all visible text is in the three custom families, with no system-font fallback and no Plus Jakarta Sans or Inter.
- **AC48:** Shapes follow DESIGN.md v3 (ROUND_EIGHT), as checked against the reference image. *(edited v3)*
  - These use `radius.base` (8): `Button`, `IconButton`, `SegmentedControl` container and options, brand-mark and icon tiles, `tiers.infoBox` boxes, `StatTile`, `MapCallout` and map frames.
  - These use `radius.md` (12): `Card` and both the outer and clip views of `GradientCard`.
  - These use `radius.lg` (16): the confirm modal and the LiveTracking sheet top corners.
  - These use `radius.full`: `Badge` (every tone, including `route`), filter chips, `BalancePill`, the "ON DUTY" chip, the search input, `ProgressBar` track and fill, the recenter FAB, `Avatar`, `PulseDot`, `MapPin`, status dots, the user dot, timeline nodes and the `TabBarIcon` dot.
  - `IconButton` is 48×48. No component uses a literal `borderRadius` number.
- **AC49:** The semantic colour mapping matches the light reference image. *(edited v3)*
  - **Green (`liveTint` + `liveStrong`, dot `live`):**
    - Duty "Active Duty", "Verified Driver", "Credited Daily" (text `liveStrong`) and "LIVE GPS ACTIVE"
    - "LIVE", "LIVE RADAR", "Verified Drivers Only", "VERIFIED RTK", "SAFE", "ON SCHEDULE", "Steady Flow", "Zero-Risk"
    - the positive amounts "+₱50.00" and "+13.7%" (`liveStrong` text)
    - the Duty base-support progress fill (`live`)
  - **Teal `broadcast` gradient:** Duty "BROADCASTING LIVE" and the Earnings pool banner, both with `onDark` text and `glass` buttons. Paused uses the slate `broadcastPaused`.
  - **Orange tint:** Duty "TODAY'S INSTANT DAILY EARNINGS" (`dailyEarnings`) and Wallet credits (`credits`). Large amounts use `neonOrangeDeep` on `dailyEarnings` and `brandStrong` on `credits`.
  - **Light-blue info boxes (`tiers.infoBox`):** the Duty vehicle row, direction detail, qualified box, formula box and condition box; the CommuteHub balance-card inner box; and the EarningsPool formula box.
  - **Orange for the active tab and CTAs:** AC19 and AC45.
  - **Light map:** `MapCanvas` ground `mapLand #F1F5F9`, roads `mapRoad #FFFFFF`, labels `mapLabel`; route segments `live`/`amber`/`brand` only; user dot `liveStrong`; recenter FAB `surfaceCard` with an `ink` icon.
  - **Amber:** `BalancePill`, the balance card, "₱1 / view", top-up badges, the pool amount "₱82.50", the views card (`viewsAmber`) and `fare` buttons. Text is `amberStrong`; fills are `amber`.
  - **Error:** "SOS Dispatch" uses `danger` (`crimsonAlert` + `onDark`); "Signal Stale" uses `danger-soft`.
  - **Offline:** `textMuted` text and a dashed `borderStrong` border.
  - The `Badge` tone union contains `brand`, `brandSolid`, `route`, `fare`, `fareSolid`, `live`, `liveSolid`, `neutral`, `offline`, `info`, `error` and `glass`, and no `onHigh` prop.
- **AC50:** Gradient cards use the v3 stops and keep the cycle-1 fix. *(edited v3)*
  - `gradients` in `colors.ts` equals the v3 table:
    - `credits ['#FFF1E8', '#FFDBCE']`
    - `broadcast` and `poolBanner ['#0E7490', '#115E59']`
    - `broadcastPaused ['#475569', '#334155']`
    - `viewsAmber ['#F59E0B', '#FBBF24']`
    - `dailyEarnings ['#FFFFFF', '#FFF1E8']`
    - `radarMap ['#F8FAFC', '#F1F5F9']`

    Hex values compare case-insensitively.
  - Given Wallet, Duty (live and paused), Earnings and Radar, then each gradient card shows its v3 hue family and has 12 px rounded corners on iOS, with the soft `level1` shadow visible outside the rounded corners (D4 nesting kept). Its text is readable per AC46.
  - `GradientCard.test.tsx` passes, with its structure assertions.
- **AC51:** Cycle-1 regression tests are kept.
  - Every regression test added in fix cycle 1 still exists and passes:
    - LiveTracking: unit-row wrap and side-by-side pills
    - DutyHub: driver name, with the `fontSize` assertion `typography.headlineSm.fontSize`
    - EarningsPool: `numberOfLines` ≥ 2
    - `GradientCard`: structure
    - `ComingSoon`: centred badge
    - CommuteHub and DriverProfile: service spies
  - No test is deleted or skipped. A search for `.skip` and `.only` in test files returns nothing.
- **AC52 (new in v3):** No silent v2 role leftovers.
  - Outside `packages/ui/src/theme/`, a grep returns no matches for:
    - `colors\.(cyan|cyanTint|onCyan|pulseCyan)\b`
    - `glowCyan`, `focusCyan`
    - `colors\.(tertiary|tertiaryContainer|onSecondaryFixed|onSecondaryFixedVariant|secondaryFixed|errorContainer|onErrorContainer|primary)\b`
  - `colors.surface` is not used as a fill outside `packages/ui/src/theme/` (bars use `surfaceCard`).
  - `colors.surfaceContainerLow` is used only through `tiers.infoBox` or in places documented as info boxes.
  - `colors.surfaceContainerHigh` is used only by the `tonal` button, disabled states, and the `neutral`/`offline` badges.
  - Given RoleSelect, CommuteHub and LiveTracking (migrated in v2), then their card fills are white (`surfaceCard`), not `#EFF4FF`, and their route badges use the `route` tone.

- **AC53 (new, revision 4):** Live Map route options replace the marked sheet region.
  - Given the Live Map tab, then the sheet shows no ETA banner, route-tag row, direction pills or driver card. Directly under the handle it shows three route-option cards: 17D / 44B / 17B, with the copy, badges, ETAs and captions from revision 4, matching `stitch/live-tracking-route-options.png`.
  - 17D is selected by default (brand-tint fill and brand border). Tapping another card moves the selection, and the radio accessibility state follows it.
  - Direction panels, the GPS row, the pass card and Refresh / Switch remain and still work.
  - No text is truncated at 402 pt or 375 pt, all colours come from tokens, and the new text pairs pass `contrast.test.ts`.

## Expected changed files

All paths are relative to `para/`.

### Design system v3 revision (cycle 2): expected to change

- `app.json`: `userInterfaceStyle: "light"`, top-level `backgroundColor: "#F8F9FF"`, splash `backgroundColor: "#F8F9FF"`.
- `eslint.config.js`: the accent-text restriction, and the updated `primaryContainer` message.
- `src/app/_layout.tsx`: `StatusBar style="dark"`, `DefaultTheme`-based `ThemeProvider`.
- `src/constants/navigation.ts`: v3 tab options.
- `src/constants/theme.ts`: only if a re-export changes. `fontAssets` is unchanged.
- `packages/ui/src/theme/`:
  - `colors.ts` (replaced whole)
  - `radius.ts`, `spacing.ts`, `elevation.ts`, `typography.ts` (`LARGE_TEXT_VARIANTS` only)
  - `contrast.ts`, `contrast.test.ts`, `theme.test.ts`
  - `index.ts`, if the exports change
- `packages/ui/src/*/`: `styles.ts`, `<Name>.tsx` and the existing tests of every component:
  - `AppText`, `Button`, `IconButton`, `Badge` (incl. `Badge.test.tsx`), `Card`, `GradientCard` (incl. its test)
  - `SectionHeader`, `SegmentedControl`, `ListRow`, `StatTile`, `ProgressBar` (incl. its test)
  - `BalancePill`, `Avatar`, `TopBar`, `ScreenScroll`, `ComingSoon`, `TabBarIcon`
  - `MapCanvas`, with `RouteSegment`, `MapPin`, `MapCallout`, `PulseDot` and `types.ts`
  - `Icon`, only if its default colour changes
- `src/screens/**`: `styles.ts`, `<Name>Screen.tsx`, the screen-local parts and the `*.test.tsx` of all 11 screens. This includes re-auditing the v2-migrated RoleSelect, CommuteHub (`RouteCard.tsx`, `ConfirmTrackModal.tsx`) and LiveTracking (`DirectionPanels.tsx`, `CorridorMap.tsx`, `EtaSheet.tsx`).
- New: `src/__tests__/design-system.test.tsx` (step 22).

Must not change in this revision:
- `package.json`, `package-lock.json` (no package changes)
- `packages/ui/src/theme/fonts.ts` and the typography style values
- `src/services/**`, `src/types/**` and `src/utils/**` (no data or copy changes)
- route files under `src/app/(auth|commuters|drivers)/`, including the group layouts, unless `tabScreenOptions` wiring requires a change
- testIDs
- `docs/features/jeeptrack-screens/stitch/**`

### Cycle 1 (original scope; built)

#### Deleted

- `src/app/index.tsx`
- `src/app/explore.tsx`
- `src/components/animated-icon.tsx`
- `src/components/animated-icon.web.tsx`
- `src/components/animated-icon.module.css`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/components/external-link.tsx`
- `src/components/hint-row.tsx`
- `src/components/themed-text.tsx`
- `src/components/themed-view.tsx`
- `src/components/web-badge.tsx`
- `src/components/ui/collapsible.tsx`
- `src/global.css`
- `src/hooks/use-theme.ts`
- `src/hooks/use-color-scheme.ts`
- `src/hooks/use-color-scheme.web.ts`
- `src/screens/commuters/.gitkeep`
- `src/screens/drivers/.gitkeep`
- `assets/images/tabIcons/` (all 6 files)
- `assets/images/expo-logo.png`
- `assets/images/react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png`
- `assets/images/logo-glow.png`
- `assets/images/expo-badge.png`, `expo-badge-white.png`
- `assets/images/tutorial-web.png`

#### Modified

- `package.json` (dependencies, devDependencies, `test` script, `jest` config)
- `package-lock.json`
- `app.json`
- `tsconfig.json`
- `src/constants/theme.ts`

#### Added: config

- `tsconfig.base.json`
- `eslint.config.js`
- `packages/ui/tsconfig.json`

#### Added: routes

- `src/app/_layout.tsx` (rewritten)
- `src/app/(auth)/_layout.tsx`
- `src/app/(auth)/index.tsx`
- `src/app/(commuters)/_layout.tsx`
- `src/app/(commuters)/commute.tsx`
- `src/app/(commuters)/live-map.tsx`
- `src/app/(commuters)/activity.tsx`
- `src/app/(commuters)/wallet.tsx`
- `src/app/(commuters)/account.tsx`
- `src/app/(drivers)/_layout.tsx`
- `src/app/(drivers)/duty.tsx`
- `src/app/(drivers)/earnings.tsx`
- `src/app/(drivers)/radar.tsx`
- `src/app/(drivers)/trips.tsx`
- `src/app/(drivers)/profile.tsx`
- `src/constants/navigation.ts`

#### Added: screens

Each folder has `index.ts`, `styles.ts`, `<Name>Screen.tsx` and `<Name>Screen.test.tsx`, plus the listed local parts.

- `src/screens/shared/RoleSelect/`
- `src/screens/commuters/CommuteHub/` (+ `RouteCard.tsx`, `ConfirmTrackModal.tsx`)
- `src/screens/commuters/LiveTracking/` (+ `DirectionPanels.tsx`, `CorridorMap.tsx`, `EtaSheet.tsx`)
- `src/screens/commuters/Wallet/` (+ `TopUpGrid.tsx`, `PaymentChannels.tsx`, `LedgerList.tsx`)
- `src/screens/commuters/Activity/`
- `src/screens/commuters/Account/`
- `src/screens/drivers/DutyHub/` (+ local parts, e.g. `DirectionCard.tsx`, `BroadcastCard.tsx`, `CorridorMiniMap.tsx`)
- `src/screens/drivers/EarningsPool/`
- `src/screens/drivers/CorridorRadar/` (+ `RadarMap.tsx`)
- `src/screens/drivers/Trips/`
- `src/screens/drivers/DriverProfile/`

#### Added: types, services, utils, tests

- `src/types/commuter.ts`
- `src/types/driver.ts`
- `src/services/mock/commuterData.ts`
- `src/services/mock/driverData.ts`
- `src/services/commuterService.ts`
- `src/services/commuterService.test.ts`
- `src/services/driverService.ts`
- `src/services/driverService.test.ts`
- `src/utils/currency.ts`
- `src/utils/currency.test.ts`
- `src/__tests__/navigation.test.tsx`

#### Added: packages/ui

- `packages/ui/src/theme/`: `index.ts`, `colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts`, `fonts.ts`, `contrast.ts`, `contrast.test.ts`, `theme.test.ts`
- Component folders, each with `index.ts`, `styles.ts` and `<Name>.tsx`. `Button`, `SegmentedControl`, `ProgressBar`, `Badge`, `GradientCard`, `ComingSoon` and `TabBarIcon` also have `<Name>.test.tsx`.
  - `packages/ui/src/AppText/`
  - `packages/ui/src/Icon/`
  - `packages/ui/src/Button/`
  - `packages/ui/src/IconButton/`
  - `packages/ui/src/Badge/`
  - `packages/ui/src/Card/`
  - `packages/ui/src/GradientCard/`
  - `packages/ui/src/SectionHeader/`
  - `packages/ui/src/SegmentedControl/`
  - `packages/ui/src/ListRow/`
  - `packages/ui/src/StatTile/`
  - `packages/ui/src/ProgressBar/`
  - `packages/ui/src/BalancePill/`
  - `packages/ui/src/Avatar/`
  - `packages/ui/src/TopBar/`
  - `packages/ui/src/MapCanvas/` (also `RouteSegment.tsx`, `MapPin.tsx`, `MapCallout.tsx`, `PulseDot.tsx`, `types.ts`)
  - `packages/ui/src/ScreenScroll/`
  - `packages/ui/src/ComingSoon/`
  - `packages/ui/src/TabBarIcon/`

### Must not change

- `ios/`, `android/` (do not create them)
- `src/app/` files beyond those listed above
- anything under `docs/features/jeeptrack-screens/stitch/`
