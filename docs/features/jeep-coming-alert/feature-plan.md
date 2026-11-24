# Feature plan: "Notify me when one is coming" (free)

Status: **built, not deployed** (2026-11-17).

## Request

When a commuter taps ₱1 and no jeepney is coming their way, offer a free **Notify me** instead of a dead end. Para watches the routes on their way and tells them as soon as a jeepney is heading their way. They tap the alert, then pay ₱1 to see it live. The ₱1 is shared exactly as today (shared-view-earnings).

## Today

- `viewsPurchase` returns `{charged: false, reason: "no-incoming"}` and the app shows "No jeepneys coming yet … You were not charged." Nothing else happens.
- The app has no notifications (`expo-notifications` is not installed).

## Design

### Backend (`para-backend/functions/src/views/`)

- Callable **`viewsWatch({lat, lng, direction?, pushToken?})`** (commuter): saves `watches/{uid}` `{lat, lng (rounded 3 dp), direction, until: now + 30 min, pushToken, status: "watching", createdAt}`. Free. Replaces an earlier watch. Refused while a pass is active (nothing to wait for).
- Callable **`viewsWatchCancel()`**: deletes `watches/{uid}`.
- Scheduled **`watchesCheck`** (every minute): for each active watch, finds the incoming jeepneys with the same rules as `viewsPurchase` (`findIncoming`, shared code). When at least one is coming:
  - sets `watches/{uid}` `status: "coming"`, `coming: {count, routeCodes, at}`;
  - sends one push through the Expo push service if the watch has a token ("17B is coming your way. Tap to see it live for ₱1.");
  - one alert per watch: it is not checked again.
- Expired watches are set `status: "expired"` (no alert) and removed by the next run after 1 h.
- **No charge** from the watch or the alert. Paying stays a tap by the commuter (`viewsPurchase`), which then pays the jeepneys incoming at that moment.
- A successful `viewsPurchase` deletes the commuter's watch.
- Rules: `watches/{uid}` readable by its owner only; writes by functions only.

### App

- `buyLiveView`: on "no-incoming" the alert offers **Notify me — free** and **Not now**.
- **Notify me** asks for notification permission (optional), gets the Expo push token when allowed, and calls `viewsWatch`. Without permission, the in-app banner still works while the app is open.
- `useJeepWatch` listens to `watches/{uid}` (Firestore `onSnapshot`) and gives `{status, until, coming}`.
- Commute hub and Live Map show a banner while watching: "Watching for jeepneys coming your way • N min left • Cancel". When `status` becomes `coming`: "17B is coming your way" with a **₱1 view live** button (the same purchase).
- Tapping the push opens the Live Map (`para://` scheme, Live Map route).
- `expo-notifications` is a native module: **push needs a new APK build**. An app without it (current APK after an OTA) skips the push and still shows the in-app banner (the module is loaded only if present).

### Push delivery (setup outside the code)

- Android push through Expo needs the project's FCM V1 credentials in EAS (`eas credentials` → Android → Push Notifications: FCM V1, a Firebase service-account key). The user uploads it; Claude does not handle the key.

## Acceptance criteria

- AC1 When no jeepney is coming, the commuter is not charged and is offered **Notify me — free**.
- AC2 `viewsWatch` saves one watch per commuter for 30 minutes and charges nothing; a second call replaces it; refused for drivers and while a pass is active.
- AC3 Within about a minute of a jeepney becoming incoming on a route on the watch's way, the watch turns `coming` with the count and route codes, and a push is sent when a token was given. Only one alert per watch.
- AC4 A watch never charges. After the alert the commuter pays ₱1 only by tapping, and the ₱1 is shared among the jeepneys incoming at that moment.
- AC5 Expired watches send nothing. Cancel stops the watch at once.
- AC6 The app shows the watching banner with minutes left and Cancel, and the "coming" banner with the ₱1 button, on the Commute hub and the Live Map.
- AC7 The app works without notification permission and on an APK without `expo-notifications` (in-app banner only).
- AC8 Only functions write `watches`; a commuter reads only their own.
- AC9 Unit tests for the watch check (coming, nothing coming, expired, one alert) and the app banner; emulator test with a scripted driver becoming incoming.

## Out of scope

- Charging automatically on the alert (rejected: money without a tap).
- Usual wait times from trip history.

## Build results (2026-11-17)

- Backend: `viewsWatch`, `viewsWatchCancel`, scheduled `watchesCheck` (every minute, ≤ 200 watches a run) in `functions/src/views/watchFunctions.ts`; rules in `watch.ts`; `viewsPurchase` removes the watch; `watches/{uid}` owner-read rule. Unit tests 20/20.
- Emulator run (`scenarioWatch.js`): no jeepney → not charged; watch 30 min, free; check with nothing coming → keeps watching; one jeepney starts coming → `coming`, count 1, route 17B, wallet unchanged; second check → no second alert; tap → ₱1 charged, shared with the 1 incoming, watch removed; expired watch → `expired`, no alert; cancel removes it; a bad push token is refused. AC1–AC5, AC8 verified.
- App: `expo-notifications` added (plugin in `app.json`); `useJeepWatch`, `useJeepAlertTaps`, `services/pushNotifications.ts`, `packages/ui/JeepWatchBanner`; "Notify me — free" in `buyLiveView`; banner on the Commute hub and the Live Map. Tests: banner, the Notify-me alert flow, Commute hub banner states (AC6, AC7 in tests).
- Not verified: a real push on a phone (needs a new APK and FCM credentials in EAS), and the screens on a device.
- Full Jest: 448 pass; the 6 failures are older and unrelated (sign-in title, Google emulator note, old Duty hub header, route summary).
