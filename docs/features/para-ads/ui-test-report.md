# UI test report: Para Ads (para-ads)

**Overall: PASS** after the retest on 2026-11-22. The first run failed on BUG-1 (Daily views); BUG-1 and BUG-2 are fixed and were retested in the portal (see Retest). Every commuter-side check passed.

## Environment
- **Device:** iPhone 17 simulator, iOS 26.5, light mode. The app is light-only. Only one device size was tested.
- **Build:** development build `ph.para.app`, with Metro serving the uncommitted working tree on 2026-11-22 (last commit `feca616`).
- **Backend:** local Firebase emulators (Firestore, Functions, Realtime Database, Storage), so no production campaign or wallet was touched.
- **Portal:** local web build (`localhost:8091`) on the same emulators, signed in as the seeded admin.
- **Test data:**
  - commuter `commuter@para.test` with a ₱0.00 wallet;
  - simulator location at a 17B boarding point;
  - a test jeepney (PARA-UI1, UIT-0001) on 17B, 600 m before the commuter, its position refreshed every 20 s;
  - ads on, Google AdMob allowed.
- **Method:** Maestro isn't installed, so with the user's agreement the app and portal were driven step by step with the simulator and browser tools. The steps aren't saved as re-runnable flows.

## Results

| Criterion | Result | Evidence |
|---|---|---|
| AC1: Admin creates a campaign (photo, schedule, amount, price per view); the portal shows expected views; non-admins can't | **PASS** (form, checks, price picks). Photo upload **NOT TESTED** in the UI. | The New ad form opens. Saving without a photo shows "Choose a photo for the ad." The price picks are ₱0.30 / ₱0.50 / ₱0.80, and the "≈ N views" estimate updates. The photo picker is an OS file dialog the tools can't drive; the campaign was created through the same callables the form uses. Non-admin refusal was not re-tested here (it was covered by the backend scenario and the acceptance review). |
| AC2: The list shows budget, spent, remaining (₱ and views) and views, updating within seconds | **PASS** | After the app's Para Ad view, the portal showed Spent ₱0.80, Views 1, Remaining ₱499.20, 624 views left, with no reload. After a ₱100 top-up: purchase ₱600.00, Remaining ₱599.20, 749 views left. |
| AC3: With an eligible Para Ad, Watch Ad shows it (photo, business, headline, Sponsored, countdown); without one, AdMob shows | **PASS** | No campaign: the Google AdMob test ad played (`03-no-para-ad-admob-fallback.png`). Active campaign: the Para Ad showed full screen on black with Sponsored, "Lechon ni Inday", the photo, the headline, an "Order now" link, and "Live view unlocks in 5" (`05-para-ad-countdown-no-close.png`). |
| AC4: Eligibility respects status, schedule, hours, routes and money | **PASS** for status (paused). Schedule, hours, routes and money **NOT TESTED** in the UI. | Paused in the portal → the app's Watch Ad fell back to the Google ad, and the campaign stayed at ₱0.80 / 1 view (`08-paused-ad-falls-back-to-admob.png`). The other rules are covered by unit tests and the 27-check emulator scenario, not this UI run. |
| AC5: The view counts only after the minimum time; it charges the price, grants the route pass and shares 60/20/20 | **PASS** | After 5 s, the ✕ and "Continue • 3 min live view" appear (`06-para-ad-ready-close-shown.png`). Tapping ✕ unlocked the route (`07-close-gives-3-min-live-view.png`): "1 jeep live on Route 17B • Ad view • 3 min left", an AD VIEW tag, and the arrival card with "2 MINS". Data check: campaign spent ₱0.80 with 1 view; pass `ad` for ["17B"], 177 s left; view ₱0.80 shared driver ₱0.48 / fleet ₱0.16 / Para ₱0.16; wallet still ₱0.00. |
| AC6: Drivers and fleets see Para Ad earnings | **NOT TESTED** (driver app not driven in this run) | The shares are written, per the AC5 data check. The driver app's "To be paid" and per-source split were checked separately earlier. |
| AC7: Closing early unlocks and charges nothing (revised 2026-11-19: no close button until the countdown ends; closing then gives the live view) | **PASS** | During the countdown there was no ✕ and the button was disabled ("Live view unlocks in 5"). After it, the ✕ appeared, and tapping it gave the 3-minute view (AC5). |
| Watch Ad entry point and top-up link under ₱1 | **PASS** | "Watch Ad" with "Top up ₱1 • no ads" under it (`01-live-map-watch-ad.png`). The drawer requires a direction first and shows "3 min free • 1 short ad • Route 17B only" (`02-confirm-drawer-direction-first.png`). |
| AdMob reward unlocks the route | **PASS** | After the Google test ad: "Ad view • 3 min left" with the AD VIEW tag (`04-admob-reward-unlocks-route.png`). |
| Portal actions: Pause, Top up | **PASS** | Pause: PAUSED badge, "Lechon ni Inday is paused" toast, Running 0, Activate offered. Top up: "Added to Lechon ni Inday • ₱599.20 left • 749 views" (749 = ₱599.20 ÷ ₱0.80). |
| Portal: Daily views | **PASS** on retest (FAIL in the first run, BUG-1) | After the fix, the panel lists "2026-11-22 • 1 view • ₱0.80", which matches the test view. |

## Bugs

### BUG-1: The portal's "Daily views" panel never loads
- **Severity:** major. The plan (§5, Detail) asks for views and money spent per day.
- **Steps:**
  1. Open Portal → Para Ads.
  2. On any ad, tap **Daily views**.
- **Expected:** a list of days with views and amount spent (today: 1 view, ₱0.80).
- **Actual:** the red text "Daily figures could not be loaded: Firestore does not support descending key scans".
- **Likely cause:** `para-portal/src/hooks/useCampaignDays.ts` sorts by `documentId()` in descending order, which Firestore doesn't allow. Sorting ascending (or by a stored `day` field) and reversing on the client would fix it.
- **Screenshot:** browser capture during the run (portal screenshots aren't saved as files).

### BUG-2 (cosmetic): The Top up dialog briefly says "About 0 views left after this" while closing
- **Severity:** cosmetic.
- **Steps:** Top up → enter 100 → **Add ₱100.00**.
- **Expected:** the dialog closes showing the same numbers.
- **Actual:** during the fade-out the hint changes to "About 0 views left after this" (the ad is cleared before the dialog finishes closing). The toast and card show the right numbers.

## Not covered in this run
- Dark mode (the app is light-only) and other screen sizes (one iPhone 17 only).
- Android: the emulator runs the production release APK, so it wasn't used against the local emulators.
- Photo upload through the OS file picker.
- Slow or failed network.
- The driver-side earnings screens (AC6).

## Retest (2026-11-22)
- **BUG-1: fixed and retested, PASS.**
  - `useCampaignDays` now reads the days from 13 days before today onward, in ascending id order, and shows the latest first. Firestore can't scan ids in reverse; a first attempt with `limitToLast` failed the same way, because it scans in reverse internally.
  - The Daily views panel lists 2026-11-22: 1 view, ₱0.80.
- **BUG-2: fixed and retested, PASS.**
  - `TopUpDialog` keeps the last ad's numbers while it fades out, and clears the amount when it opens for another ad.
  - A ₱8 top-up kept "About 759 views left after this" while closing. The card and toast showed ₱607.20 left • 759 views.
- **Checks:** `npx tsc --noEmit` and `npx expo lint` are clean in `para-portal`. The portal has no test runner, so there are no automated portal tests for these fixes.
