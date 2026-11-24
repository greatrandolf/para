# Feature plan: View live jeepneys by watching an ad (no balance)

Status: **approved, building** (2026-11-18).

**Decisions from the user:**
1. Drivers earn from ad views, with a **dynamic, configurable** credit (`config/ads.creditMicro`, split by `config/earnings`).
2. **No daily cap by default** ("unli" for commuters who prefer only ads). The cap stays as a setting (`config/ads.dailyCap`, 0 = unlimited).
3. Google AdMob rewarded ads.
4. The drawer asks the direction before the ad, as for ₱1.
5. Only a small top-up link under the button, never a pop-up.

## Request

- With **₱1 or more** in the wallet, the button stays **View live jeepneys (₱1)**: 15 minutes, paid from the wallet (as today).
- With **less than ₱1**, the button becomes **View live jeepneys (Watch Ads)**. There are no "top up first" pop-ups and nothing is forced on the commuter. Watching is their choice.
- A watched ad gives **3 minutes** of live jeepneys.
- When the 3 minutes end, the map locks again and **View live jeepneys (Watch Ads)** shows again. The commuter can watch again as often as they like (within the limits below).

## How it works today

- **Button:** the Live Map shows **View live jeepneys (₱1)** while a jeepney is live on the route, or **No live jeepneys (₱0)** when none is.
- **Too little balance:** `viewsPurchase` refuses when the balance is under the price. The app then shows an error alert ("Could not open live view"), so commuters with no balance hit a dead end.
- **Passes:** `passes/{uid}` holds a pass `{ until, driverIds, viewId }`. The map shows only the jeepneys that were coming the commuter's way when it started (shared-view-earnings).
- **Ads:** none. The app has no ads library.

## Design

### Which button the commuter sees

| Situation | Button | What it does |
|---|---|---|
| No jeepney live on the route | **No live jeepneys (₱0)**, disabled | Nothing (unchanged) |
| Balance ≥ ₱1 | **View live jeepneys (₱1)** | 15-minute pass from the wallet (unchanged) |
| Balance < ₱1, ads available | **View live jeepneys (Watch Ads)** | Ad, then a 3-minute pass |
| Balance < ₱1, ads not available (web, no ad to show, daily limit reached) | **Top up to view live** | Opens the Wallet (no alert) |
| Ad pass running | Map unlocked: "**Ad view • 2 min left**" | — |
| Ad pass ended | **View live jeepneys (Watch Ads)** again | Watch again |

- The same rules apply to the Live Map pay bar, the "17B is coming your way" banner and the Commute hub's View Live.
- Under ₱1 there is **no top-up pop-up**. Below the button, small text says "or top up ₱1 for 15 minutes", linking to the Wallet.
- **Direction first:** the confirm drawer still asks "Where are you going?". Its main button becomes **Watch ad • 3 min free**, so the 3 minutes cover the jeepneys coming the right way.

### The ad itself

- **Rewarded ads** from Google AdMob (`react-native-google-mobile-ads`, with its Expo config plugin): full-screen, skippable only after the reward point. Interstitials and banners would be forced on users; rewarded ads only play when the commuter taps.
- It is a **native module**. Ads need a **new app build** (iOS and Android). Expo Go and the current APK can't show them, and there they fall back to "Top up to view live".
- **No ad on web:** the web app shows "Top up to view live".

### Granting the 3 minutes (no cheating)

The app must not be able to grant itself free time. So the pass is granted by the **backend**, from Google's own confirmation:

1. The app asks the backend to start an ad view: `adViewStart({ lat, lng, direction })`.
   - The backend finds the incoming jeepneys, exactly as for ₱1.
   - With **none incoming**: no ad, and the app shows "No jeepneys coming yet" (the free "Notify me" stays available).
   - Otherwise it saves `adViews/{id}` `{ uid, routeIds, driverIds, direction, status: "started", at }` and returns the id.
2. The app shows the rewarded ad, with `serverSideVerificationOptions: { userId: uid, customData: adViewId }`.
3. When the commuter earns the reward, **AdMob calls our HTTPS endpoint** `admobRewardCallback`. This is AdMob's server-side verification (SSV).
   - The backend **checks Google's signature** (with AdMob's published keys) and that the transaction id is new.
   - It then grants `passes/{uid}` `{ until: now + 3 min, kind: "ad", driverIds, viewId }`, using the jeepneys stored at step 1.
4. The app sees the pass through `walletMe` / the pass listener and unlocks the map.
   - If the callback is late, the app waits up to 10 seconds with "Unlocking…". After that it says "The ad didn't count. Try again" (and the commuter isn't charged).

The ₱1 path is unchanged. An ad pass and a paid pass never stack: while either runs, the button is hidden.

### Limits (anti-abuse, configurable in `config/ads`)

- **No cooldown:** the commuter can watch again as soon as a pass ends (as requested).
- **Daily cap:** none by default (`dailyCap: 0` = unlimited, per the user). If a cap is set, the button becomes "Top up to view live" once it is reached.
- **Throttling:** one ad view at a time. A new `adViewStart` while another started less than 2 minutes ago returns that one.
- **Ad not filled or failed to load:** "No ad available right now" under the button. The button stays, so the commuter can try again.

### Earnings (who gets what from an ad)

Ad money arrives from AdMob later and in bulk (per month), not per view. Proposal:

- Each **completed** ad view counts as a **view record** with a configurable **ad credit** (`config/ads.creditMicro`, default **₱0.20**).
- It is shared like ₱1 among the incoming jeepneys (60% driver / 20% fleet / 20% Para), so drivers also earn from commuters with no balance.
- It shows in the driver's history as "Ad view • shared by 2 jeepneys • +₱0.06".
- Para checks the credit each month against the real AdMob revenue and adjusts it.
- The credit comes from ad revenue, not from a wallet. Para covers any gap until the monthly check.

### Privacy and consent

- AdMob shows **non-personalized ads** until the commuter agrees to personalized ones (a one-time choice in Account, never a pop-up before the map).
- Google's consent message (UMP) is used where the law requires it.
- Only the uid and the ad view id are sent to AdMob: no location, no name.
- The privacy notice gains an "Ads" section (Data Privacy Act).

## Backend

| Function | Who | Does |
|---|---|---|
| `adViewStart` | commuter | Finds the incoming jeepneys. Refuses with no jeepney, when the daily cap is reached, or during an active pass. Returns `{ adViewId, adUnitId }`. |
| `admobRewardCallback` (HTTPS GET, public) | AdMob | Checks the signature and that the reward is new, grants the 3-minute pass, records the earning (ad credit). Idempotent. |
| `walletMe` (exists) | commuter | Adds `adViewsToday`, `adViewsLeft` and `pass.kind`. |
| `viewsPurchase` (exists) | commuter | Unchanged. Still refuses under ₱1; the app no longer calls it then. |

New: `adViews/{id}` (functions only, no client access), `config/ads` `{ enabled, passMinutes: 3, dailyCap: 0, creditMicro: 200000 }`.

## App

- `useLivePass` gains `canPay` (balance ≥ ₱1), `adsAvailable` (native ads module present, ads enabled, under the cap) and `passKind`.
- A new `useWatchAd()` hook: loads a rewarded ad in advance (so it starts at once), shows it, then waits for the pass.
- The button logic lives in one place (`liveViewAction(balance, adsAvailable, hasJeeps, pass)`). The Live Map, the banner and the Commute hub use it.
- The map status shows "Ad view • N min left", and "Live view • N min left" for paid passes.
- Config plugin and AdMob app ids go in `app.json`. Test ad unit ids are used in development.

## Edge cases

- **Commuter closes the ad early:** no reward, no pass, nothing charged. The button stays.
- **Jeepney passes the commuter during the 3 minutes:** same as ₱1 (it stays on the map until the pass ends).
- **Balance becomes ₱1 or more mid-pass** (top-up): the next button is ₱1 (15 minutes).
- **App killed during the ad:** the pass is still granted if Google confirmed the reward, and shows when the app opens.
- **Offline:** the button is disabled with "You're offline".

## Acceptance criteria

- AC1 With a balance of ₱1 or more, the button is **View live jeepneys (₱1)** and behaves as today.
- AC2 With a balance under ₱1 and ads available, the button is **View live jeepneys (Watch Ads)**. No alert or pop-up is shown.
- AC3 A completed rewarded ad gives a pass of exactly **3 minutes**, showing only the jeepneys that were coming the commuter's way. A closed or failed ad gives nothing.
- AC4 The pass is granted only from AdMob's verified reward: a forged or repeated callback grants nothing.
- AC5 When the ad pass ends, the map locks and **View live jeepneys (Watch Ads)** shows again. Watching again works, up to the daily cap.
- AC6 With no jeepney coming, no ad is shown (₱0 guarantee kept). Where ads can't play (web, old app, cap, no fill), the button reads **Top up to view live** and opens the Wallet.
- AC7 Each completed ad credits the incoming jeepneys' drivers and fleets with the configured ad credit, split by the current percentages. It shows in the driver's history as an ad view.
- AC8 Tests:
  - unit tests for the button logic and the callback's signature, repeat and cap checks;
  - an emulator scenario using a test signing key (start → reward → 3-minute pass → expiry → watch again → cap);
  - component tests for each button state.

## Open questions (with my proposed answers)

1. **Should drivers earn from ad views?** *Proposed: yes*, a configurable credit per completed ad (₱0.20, shared 60/20/20), checked monthly against real AdMob revenue. The alternative is no driver share from ads, which keeps ad money with Para only.
2. **Daily cap?** *Proposed: 20 ad views a day* (one hour of live views), configurable.
3. **Ad network?** *Proposed: Google AdMob rewarded ads.* It works with Expo through its config plugin, and its server-side verification lets the backend trust the reward. This needs an AdMob account and app ids from you.
4. **Same direction step for ads?** *Proposed: yes*, the drawer asks where they're going before the ad, as for ₱1.
5. **Top-up nudge?** *Proposed: only a small "or top up ₱1 for 15 minutes" link* under the Watch Ads button, never a pop-up.

## Out of scope

- Cash-in itself (wallet top-up by GCash or Maya).
- Banner or interstitial ads anywhere in the app.
- Ads in the driver app.

## Build results (2026-11-18)

Decisions taken: drivers earn from ad views (configurable `config/ads.creditMicro`, default ₱0.20, split by the current percentages); no daily cap by default (`config/ads.dailyCap` = 0 means unlimited; set e.g. 20 to cap); Google AdMob rewarded ads with server-side verification; the direction is asked before the ad; only the small top-up link, never a pop-up.

- Backend: `adViewStart`, `admobRewardCallback` (public SSV endpoint), `adViewDevReward` (emulator only), `walletMe` now returns the price and the ad setting. Unit tests 53/53 (SSV signature, replay, keys).
- Emulator scenario: 17/17 (no jeepney → no ad, forged callback refused, 3-minute pass, driver credit, replay refused, no new ad during a pass, watch again, AdMob verify-URL check, cap enforced when set).
- App Jest: all new tests pass; 6 failures were there before this work (GoogleButton, LiveTracking design, SignIn, font roles, navigation, Duty hub colours).
- iOS simulator (Expo Go, emulator test ad): under ₱1 → **View live jeepneys (Watch Ads)** + "or top up ₱1 for 15 minutes" → drawer with direction picker → "Watch ad • 3 min free" → reward → "Ad view • 3 min left" → after expiry the map locks and Watch Ads shows again.
- Fixed while testing: the time left showed one minute too many right after a new pass (stale clock in `useLivePass`).

## Before release

1. Create the AdMob app and a rewarded ad unit; put the real ids in `app.json` (the plugin now has Google's **test** app ids) and `EXPO_PUBLIC_ADMOB_REWARDED_IOS` / `EXPO_PUBLIC_ADMOB_REWARDED_ANDROID`.
2. In AdMob, set the ad unit's server-side verification URL to the deployed `admobRewardCallback`.
3. Make a new native build (EAS); the ad SDK does not run in Expo Go.
4. Deploy the backend functions (needs approval).

## Real AdMob ad on the iOS simulator (2026-11-18)

Expo Go has no AdMob SDK, so a native build was made: `npx expo prebuild --platform ios --clean`, `pod install` (needs `LANG=en_US.UTF-8`), `npx expo run:ios --no-bundler`. In it, **Watch ad** loaded and played Google's real rewarded ad (Google's test ad unit, marked "Test mode"); after "Reward granted" the map unlocked with "Ad view • 3 min left" and the wallet was untouched.

- On the local emulators Google's reward callback cannot reach `localhost`, so after a watched ad the app confirms it through `adViewDevReward` (emulator only; deployed backends refuse it). On a deployed backend the pass comes only from Google's signed callback.
- Test commuter for the emulator: `commuter@para.test` in `para-backend/functions/src/seed/emulatorUsers.json`.
- If the native app shows para-portal screens, it is using a saved packager address (`RCT_jsLocation` = `localhost:8082` in the app's preferences); point it at `localhost:8081`.

## Change: an ad unlocks only the picked route (2026-11-18)

Decision: a watched ad unlocks live jeepneys on **the route the commuter picked only**; ₱1 still unlocks every route on the way for 15 minutes. The free route lines and chips are unchanged.

- `adViewStart` takes `routeId`; only that route's incoming jeepneys are noted (and share the ad's credit). The pass gets `routeIds` / `routeCodes`.
- While an ad pass runs, the same route can't start another ad (`active-pass`), but **another route can** (its own ad replaces the pass: one ad, one route), and paying ₱1 for every route is never blocked by an ad pass.
- App: `useLivePass.has/minutesLeft(routeCode)` respect the pass's routes (`passCoversRoute`); the drawer shows "Unlocks: Route 17B only".
- Older apps that send no `routeId` keep the old behaviour (all routes).
- Checks: backend unit tests 56/56 (new pass-scope tests), emulator scenario 20/20, app Jest unchanged apart from the 6 old failures; on the iOS simulator a real AdMob test ad on 17B unlocked 17B ("Ad view • 3 min left") while 14D stayed "live jeepneys locked".
