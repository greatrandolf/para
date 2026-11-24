# Feature plan: Live Map route list in a draggable bottom sheet

Status: **approved by request** (2026-11-19).

## Request

On the commuter Live Map, after the ₱1 or ad pass unlocks a route, the route list (Route 17B / 14D… cards, ETA, direction panels, GPS row, pass card, actions) should be a real bottom sheet built with `@gorhom/bottom-sheet`. The sheet component lives in `packages/`, and the screen's sheet is split into separate components.

## Today

- `LiveTrackingScreen` renders everything inside `ScreenScroll`. When paid, `EtaSheet` is a static card under a fixed 440 pt map (`MAP_HEIGHT`). The card overlaps the map by `-spacing.lg`.
- `EtaSheet` holds the route options, direction panels, GPS row, pass card and the three action buttons in one file.
- No `GestureHandlerRootView` exists in the app yet.

## Design

1. **Dependency:** `npx expo install @gorhom/bottom-sheet` (v5; works with Reanimated 4 and Gesture Handler 3's `Gesture` API).
2. **Root:** wrap the root layout in `GestureHandlerRootView` (flex 1). The bottom sheet needs it.
3. **`packages/ui/src/BottomSheet/`** (`index.ts`, `styles.ts`, `BottomSheet.tsx`). It is a themed wrapper around `@gorhom/bottom-sheet`:
   - props: `snapPoints`, `index` (start), `onChange`, `children`, `testID`, `scrollable` (content in `BottomSheetScrollView`, default true), `contentStyle`;
   - tier-2 white background, `radius.lg` top corners, 36×4 grey handle (the current design);
   - `enableDynamicSizing={false}`, so the snap points are exact; with safe area bottom padding.
   - It imports no `src/`.
4. **One layout, with or without a pass (revision 2, 2026-11-19):**
   - **The map is the main view.** It fills the screen under the top bar (`CorridorMap` gets `fill` and `bottomInset`). Its direction pill and recenter button sit above the collapsed sheet, and the route framing leaves room for it.
   - **The routes are `LiveMapSheet`,** a draggable sheet over the map built on the shared `BottomSheet`. It starts collapsed.
     - Without a pass: "Routes on your way" chips (and the jeep watch banner); snap points [250 pt, 60 %].
     - With a pass: the route cards and the rest of `EtaSheet`; snap points [300 pt, 85 %].
   - **`LiveViewPayBar`** (the pay, Watch Ads, top-up or ₱0 button) floats over the bottom of the sheet.
5. **No `ScreenScroll`** on this screen any more.
6. **Separate components** (screen folder): `EtaSheet` only composes the sheet sections:
   - `RouteOptions` (exists);
   - `DirectionPanels` (exists);
   - new `GpsStatusRow.tsx`, `PassStatusCard.tsx` and `SheetActions.tsx`.
7. **Tests:** Jest uses `@gorhom/bottom-sheet/mock` and a Gesture Handler root mock. The existing LiveTracking tests keep their testIDs (`eta-sheet`, `route-options`, `route-option-*`, `last-gps`, `refresh-gps`, `direction-switch`). There is a component test for `packages/ui` BottomSheet.

## Acceptance criteria

- AC1 `@gorhom/bottom-sheet` is installed through `npx expo install`, and `npx expo-doctor` reports no new problem for it.
- AC2 `packages/ui/src/BottomSheet/` has `index.ts`, `styles.ts` and `BottomSheet.tsx`, uses theme tokens only, and imports nothing from `src/`.
- AC3 The root layout is wrapped in `GestureHandlerRootView`.
- AC4 The Live Map shows the map filling the screen and the routes in a draggable sheet, with or without a pass:
  - without a pass: chips, 250 pt ↔ 60 %;
  - with a pass: route cards, 300 pt ↔ 85 %.

  The sheet starts collapsed, can't be closed by dragging, and the expanded content scrolls.
- AC5 The map's direction pill and recenter button are hidden for now (`SHOW_MAP_CONTROLS = false` in `CorridorMap`, 2026-11-19). When shown again they sit above the collapsed sheet. Their two tests are skipped until then.
- AC6 Selecting a route card in the sheet still changes the map's route. Switch and Refresh still work.
- AC7 The parts are separate components:
  - `LiveMapSheet` (the sheet);
  - `LiveViewPayBar` (the button);
  - `EtaSheet` (the paid content), made of `RouteOptions`, `DirectionPanels`, `GpsStatusRow`, `PassStatusCard` and `SheetActions`.
- AC8 Without a pass, the chips and the floating pay button work as before (pay, Watch Ads, top-up link, ₱0).
- AC9 `npx tsc --noEmit` is clean, `npx expo lint` adds no warnings, and the Jest suite passes except the 6 known pre-existing failures. There is a new BottomSheet component test.
- AC10 It is checked running on the iOS simulator (drag collapsed ↔ expanded).

## Out of scope

- Using the sheet on other screens.
- Dark mode (the app is light-only).
