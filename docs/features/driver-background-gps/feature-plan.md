# Feature plan: driver GPS keeps running in the background

Status: **approved by request** (2026-11-23, "Yes, add it").

## Problem

The driver app sends GPS only while it's on screen: `watchPositionAsync` in `src/services/liveLocation.ts`. The screen now stays awake (expo-keep-awake), but GPS still stops when the driver:
- presses the lock button;
- switches apps (GCash, Messenger);
- or the battery saver puts Para in the background.

When that happens, commuters lose the jeepney after 2 minutes (`JEEP_STALE_MS`).

## Design

1. **A background location task** (`expo-task-manager` + `Location.startLocationUpdatesAsync`), `para-driver-location`.
   - It's defined at module load in `liveLocation.ts`, which is imported by the root layout.
   - It sends the same position as today (`driverLocations/{driverId}/position`) with the same 5 s / 10 m throttle.
   - While the app is running, the task's fixes go through the same `send()`, so the Duty hub's "Last sent" still updates.
2. **Permissions:** foreground first, as today. Then "Always" (background):
   - It's asked once, after a clear in-app disclosure (Google Play requires one before asking for background location): "Keep sharing your jeepney's location when the phone is locked?" with **Allow** / **Not now**.
   - The answer is remembered on the phone, so the question isn't asked again.
   - If "Always" isn't allowed, tracking works as before (foreground only), and the Duty hub says how to turn it on.
3. **Android:** a foreground-service notification is shown while tracking: "Para is sharing your jeepney's location. Your fleet and commuters can see your jeepney while you are in service."
   - It stops when the driver goes on break, loses the assignment, signs out, or closes Para (`killServiceOnDestroy`).
4. **iOS:**
   - `UIBackgroundModes: location`, plus the "Always and When In Use" usage text.
   - The blue location indicator shows while tracking.
   - Updates don't pause automatically (`pausesUpdatesAutomatically: false`, `activityType: AutomotiveNavigation`).
5. **Duty hub:**
   - The Sharing badge reads **Always on** with background GPS, or **While app is open** without it.
   - Without it, the help text reads: "Set Para's location to 'Always' in Settings so GPS keeps running when the phone is locked."
6. **A new build is needed** (native config). OTA updates and Metro alone won't enable it.
   - Builds made before this change don't have the task manager's native module.
   - `liveLocation.ts` loads `expo-task-manager` only when the native module is there. Those builds, and OTA updates to them, keep foreground-only GPS instead of crashing.
   - This was found on the simulator, where loading it threw "Cannot find native module 'ExpoTaskManager'".

## Acceptance criteria

- AC1 With "Always" allowed, a driver in service keeps sending positions with the screen locked or Para in the background. On Android, the notification shows.
- AC2 Going on break, losing the assignment, or signing out stops the background updates and removes the notification.
- AC3 The background permission is asked only after the in-app disclosure, and at most once. "Not now" keeps foreground tracking working.
- AC4 Without "Always", the Duty hub shows "While app is open" and the Settings hint. With it, it shows "Always on".
- AC5 `app.json` enables background location for iOS and Android with the usage texts. `expo-task-manager` is installed with `npx expo install`.
- AC6 Unit tests cover the permission decision and start/stop of background updates. tsc, lint and expo-doctor are clean.

## Out of scope

- Keeping the jeep visible after the driver force-closes Para. Presence marks it offline, as today.
- Batching or offline queueing of positions.
