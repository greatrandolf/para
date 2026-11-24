# Feature plan: Para Ads (local business advertising)

Status: **approved** (2026-11-19). The user chose all four proposals below. Builds on ad-supported-live-view (Watch Ads) and live-map-bottom-sheet.

## Request

Local businesses buy ads that commuters see in Para:
- The portal creates them: photo, schedule, purchase amount, price per view (e.g. ₱0.50, ₱0.80 or ₱1.00), and the remaining balance after every view.
- The commuter app shows a running Para Ad when there is one. Otherwise it falls back to Google AdMob.
- Drivers earn a percentage of the ad revenue.

## How it works today

- Under ₱1, the Live Map offers **View live jeepneys (Watch Ads)**:
  - `adViewStart` notes the jeepneys coming the commuter's way and returns an ad view id;
  - the app shows an AdMob rewarded ad;
  - Google's signed callback (SSV) grants a 3-minute pass for the picked route;
  - `config/ads.creditMicro` (₱0.20) is shared through `recordSharedView` (60/20/20 to driver, fleet and Para).
- No Firebase Storage exists yet (portal and app), so there's nowhere to keep ad photos.

## Design

### 1. Campaigns (backend, `para-backend/functions/src/paraAds/`)

`adCampaigns/{id}`:

| Field | Meaning |
|---|---|
| `businessName`, `headline`, `ctaLabel?`, `ctaUrl?` | What the ad says (CTA, e.g. "Visit us", optional) |
| `imagePath` | Storage path of the photo (`paraAds/{id}/{file}`) |
| `startAt`, `endAt` | Schedule (Manila time) |
| `dailyHours?` | Optional, e.g. 06:00–20:00 |
| `routeIds?` | Optional route targeting; empty = every route |
| `budgetMicro` | Purchase amount, e.g. ₱500.00 |
| `pricePerViewMicro` | ₱0.50 / ₱0.80 / ₱1.00 (any amount ₱0.10–₱5.00) |
| `spentMicro`, `views` | Updated on every counted view |
| `status` | `draft` → `active` → `paused` / `exhausted` / `ended` |
| `createdBy`, `createdAt`, `updatedAt` | Audit |

- **Remaining** = `budgetMicro − spentMicro`. **Views left** = ⌊remaining / price⌋.
- A campaign stops by itself (`exhausted`) when the remaining balance can't pay one more view, and never goes below ₱0.

### 2. Which ad a commuter gets

`adViewStart` (existing) picks the ad source:
1. A Para Ad is eligible when it is `active`, within its schedule and daily hours, targets the picked route (or every route), and has enough remaining balance for one view.
2. Among eligible campaigns, pick **the one with the most remaining views** (spreads the delivery). A commuter doesn't see the same campaign again within `config/paraAds.repeatMinutes` (default 10) if another one is available.
3. **No eligible Para Ad → AdMob**, exactly as today.

The response gains `source: "para" | "admob"`. For `para` it adds the campaign's `headline`, `businessName`, `imageUrl` (a signed or download URL) and `ctaUrl`, plus `minSeconds` (`config/paraAds.minSeconds`, default 5).

### 3. Counting a Para Ad view (anti-abuse)

- New callable `paraAdViewed(adViewId)`. It is accepted only:
  - for the commuter who started it;
  - at least `minSeconds` after `adViewStart`;
  - within 1 hour;
  - once per ad view.
- In one transaction:
  - charge the campaign `pricePerViewMicro` (re-checking the remaining balance);
  - add one to `views`;
  - grant the same route-limited pass as AdMob (`passMinutes`);
  - share the price among the incoming jeepneys (§4).
  - If the balance ran out meanwhile, the commuter still gets the pass but nothing is charged or shared.
- Para Ads are confirmed by the app (there's no Google callback), so the server enforces:
  - the minimum time;
  - the daily cap (`config/ads.dailyCap`);
  - a per-commuter limit of `config/paraAds.maxPerCommuterPerDay` (default 20) counted views per campaign per day. Past it, the pass is still given but the view isn't charged.

### 4. Revenue sharing

- Each counted view's price is shared like a ₱1 view through `recordSharedView` (`kind: "paraAd"`, `campaignId`), using `config/paraAds` `{driverPct, fleetPct, appPct}`.
- It goes into the existing `driverEarnings` / `vehicleEarnings` / `fleetEarnings` / `platformEarnings` and weekly settlements, with no settlement changes.
- Driver Earnings and History show "Para Ads" views apart from ₱1 and Google ads (label only).

### 5. Portal (`para-portal`), new **Para Ads** screen (admins)

- **List:** business, photo thumbnail, schedule, price per view, budget, spent, **remaining (₱ and views)**, views and status. Remaining updates live (Firestore listener) after every view.
- **Create / edit form:**
  - photo upload (JPG/PNG, ≤ 2 MB, shown as a 16:9 preview);
  - business name, headline, optional CTA link;
  - start and end dates, optional daily hours;
  - routes (all or selected);
  - purchase amount;
  - price per view: quick picks ₱0.30 / ₱0.50 / ₱0.80 or custom (changed from ₱0.50 / ₱0.80 / ₱1.00 on 2026-11-19).
  - It shows "≈ N views" while typing.
- **Actions:** Activate, Pause, End, and Top up (add to the budget).
- **Detail:** views per day and spent per day.
- **Permission:** a new `ads:manage` permission for `super_admin` and `admin`, enforced in the callables and in Storage and Firestore rules.

### 6. Commuter app (`para`)

- `watchAdForLiveView` reads `source` from `adViewStart`:
  - **`admob`:** unchanged.
  - **`para`:** a full-screen **Para Ad** modal shows:
    - the photo, business name, headline and a "Sponsored" label;
    - a countdown, "Live view unlocks in 5", after which the button turns into **Continue**;
    - an optional CTA button that opens the link.

    Closing it before the countdown ends unlocks nothing. On Continue the app calls `paraAdViewed`, then refreshes the pass as today.
- Web: no ads, as today.
- The button keeps its label, "View live jeepneys (Watch Ads)".

### 7. Storage

- Enable **Firebase Storage** (default bucket) for project para-a9efb. This may need you to click **Get started** in the console once. Add `storage.rules`:
  - admins (`ads:manage`) write `paraAds/**`;
  - signed-in users read.
- Add the Storage emulator (port 9199) for local tests.

## Acceptance criteria

- AC1 An admin creates a campaign with a photo, schedule, purchase amount and price per view (₱0.50 / ₱0.80 / ₱1.00 or custom). The portal shows the expected views. Non-admins can't create, edit or upload.
- AC2 The campaign list shows budget, spent, remaining (₱ and views) and views. It updates within seconds after each counted view.
- AC3 With an eligible Para Ad, a commuter's Watch Ads shows the Para Ad (photo, business, headline, Sponsored, countdown). Without one, the AdMob ad shows as today.
- AC4 Eligibility respects status, schedule, daily hours, route targeting and remaining balance. A campaign that can't pay one more view becomes `exhausted` and isn't shown.
- AC5 A Para Ad view counts only after `minSeconds`, once, for the commuter who started it. Counting charges exactly the price per view, grants the route-limited pass and shares the price among the incoming jeepneys by `config/paraAds` percentages. The remaining balance never goes negative, even with concurrent views.
- AC6 Drivers and fleets see Para Ad earnings in their earnings, history and weekly settlements.
- AC7 Closing a Para Ad before the countdown ends unlocks nothing and charges nothing.
- AC8 Tests:
  - backend unit tests: eligibility, picking, charging, rounding, exhaustion, concurrency;
  - an emulator scenario: create → view → charge → pass → earnings → exhausted → AdMob fallback;
  - portal and app component tests.

  `tsc` and lint are clean.

## Decisions (2026-11-19, the user's answers)

1. **Who creates ads:** **Para admins create them for businesses** (the business pays Para offline, e.g. cash or GCash). Self-serve advertiser accounts with online payment come later.
2. **Revenue split:** **its own setting, starting at the ₱1 split (driver 60 / fleet 20 / Para 20).**
3. **What counts as a view:** **the ad stays open 5 seconds** (then Continue unlocks 3 minutes).
4. **Route targeting:** **optional** (all routes by default).

## Out of scope

- Self-serve advertiser sign-up and online payments.
- Video ads, click-through billing, invoices and receipts to businesses.
- Showing Para Ads to commuters who have ₱1 (ads stay the under-₱1 option).

## Implementation notes (2026-11-19)

**Backend (`para-backend/functions/src/paraAds/`)**
- `campaign.ts` holds the pure logic: eligibility, picking, charging, the daily window and form validation (7 unit tests).
- `paraAdFunctions.ts` has the callables:
  - `paraAdsNewId`, `paraAdsSave`, `paraAdsSetStatus` and `paraAdsTopUp` (permission `ads:manage`, for super_admin and admin);
  - `paraAdViewed` (commuter).
- `adViewStart` now returns `source: "para" | "admob"` (plus the ad for `para`). Google's callback refuses Para ad views.
- `config/ads.admob: false` runs Para Ads only.
- `walletMe.ads.para` says a Para Ad is running.
- Views are recorded as `kind: "paraAd"` with `campaignId`, through `recordSharedView`, so earnings and settlements include them.
- Rules:
  - `adCampaigns` (and `days/`) are readable by super_admin and admin;
  - `storage.rules`: admins write `paraAds/**` (images ≤ 2 MB), signed-in users read;
  - the Storage emulator is on port 9199 (`npm run emulators`).

**Portal**
- **Para Ads** screen (`/para-ads`, sidebar item for `ads:manage`):
  - a live list (Firestore `onSnapshot`) with remaining ₱ and views left;
  - the create/edit form (photo upload with `expo-image-picker` to Storage, price picks ₱0.30 / ₱0.50 / ₱0.80, a views estimate);
  - Activate, Pause, Top up and End.
- The portal has no test runner, so there are no portal unit tests. The same money math is unit-tested in the backend.

**App**
- `ParaAdViewer` in `packages/ui` (2026-11-19: a full-screen photo viewer with a black backdrop and the photo fitted, replacing the card), with 4 tests.
- `ParaAdHost` in the commuter tabs, using the `paraAdPresenter` store.
- `watchAdForLiveView` shows the Para Ad, calls `paraAdViewed` after Continue, and otherwise falls back to AdMob (4 tests).
- Watch Ads is offered when a Para Ad runs, even where Google ads can't play.

**Verified**
- Backend: 63/63 unit tests.
- Emulator scenario: 26/26:
  - draft → AdMob;
  - active → Para Ad;
  - before 5 s refused;
  - counted view → pass, ₱0.80 charge and a 60/20/20 share (driver +₱0.48);
  - duplicate refused;
  - SSV refused;
  - used up → AdMob;
  - top-up;
  - Para-only mode;
  - wallet flags;
  - Storage refuses anonymous uploads.
- Portal in the browser on the emulators: the list updated live after a counted view (₱500.00 → ₱499.20, 625 → 624 views left); the form estimate and its validation worked.
- App Jest: 6 known old failures only.
- tsc and lint are clean in all three projects.

**Not done yet**
- The Para Ad modal hasn't been seen on a device (only component tests).
- Production: deploy the functions and rules, and enable Firebase Storage (Console → Storage → Get started) before deploying `storage.rules`. Set `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` if the bucket isn't `para-a9efb.firebasestorage.app`.
- Driver History doesn't label Para Ad views apart yet.
