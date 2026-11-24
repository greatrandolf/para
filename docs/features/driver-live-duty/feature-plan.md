# Feature plan: driver live duty (real-time assignment, live GPS, break, end shift)

## Request
1. The driver app shows assignment changes in real time (Firestore `onSnapshot`), not on a timer.
2. While the assignment is ongoing and **in service**, the app sends live GPS to the Realtime Database.
3. When the driver stops tracking, the assignment goes **on break** (no GPS).
4. **End Shift & Submit Daily Manifest** completes the assignment (rotated): the unit and driver are freed for the next assignment.

## Design

### Assignment duty status (Firestore `assignments/{id}`)
- New field `dutyStatus: "in_service" | "on_break" | "off_duty"` and `dutyChangedAt`.
- A new assignment starts `in_service`. Older ongoing assignments without the field count as `in_service`.
- Completed assignments are `off_duty`. Driver-ended ones also get `endedBy: "driver"` and `shiftEndedAt`.
- Only Cloud Functions write assignments (unchanged).

### Backend (para-backend)
- `driverDutySet({status: "in_service" | "on_break"})`: the signed-in driver's ongoing assignment. Needs active app access.
- `driverShiftEnd()`: completes the driver's ongoing assignment (`state: completed`, `end: today`), the unit goes to standby, the driver to available — the same as the fleet's End assignment. No ongoing assignment → nothing to end (ok).
- Firestore trigger `onAssignmentWritten`: keeps the Realtime Database duty record in sync for every change (fleet assigns, ends, rotates; driver toggles break or ends shift).
- Revoking or deleting a driver removes their live record.
- `driverMe` returns `assignment.id` and `assignment.dutyStatus`.

### Realtime Database `driverLocations/{driverId}`
- `meta` (server only): `assignmentId, vehicleId, unitCode, plate, routeId, routeCode, ownerUid, status, updatedAt`.
- `position` (driver only): `lat, lng, heading, speed, accuracy, at` (`at` = server time).
- Rules: a driver may write only their own `position`, and only while `meta/status == "in_service"`. Values are validated. Signed-in users may read.

### Firestore rules
- A driver may read their own assignments (`driverId == token.driverId`) while their app access is active.

### App (para)
- `src/services/firebase.ts`: Firestore and Realtime Database clients (emulators in development).
- `DutyProvider` (`src/hooks/useDuty.tsx`) in the drivers layout:
  - `onSnapshot` on `assignments where driverId == me and state == ongoing`; every change refreshes `driverMe`.
  - While in service: foreground location (`expo-location`) every ~5 s / 10 m → `driverLocations/{driverId}/position`.
  - Exposes duty status, tracking state (last sent, permission), `setBreak(on)`, `endShift()`.
- Duty Hub: My Assignment card shows the live duty status; the tracking card shows real tracking state, and Stop / Resume Tracking sets break.
- Profile: End Shift asks for confirmation, completes the assignment, then locks the app.

### Out of scope (follow-ups)
- Background location (needs a development build, `expo-task-manager`, "Always" permission and an Android foreground service). This version sends GPS only while the app is open.
- Showing live vehicles in the portal and to commuters.
- Manifest contents (trip counts, fares).

## Acceptance criteria
- AC1: When the fleet creates, ends or rotates an assignment, the driver app shows it within a few seconds without a restart.
- AC2: A new assignment is `in_service`; `driverMe` returns `id` and `dutyStatus`.
- AC3: While in service, the app writes `position` to `driverLocations/{driverId}`; the RTDB `meta` shows the unit, route and `in_service`.
- AC4: Stop Tracking sets `on_break` on the assignment and the RTDB meta; GPS stops; RTDB rejects position writes.
- AC5: Resume Tracking sets `in_service` and GPS starts again.
- AC6: End Shift (after confirming) sets the assignment `completed` with `end` today, `off_duty`, `endedBy: driver`; the unit goes to standby and the driver to available; the live record is removed; the app locks.
- AC7: A driver cannot read another driver's assignment, cannot write another driver's position, and cannot write `meta`. A revoked driver loses read access.
- AC8: Location permission denied shows a clear message and no crash.
- AC9: Typecheck, lint, and tests pass (except the 5 known failures); new tests cover the duty UI and end shift.

## Results (2026-11-11)

### Backend (emulators, 40 scripted checks, all pass)
- AC1: a driver reads only their own ongoing assignment through Firestore (query must include `deletedAt == null`); another driver's assignments and a revoked driver are refused.
- AC2: new assignments are `in_service`; `driverMe` returns `id` and `dutyStatus`.
- AC3: the trigger writes `meta` (unit, route, `in_service`, `authUid`); the driver writes `position` with server time.
- AC4/AC5: break sets `on_break` on the assignment, the RTDB meta and `fleetList`; position writes are refused; resume restores them.
- AC6: End Shift completes the assignment (`end` = Manila date, `off_duty`, `endedBy: driver`), unit standby, driver available, live record removed; ending again is a no-op.
- AC7: other drivers, the fleet and anonymous users cannot write a driver's position; nobody can write `meta`; invalid or extra fields are refused; revoke removes the live record; re-activation restores it.
- Regression: owner and access scripts pass except checks that assume an empty database (driver-number counters, admin seeing exactly two fleets, first pending code).

### App (iOS Simulator, Expo Go, emulators)
- Activation → PIN → Duty Hub shows "Not on duty" without an assignment.
- The fleet created an assignment from the backend: the card switched to the unit and route and "In service", and the first GPS position was sent within a second, with no restart.
- Driving (simulated route): a position every 5 s. Parked: a heartbeat every ~30–40 s.
- Stop Tracking (Break): "On break", no positions sent, fleet sees `on_break`. Resume Tracking: positions flow again.
- End Shift: confirmation dialog → assignment completed by the driver, unit standby, driver available, live record removed, app locked behind the PIN.

### Checks
- `npx tsc --noEmit`: clean. `npx expo lint`: 0 errors (8 old warnings).
- Jest: 329 pass, 9 fail: the 5 known old failures, plus 4 caused by the 20:33–20:35 edits to SignIn and GoogleButton (the "JeepTrack Live" header and the emulator note were removed; those tests were not updated).

### Not done (follow-ups)
- Background GPS (development build, `expo-task-manager`, "Always" permission, Android foreground service).
- Portal: show duty status and live positions to fleets; commuter map of live jeepneys.
- Real project: create the Realtime Database and set `EXPO_PUBLIC_FIREBASE_DATABASE_URL`.

## Revision 2: re-activation only when access is gone

Request: no assignment or a standby unit must not send the driver to re-activation; the app opens on "Welcome back" (PIN). Without an assigned vehicle the Duty Hub shows live GPS disabled; when the fleet assigns a unit, tracking starts by itself. Re-activation only when the account is deactivated or has no access.

Changes:
- `useSession`: if the token can't be refreshed for a network reason (offline, server unreachable), the phone stays signed in (driver → PIN screen, from the `driver-<driverId>` uid). Only a dead session (disabled, deleted, revoked, activated elsewhere) signs out.
- Drivers layout: `permission-denied` (access turned off) signs out at once. `unauthenticated` first refreshes the token and retries once; it signs out only if the session is dead or the fresh token is refused too. `unavailable` never signs out.
- Duty Hub without an assigned vehicle: "NO ASSIGNED VEHICLE • LIVE GPS DISABLED" and a disabled Start Tracking button (dimmed glass); live GPS starts by itself on assignment.

- AC10: no assignment or a standby unit keeps the phone signed in; a cold start opens Welcome back.
- AC11: without an assigned vehicle, live GPS shows as disabled.
- AC12: re-activation happens only when access is turned off, the driver is deleted, or Para is activated on another phone.

Verified on the iOS Simulator: activation → PIN → "No assigned vehicle / Live GPS disabled"; cold restart → Welcome back; fleet assigns → screen updates and GPS starts within 0.5 s; fleet sets the unit to standby → back to GPS disabled, still signed in; fleet turns access off → next launch goes to sign-in / activate. Jest: 335 pass (6 new access tests); the same 9 failures as before.

## Revision 3: driver app sign-out removed; portal roster live

- Driver Profile: the Sign out button is gone; the day ends with End Shift (locks behind the PIN). "Forgot PIN? Sign out of this phone" stays on the PIN screen.
- Portal (para-portal) Fleet & Asset Management → Roster & Assignments updates in real time: `useLiveAssignments` listens (Firestore onSnapshot) to the ongoing assignments the rules allow (own `ownerUid` for fleet users, all or the picked fleet for admins, `deletedAt == null`). A duty change patches the cached rows at once; a new, ended or rotated assignment refetches the fleet list. A "Live" badge shows while connected.
- Status column: "In Service • Live GPS", "On Break • GPS Paused", "Completed (Shift Ended)" (driver End Shift), "Completed (Rotated)" (fleet).
- Verified in the portal (admin view, no reload): fleet assigns → row appears "In Service • Live GPS", 1 active rotation; driver break → "On Break • GPS Paused" within 1 s; resume → back; End Shift → "Completed (Shift Ended)", end date set, 0 active rotations.

Emulator note: restarting the emulators with `--import` reset every account's "tokens valid since" time to the restart time, so sessions from before the restart were refused as revoked (portal: "Your session has ended"; driver phones: back to activation). Restored from the export for the local data. After a future restart, sign in again or re-activate test phones.

## Revision 4: Disconnected status in the portal

- Driver app presence (Firebase presence pattern): `driverLocations/{driverId}/presence = { online, at }`. On every (re)connection the app registers `onDisconnect().set({ online: false })` and then writes `online: true`; the database server applies the offline write when the app is killed, loses signal or is suspended. Locking, End Shift or sign-out writes offline at once. Runs while the driver has an assignment and the app is unlocked. The last GPS position is kept (no longer removed on disconnect).
- Rules: only the driver, only while assigned, `{ online: boolean, at: number }` and nothing else.
- Portal roster: "Disconnected • since 10:21 PM" (red) when offline, "Disconnected • App not open" when the app never connected, "In Service • No GPS Signal" when online but no fix for 90 s (re-checked every 15 s), otherwise the duty status.
- Verified: rules (9 checks); simulator + portal: before unlock "Disconnected • App not open"; unlocked → "In Service • Live GPS"; force-quit the app → "Disconnected • since 10:21 PM" at once; reopened (PIN screen) → still Disconnected; unlocked → "In Service • Live GPS" within 1 s.
- Not tested on a device: losing signal (no clean close) is detected by the server's connection timeout, typically within about a minute; the 90 s GPS check covers the gap.

## Revision 5: commuter Live Map uses the real route and live GPS

- Route: `routesList` → the trip's route code (17B) or the first active route; `routesGet` for its stops per direction (the portal's route editor data). The road between stops comes from OSRM (`EXPO_PUBLIC_OSRM_URL`, public demo server by default, straight lines if routing fails). Outbound drawn orange, inbound slate, stops as dots; the map frames the route, and Recenter turns it north-up and frames it again.
- Jeeps: Realtime Database `driverLocations` for that route (indexed `meta/routeId`), using the existing jeep icon. Shown only in service, connected, fix under 2 min old (server clock), within 1 km of the route. Each fix is snapped onto the route (direction by GPS heading while moving, else the previous direction), and the icon glides along the road to it in ~5 s, turning with the road; a big jump or a new direction moves it at once. Status pill: "1 jeep live on Route 17B" / "No jeeps live on Route 17B".
- Not changed: the ETA sheet and route options below the map, and the pickup point, are still sample data.
- Verified on the iOS Simulator (commuter) with a simulated driver sending GPS along Route 17B every 3 s: the route drawn on the roads with its 16 stops; the jeep appeared at Apas and moved along the road, facing its direction of travel; a driver at the Android emulator's default location (California) was left out; disconnecting the driver removed the jeep and showed "No jeeps live".
- Tests: `livePath` (projection, along-road pose, direction choice, corridor filter) and `visibleJeeps`; 349 pass, the same 9 known failures.
- Revision 5a: the Android emulator driver (PARA-00001) reported the emulator's default location (California), so it was left out as off-corridor. Moved the emulator's GPS onto Route 17B with `adb emu geo fix <lng> <lat>` (stepped along the route): the jeep then showed on the iOS commuter map at Apas and moved along the road. Recenter fixed to turn north-up first and then frame the route (two camera moves at once fought each other on iOS).
- Local testing tip: set the Android emulator's location to Cebu (Extended controls → Location, or `adb emu geo fix 123.9056 10.3389`); the iOS Simulator with `xcrun simctl location booted set 10.3389,123.9056`.
- Revision 5b: the two directions are drawn side by side, each on the right-hand side of its direction of travel (Philippine traffic keeps right), 4 screen points from the road's centre at any zoom (recomputed when the zoom settles, in power-of-two steps). The offset uses the road direction over ~20 m so dense road geometry does not wobble. Jeeps ride on their direction's lane. Tests: `offsetRight`, `shiftRight`.

## Revision 6: commuter GPS on the Live Map

- `useCommuterLocation` (foreground permission, update every 10 s / 15 m). The commuter's location stays on the phone; it is never sent to the backend.
- Map: the commuter's blue dot (`showsUserLocation`); the pickup is the nearest stop of Route 17B from the database ("Board at <stop> • 520 m • 7 min walk • <direction>") instead of the sample Kamputhaw pickup. Recenter frames the route plus the commuter when within 3 km. Permission denied → "Allow location to find your nearest stop" (opens Settings); Location Services off → retry.
- Pickup ring fixed on iOS: Apple Maps ignores `anchor`, so `centerOffset` places the ring on the stop.
- Location permission text now covers commuters and drivers.
- Verified on the iOS Simulator: commuter near Kamputhaw → Morales Street Stop, 520 m, 7 min; moved near Sto. Niño → Legaspi Street Stop, 170 m, 2 min. Tests: `nearestStop`, `formatDistance`; 354 pass, same 9 known failures.

## Revision 7: the driver starts live GPS

- A new assignment starts with duty status `ready` (assigned, GPS not started) instead of `in_service`. No GPS is sent and commuters do not see the jeep until the driver taps **Start Tracking**, which sets `in_service` (`driverDutySet`). Older records without the field still count as `in_service`.
- Driver app: "READY TO START • UNIT ASSIGNED • GPS NOT SENT" with an enabled Start Tracking button; badge "Ready to start". Without an assignment the button stays disabled ("You can start live GPS once your fleet assigns your unit and route.").
- Portal roster: "Assigned • Not Started".
- The RTDB rules already refuse position writes unless `meta.status == 'in_service'`, so nothing changed there.

## Revision 8: one driver, one phone

- Each activation creates a phone session (`drivers.sessionId`, `phoneSession` claim, RTDB `driverSessions/{driverId}`). The app listens to it; when another phone is activated (or access is turned off) the old phone signs out at once and shows why on the sign-in / activation screen. The backend, Firestore rules and RTDB rules refuse the old phone too, and its presence is reset to offline.
- Verified with the iOS Simulator and the Android emulator activating the same driver in turn: each time the other device returned to sign-in with "Para was activated on another phone…", and presence showed offline.
- Sessions activated before this change have no `phoneSession`: they keep working until the driver is activated again.

## Revision 9: routes on my way, by preferred route

Request: fetch by the commuter's preferred route code, plus the other routes coming on their way; selecting a row changes the map's route; show the live GPS jeeps of the selected route.

Design:
- Backend `routesForCommute({ preferredCode })` (any signed-in user): the active route with that code, plus every other active route that shares its corridor (at least 2 stops within 400 m of a preferred-route stop). Full routes with stops per direction. No commuter location is sent (Revision 6: it stays on the phone).
- App: the preferred code comes from the commuter profile (sample `17B` until profiles are stored). On the phone, routes are narrowed to those with a stop within 800 m of the commuter (when location is known), and each gets its boarding stop and an ETA from its live jeeps (nearest jeep before the boarding stop, same direction, along the stops at 300 m/min).
- Route options list replaces the sample rows: preferred route ("YOUR PREFERRED ROUTE"), the soonest other route with a live jeep ("BEST OPTION"), the rest "ALTERNATIVE". Subtitle "N vehicles approaching" or "No live jeeps yet"; ETA "N min" or "—".
- Selecting a row redraws the map with that route (road path, stops, pickup), re-frames it, and shows only that route's live jeeps; the status pill names it.

Acceptance criteria:
- AC9.1 Given preferred code 17B, `routesForCommute` returns Route 17B as `preferred` and only active routes that share its corridor in `others`; an unknown code gives `preferred: null` with no error; a signed-out call is refused.
- AC9.2 The Live Map list shows the preferred route and the routes on the way from the backend (not sample data), with live-jeep counts and ETAs.
- AC9.3 The preferred route is selected by default; tapping another row selects it (radio state) and the map draws that route, frames it, and shows "N jeeps live on Route <code>" for that route only.
- AC9.4 A jeep sharing GPS on the selected route appears on the map; jeeps of other routes do not.
- AC9.5 Typecheck, lint (0 errors) and backend build/lint pass; new logic has unit tests; no new test failures.

Results (2026-11-12):
- Emulator: `routesForCommute({preferredCode:'17B'})` → preferred 17B, others 17C, 14D, 04L; unknown code → `preferred: null`; unknown field → INVALID_ARGUMENT. Signed-out calls are allowed only in the local emulator (same as the other route reads); deployed functions refuse them.
- iOS Simulator (commuter near Morales Street): list shows 17B (preferred, selected, "1 vehicle approaching", 6 min), 04L and 14D ("No live jeeps yet"); 17C was left out (no stop within 800 m). Tapping 04L redrew the map with 04L's road, stops and boarding stop (Gorordo Avenue) and "No jeeps live on Route 04L", with 17B's jeep gone; tapping 17B brought back its route and live jeep.
- ETAs follow the road paths (shared with the map); straight stop lines missed the jeep where stops are 2+ km apart. A parked jeep (no heading) counts on whichever lane reaches the boarding stop first.
- Tests: `commuteOptions` (12) and Live Map screen tests for the default preferred selection, map following the selection, and the no-routes notice; 377 pass, the same 9 known failures. Typecheck, lint (0 errors), backend build and lint pass.
- Not covered in the app: a "BEST OPTION" row, since only one jeep is live locally (covered by unit tests).

## Revision 10: Commute hub lists the routes on my way

Request: the Commute hub's route cards show the routes coming my way (fetched, not sample data), with only how many jeeps are on the road in each direction. No ETA, no "approaching".

Design:
- Same fetch as the Live Map (`routesForCommute` with the preferred code, shared cache), narrowed on the phone to routes with a stop within 800 m of the commuter (all of them while the location is unknown). Preferred route first, then by code.
- Each card: route code, name, `via` line, distance (`roundtripKm`, else the road length), stop count, base fare, and live jeeps on the road per direction ("Going to Sto. Niño • 1 on road", "Going back to Apas • 0 on road"); the top badge is the total. A jeep counts in the direction its heading matches while moving, else the nearest lane. 0 on road uses the existing offline card (No Charge).
- No ETA or "approaching" text anywhere on the hub: the card note becomes "Live map locked • Pay ₱1", the section subtitle and guarantee text drop "ETA".
- View Live opens the Live Map with that route selected. Filter chips count the real list (all routes are jeepneys; buses 0). Loading, error and "nothing near you" states.

Acceptance criteria:
- AC10.1 The hub lists the preferred route and the other routes from `routesForCommute` near the commuter, not the sample routes.
- AC10.2 Each card shows on-road counts for both directions, using the route's direction labels, and a total badge; no ETA and no "approaching" text appears on the hub.
- AC10.3 A route with no live jeep shows the offline card (0 on road, No Charge).
- AC10.4 View Live on a card opens the Live Map with that route selected.
- AC10.5 Typecheck and lint (0 errors) pass; new logic has unit tests; no new test failures.

Results (2026-11-12):
- iOS Simulator (commuter near Morales Street): the hub lists 17B (preferred: "Going to Sto. Niño • 1 on road", "Going back to Apas • 0 on road", 1 on road, 14.8 km • 13 stops, ₱15.00, View Live), then 04L and 14D as offline cards (0 on road both ways, No Charge). Chips read All Transit (3), Jeepneys Only (3). No ETA or "approaching" text on the hub.
- View Live on 17B (with 04L selected on the Live Map) opened the Live Map with 17B selected, twice in a row.
- Tests: `hubRoutes` (6), hub screen tests rewritten for the fetched routes (per-direction counts, no ETA/approaching text, offline card, loading/error/empty, View Live params), Live Map opened with a route; 387 pass, the same 9 known failures. Typecheck and lint (0 errors) pass.

## Revision 11: ₱1 to see live jeepneys; routes free

Request: until the commuter pays ₱1, hide the route list; show the routes on the way as orange code chips (17B, 04L, 14D) with the route drawn on the map but no live GPS. Tapping a chip shows a floating orange "₱1 view live jeepneys" button at the bottom.

Design:
- Live pass per route, 15 minutes (the confirm drawer's "guaranteed for 15 mins"), ₱1 deducted from the shown balance. There is no wallet backend yet, so passes and the deduction live in the app session only (not real payment, gone on restart).
- Live Map, selected route without a pass: the ETA sheet (route list, direction panels, GPS row) is hidden; orange chips list the routes on the way (selected chip filled); the map draws the selected route and its stops with no jeeps; the status pill reads "Route 17B • live jeepneys locked". A floating button at the bottom: "View live jeepneys (₱1)" opens the confirm drawer; when the route has no live jeep it is disabled "No live jeepneys (₱0)" (the ₱0 guarantee).
- Confirm → pass for that route: live jeeps on the map and the route list/sheet come back. Selecting a route without a pass goes back to the chips.
- Commute hub: Confirm & Track buys the same pass, so the Live Map opens unlocked on that route; View Live on a route that already has a pass skips the drawer.

Acceptance criteria:
- AC11.1 Without a pass, the Live Map shows route chips, no route list or ETA sheet, and no jeep markers; the selected route is still drawn.
- AC11.2 Tapping a chip selects that route on the map and shows the floating ₱1 button (disabled ₱0 when no jeep is live on it).
- AC11.3 Confirming ₱1 shows that route's live jeeps and the route list, and the balance drops by ₱1; the pass ends after 15 minutes.
- AC11.4 Confirm & Track on the hub unlocks the route on the Live Map without paying again.
- AC11.5 Typecheck and lint (0 errors) pass; new logic has tests; no new test failures.

Results (2026-11-12):
- iOS Simulator, fresh session (₱45.00): the Live Map opened on 17B with no jeep, "Route 17B • live jeepneys locked", chips 17B / 04L / 14D and a floating "View live jeepneys (₱1)". Tapping 04L drew 04L and showed the disabled "No live jeepneys (₱0)". Back on 17B, ₱1 → confirm: balance ₱44.00, the jeep and the route list appeared. Choosing 04L afterwards locked again (chips, ₱0 button).
- Tests: `useLivePass` (3), Live Map without a pass (chips, no list/ETA/jeeps, ₱1 vs ₱0 button, pay unlocks and deducts, locking on another route), hub buys the pass once. 395 pass, same 9 known failures. Typecheck and lint (0 errors) pass.
- Not real payment: passes live in memory for the app session (no wallet backend). Ends on restart or sign-out.
- Revision 11a: minutes left on a pass. Hub card: green "Live access • N min left" note and a plain "View Live" button (no price) while the pass runs; the Live Map label adds "• N min left". Minutes round up and refresh every 15 s; the route locks when the pass ends. Verified on the iOS Simulator (17B: "15 min left" on the card and the map). Tests: `minutesLeftOn`, hub card and map label; 396 pass, same 9 known failures.

## Revision 12: jeeps that already passed are grey

- A live jeep is orange (glow, orange cap) while it is still coming to the commuter's boarding stop on its lane, and grey (grey body, slate cap, no glow) once it has passed. Without the commuter's location every jeep stays orange.
- One shared rule for the map icon and the route list (`placeLiveJeep` + `isIncoming`): lane by GPS heading while moving, else the closest lane; boarding stop per direction = that direction's stop closest to the commuter, within 800 m. The icon also faces that lane. A parked jeep is no longer counted on both lanes, so "approaching" and the ETA match the icon colour.
- Verified on the iOS Simulator: the parked jeep south of Morales Street (passed) was grey and the row read "1 jeep live, none heading to your stop yet"; moved north of the stop it turned orange and the row read "1 vehicle approaching • 2 min".
- Tests: boarding points, incoming/passed per direction, at-the-stop, list agrees with icon; 400 pass, same 9 known failures.

## Revision 13: the commuter's direction of travel

- The Live Map has a direction pill at the bottom left ("Going to Sto. Niño ⇅", the route's own direction labels); tapping it (or the sheet's Switch) changes direction. That direction's lane and stops are orange, the other slate; the boarding pin is that direction's stop closest to the commuter.
- Jeeps are orange only when they run the commuter's direction and have not reached the boarding stop yet; the other direction and jeeps that passed are grey. The route list's "approaching" and ETA count the same jeeps.
- A parked jeep equally close to both lanes is put on the commuter's lane. The icon now uses the same placement as the colour, so a fix up to 500 m off the road snaps onto its lane and faces the lane's travel direction (before, a fix over 80 m off kept its raw GPS heading and faced north).
- Verified on the iOS Simulator: going to Sto. Niño, the jeep north of Morales Street was orange facing south toward the pin ("2 min"); switched to Apas, the lanes swapped colours, the pin moved to N. Escario Street and that jeep turned grey ("none heading to your stop"); a driver moving north from Capitol on the Apas lane showed orange facing the pin ("1 vehicle approaching • 3 min").
- Tests: direction-only boarding, ETA per direction, parked jeep on the commuter's lane, map pill switching; 404 pass, same 9 known failures.

## Revision 14: jeeps at the driver's exact location

- The jeep icon is drawn at the driver's GPS fix (no snapping onto the road or a lane offset); a new fix moves it there in about 1 s. It faces its GPS heading while moving, else its lane's travel direction.
- A jeep's lane no longer depends on the commuter's direction, so switching Sto. Niño ⇄ Apas never moves or turns a jeep; only its colour (orange/grey) and the route list change.
- Verified on the iOS Simulator: the icon sat at the RTDB fix (10.31641, 123.89156); switching to Apas left it in place and turned it orange ("1 vehicle approaching • 3 min"). Tests: lane independent of direction; 405 pass, same 9 known failures.

## Revision 15: light map matching for jeep icons

- A fix within 50 m of the route is drawn on the road's centre line at its closest point, facing along the road; further away (detour, bad GPS) it is drawn exactly at the fix with its GPS heading (`jeepPose`). The lane comes from the jeep's own heading/position, never the commuter's direction, so switching direction still never moves it.
- Verified on the iOS Simulator: the jeep near Gorordo Avenue moved from beside the road onto its centre, aligned with the road; switching to Apas left it in place (orange, "3 min"). Tests: near fix snapped and aligned, far fix exact; 407 pass, same 9 known failures.

## Revision 16: nearby routes by geofence (backend)

Request: the backend fetches the default routes near the commuter, by a geofence around their location (the ring on the map).

Design:
- Callable `routesNearby({ lat, lng, radiusM? })` (signed-in users): every active route with at least one stop within `radiusM` (default 800, max 3000) of the point, nearest stop first, with `nearestStopM` per route. Full routes (stops per direction), at most 10.
- Privacy: the app rounds the point to 3 decimals (~110 m) before sending; the function does not store or log it.
- App: `useRoutesOnMyWay` uses `routesNearby` when the commuter's location is known (the preferred route goes first if it is nearby); without a location it falls back to `routesForCommute(preferredCode)`. Cache per rounded point, so walking a few metres does not refetch.

Acceptance criteria:
- AC16.1 `routesNearby` returns only active routes with a stop inside the radius, nearest first; invalid coordinates are refused (INVALID_ARGUMENT); the point is not logged.
- AC16.2 With location, the Commute hub and Live Map list the routes near the commuter from `routesNearby` (17C included when nearby); without location, the preferred-route list as before.
- AC16.3 Typecheck, lint, backend build/lint pass; new logic has unit tests; no new test failures.

Results (2026-11-13):
- Emulator: near Morales Street `routesNearby` → 17B (54 m), 04L (96 m), 14D (120 m); near F. Ramos Street → 17C (92 m), 17B (774 m); Manila → none; bad lat / unknown field → INVALID_ARGUMENT.
- iOS Simulator: moving the commuter from Morales Street to F. Ramos Street changed the Live Map chips from 17B / 04L / 14D to 17B / 17C (preferred 17B first, from the geofence).
- Deployed to para-a9efb; signed-out calls refused. Tests: `orderNearby`, `roundCoordinate`; 410 pass, the same 9 known failures. Typecheck, lint (0 errors), backend build and lint pass.
- The installed APK still uses the old list until it is rebuilt (the app change is in the JS bundle).
- Revision 16a: the backend owns the geofence. `routesNearby` takes only `{lat, lng}`; the radius comes from Firestore `config/commute.nearbyRadiusM` (50–3000 m, default 400, cached 1 min), so it changes without a deploy or app update. Emulator at 400 m: near F. Ramos Street only 17C (92 m); 17B (774 m) left out. Deployed to para-a9efb.
- The list is nearest first everywhere when the location is known: the preferred route keeps its badge but is not moved, and the Live Map list keeps the geofence order instead of soonest ETA. Test: list keeps nearest-first order.
- EAS Update set up (expo-updates, updates URL, channels per build profile, runtimeVersion policy `fingerprint`). From the next APK on, JS-only changes ship with `eas update --channel preview` without reinstalling. 411 pass, same 9 known failures.
- Revision 16b: the geofence measures to the route line (each direction's path through its stops, in order), not only to the stops; a jeepney picks up along the road. Sorted by `distanceM` (to the line); `nearestStopM` also returned. At 10.318614, 123.897727 on live data: 14D 44 m, 04L 231 m, 17B 265 m, 17C 386 m (17C's nearest stop is 1,017 m away, so the stop-only rule had left it out). Deployed to para-a9efb.
- Revision 16c: the Live Map no longer re-filters the geofence list by stops within 800 m on the phone (that had dropped 17C again). Verified on the iOS Simulator at 10.318614, 123.897727: chips 14D, 17B, 04L, 17C.

## Revision 17: routes coloured on Google's real roads

Request: identify the real road each route takes on Google Maps (our stops are only the reference) and colour that road; make it easy to undo if the acceptance criteria are not met.

Design:
- Backend computes each direction's road shape with the Google Routes API (`computeRoutes`, DRIVE, high-quality polyline, the stops as origin / intermediates / destination) and stores it on the route (`roadPaths.{outbound,inbound}` = encoded polyline + a hash of the stops it was computed from). A Firestore trigger recomputes when a route or its stops change (skipped when the stops hash is unchanged). A backfill command computes existing routes. Phones never call Google.
- The Routes API key is a server-only key restricted to the Routes API, kept in Secret Manager (`ROUTES_API_KEY`), never in the app.
- Route reads (`routesGet`, `routesForCommute`, `routesNearby`) include `roadPaths` unless Firestore `config/commute.roadGeometry` is `"osrm"`.
- App: when a route has `roadPaths`, the map draws that exact road (decoded polyline) on the road's centre, the commuter's direction orange on top of the other direction in grey (same width), no lane offset. Without `roadPaths` it falls back to today's OSRM lines.
- Undo: set `config/commute.roadGeometry = "osrm"` → the app shows the old lines within ~1 minute (route cache), no rebuild or update. Delete the field (or set "google") to switch back.

Acceptance criteria:
- AC17.1 Every live route has a stored Google road shape for both directions, matching its stops' order.
- AC17.2 On the Live Map the coloured route sits on Google's streets (no offset), the commuter's direction orange on top, the other grey.
- AC17.3 Editing a route's stops recomputes its shape automatically.
- AC17.4 `config/commute.roadGeometry = "osrm"` brings back the previous lines without an app update; removing it restores the Google shapes.
- AC17.5 The Routes key is server-only and restricted to the Routes API; typecheck, lint, backend build/lint pass; new logic has tests; no new test failures.

Results (2026-11-15):
- Routes API on, server key "Para Routes (server only)" restricted to routes.googleapis.com, stored in Secret Manager `ROUTES_API_KEY`. Triggers `onRouteWrittenRoadPaths` / `onStopWrittenRoadPaths` deployed; reads include `roadPaths`.
- Backfill (live): all 6 routes have both directions — 17B 9.4/11.9 km, 17C 9.4/8.9, 14D 4.9/5.3, 04L 4.8/4.1, ALMA 3.1/3.4, KNP 1.0/1.0 (AC17.1). 04L's return needed a fallback: Google cannot pass *through* the Kaohsiung Street stop, so when pass-through finds no road the stops are sent as ordinary stopovers.
- iOS Simulator: 17B drawn on the streets (Gorordo Ave, Morales Street, N. Escario), commuter's direction orange on top of the grey return, no offset (AC17.2).
- Undo switch tested on the emulator: `roadGeometry = "osrm"` → API stopped sending shapes and the app showed the old offset lines after a restart; removed → Google shapes again (AC17.4).
- Tests: backend `node --test` (3: stops hash, request incl. stopover fallback, switch/stale shapes); app decoder + road source (5 new); 417 pass, the same 9 known failures. AC17.3 (auto-recompute on stop edits) is wired through the stop trigger and the stops hash, but not yet exercised by an edit in the portal.

## Revision 18: smooth jeep motion between fixes (dead reckoning)

Request: animate the jeep smoothly to each new fix (~5 s apart); if no fix arrives, keep moving the same distance as the last fix-to-fix move, then stop; if a fix is behind the drawn jeep, hold until a later fix is ahead; repeat. No visible jumps.

Design (`deadReckoning.ts`, used by the jeep marker, metres along the jeep's lane on the road):
1. New fix ahead of the drawn jeep → glide there in ~5 s (linear, 0.2 s steps).
2. Reached it, no new fix → keep going at the last fix-to-fix speed, for at most the last fix-to-fix distance.
3. Still no fix → stop there.
4. Fix behind the drawn jeep (≤150 m) → hold, never move back; glide forward once a later fix is ahead.
Real jumps move the jeep at once: first fix, another lane, a change over 1 km, or a fix over 150 m behind (restart / GPS correction, found in testing: holding there froze the jeep for a minute). Fixes more than 50 m off the route glide straight to the GPS point.

Acceptance criteria:
- AC18.1 Between on-time fixes the jeep moves at a steady speed and reaches each fix as the next arrives.
- AC18.2 A late fix: the jeep continues one fix-to-fix distance, then stops; the late fix is then glided to, not jumped to.
- AC18.3 A fix behind the drawn jeep never moves it backwards; it resumes when fixes are ahead again.
- AC18.4 Unit tests for each rule; no new test failures; shipped as an over-the-air update.

Results (2026-11-15): unit tests (9) cover each rule. Simulator run with a scripted driver on local 17B (50 m every 5 s, then a 12 s gap, a fix 30 m back, then normal), the drawn position logged every second: steady ~10 m/s and each fix reached on time (AC18.1); after the gap it went from 4,048 to 4,098 m and stopped, then glided to the late fix at 4,168 m (AC18.2); the fix 30 m back held it, then it resumed (AC18.3). 426 pass, the same 9 known failures.

## Revision 19: shade the real road instead of a thin line

- Google road shapes are drawn as a translucent band the width of the street (14 m at the current zoom, 6–30 px), orange (`roadShadeMine`, 50%) for the commuter's direction over slate (`roadShadeOther`, 40%) for the other. The street, its name and the jeep stay visible underneath, and the band still covers the street where the basemap differs by a few metres (Apple Maps on iOS; Google Maps on Android matches Google's shapes). Our own lines (no shape / undo switch) are unchanged.
- Verified on the iOS Simulator at Osmeña Blvd / Fuente Osmeña Circle: the band covers the street. Test: shade width per zoom. Shipped as an over-the-air update.
- Revision 19 undone (2026-11-16): zoomed in, a drawn band can't match each street's real width, on iOS Google's shapes sit a few metres off Apple's streets, and both directions share one centre line on two-way streets. Neither Apple Maps nor the Google Maps SDK lets an app colour its own road features, so the shade was reverted in code and on prod (previous update republished); the map is back to the Revision 17/18 thin lines.
- Revision 20 (2026-11-16): each direction is offset a few points to its own (right-hand) side of Google's road shape, as with our own lines, so on shared streets the orange and grey lines run side by side within the street instead of on top of each other. Verified on N. Escario (iOS Simulator).

## Revision 21: driver's live passenger load

Request: a big slider on the Driver Hub to update occupied seats by percentage (reference design: "LIVE PASSENGER LOAD", 68% load, 15 / 22 occupied, presets Empty / Half / Heavy / Standing, −1 / +1, "Auto-broadcasted to commuters on Route 17B radar").

Design:
- `PassengerLoadCard` on the Driver Hub, under the assignment card, only while the driver has an assigned unit. Capacity = the unit's seats (`driverMe.assignment.seats`).
- Big slider (drag or tap the track; snaps to whole seats), percentage + "N / seats Occupied" + "N seats available", a level badge (Empty 0 %, Light < 40 %, Moderate < 75 %, Heavy < 100 %, Full 100 %), presets Empty (0) / Half (½) / Heavy (~80 %) / Standing (all seats), and −1 / +1. Built with React Native's own touch handling, so it ships over the air (no native module).
- Saved to the Realtime Database at `driverLocations/{driverId}/load = { occupied, capacity, at }` (debounced while dragging), read back on open. Rules: only that driver, with the live record and current phone session (same as presence); occupied 0..capacity.
- Commuter display of the load is a follow-up.

Acceptance criteria:
- AC21.1 The card shows the load as % and seats for the unit's capacity, with the matching level badge.
- AC21.2 Dragging/tapping the slider, the presets and ±1 change the occupied seats (0..capacity) and save them to the live record.
- AC21.3 Reopening the Driver Hub shows the saved load.
- AC21.4 The database refuses load writes from anyone but that driver, and values outside 0..capacity.
- AC21.5 Tests for the load logic and the card; no new failures; rules deployed; app shipped over the air.
- Revision 21a (2026-11-16): the card shows only while tracking (in service). It slides/fades in on Start/Resume Tracking and out on Stop Tracking (Reanimated layout animations, already in the APK); the cards below glide to their new place. A refused save now shows on the card. Verified on the iOS Simulator (break hides it, resume brings it back). Tests: hidden for ready / on_break / off_duty.
- Revision 21b (2026-11-16): the slider no longer takes a touch when the finger lands; it takes only a sideways drag (over 8 pt, and mostly horizontal), so scrolling the page across it leaves the value alone. A short tap still sets the value. Verified on the iOS Simulator (vertical swipe from the track scrolled the page, value unchanged; sideways drag to the middle set 11/22). The tick labels and the ±1 / broadcast row are commented out in the card (user's change); tests updated to match.
- Revision 22 (2026-11-16): one Driver Hub header (DriverHubHeader): brand, ON DUTY chip and avatar on top, the assigned unit, status, route and vehicle below (replaces the top bar and the My Assignment card). The passenger load card is a sticky header of the scroll view (stickyHeaderIndices), so it stays under the header while the rest scrolls. Verified on the iOS Simulator.
- Revision 22a (2026-11-16): nothing on the Driver Hub is sticky. The combined header (brand + my assignment) is the first item of the page and scrolls away with it, followed by the passenger load card; only the status-bar area stays white.
- Revision 22b (2026-11-16): the real top bar is back and fixed (Para Live, ON DUTY chip, avatar). The My Assignment details stay a full-width section at the top of the page, under the bar, and scroll with the page; nothing is sticky.
