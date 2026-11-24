# Feature plan: Share real ad revenue with drivers and fleets

Status: **draft, waiting for decisions** (2026-11-18). Follows ad-supported-live-view.

## Request

Drivers and fleets should earn from the rewarded ads commuters watch, based on **what Google actually pays**, not a guessed amount.

## How it works today

- A commuter under ₱1 watches a rewarded ad. Google confirms the reward (SSV), and the backend grants a 3-minute pass.
- At that moment `grantAdView` credits a **fixed** `config/ads.creditMicro` (₱0.20 by default) through `recordSharedView`. It is split 60/20/20 like a ₱1 view, among the jeepneys that were coming the commuter's way.
- Weekly settlements (`unsettledTotals`) add up `views` docs by their time `at`, per fleet, from each fleet's `settledThrough` cursor. Ad views are included like ₱1 views.
- **The gap:** Google's reward confirmation carries no money. What one ad earns (eCPM) varies, roughly ₱0.06–₱0.30 in the Philippines, and is known only from AdMob's reports, a few hours to a day later. AdMob finalises each month's earnings early the next month, after deducting invalid traffic. A fixed ₱0.20 can pay drivers more than the ads earned.

## Design: a daily ad-revenue pool

Instead of a fixed credit at watch time, **each day's real AdMob earnings are shared out** across that day's verified ad views.

### 1. At watch time: count, don't pay

- `grantAdView` still grants the 3-minute pass. It **records the ad view** (`adViews/{id}`: status `rewarded`, the incoming jeepneys, Manila day), but **credits no money**.
- The driver's history shows these as "Ad views: 12 • earnings on Nov 20" (pending).
- Only views confirmed by Google's signed callback count. Client-reported ads never do.
- The app also reports Google's **per-ad estimated value** (the ads library's paid event, once impression-level revenue is turned on in AdMob). It is saved on the ad view, **for reports only**. The app could fake it, so it never decides money.

### 2. Each day: get the day's revenue

The revenue for Manila day **D** is taken on **D+2 at 06:00**, when AdMob's numbers have settled. It comes from one of two sources:

- **(a) Manual (first release):** the super admin opens **Portal → Ad revenue**, sees the day's verified ad views, and enters AdMob's "estimated earnings" for that day.
- **(b) Automatic (second release):** a scheduled function calls the **AdMob API** (Network report: estimated earnings for our rewarded ad unit, for day D).
  - The AdMob API needs OAuth with your Google account. Service accounts aren't supported, so you authorise once and the refresh token goes in Secret Manager.
  - Set the AdMob account's currency to PHP. Otherwise the USD→PHP rate used is saved with the day.

The day's figures are stored in `adRevenueDays/{D}`: `{ revenueMicro, currency, source, adViews, perAdMicro, status: "allocated", at }`.

### 3. Share it out

- **Per ad:** `perAdMicro = revenueMicro / verified ad views that day`. Every verified ad counts the same.
- **Each ad's share** is split among its incoming jeepneys, like a ₱1 view, using `config/adRevenue` `{ driverPct, fleetPct, appPct }`. This defaults to the current 60/20/20.
- **Fair commuter weighting (anti-abuse):** a commuter's ads beyond `config/adRevenue.maxWeightedPerDay` (default 30) still unlock views, but don't add to the drivers' share of the pool. One person farming ads can't steer most of the day's revenue to a few jeepneys.
- **Where the money goes:**
  - It is written into the **earnings of day D** (`driverEarnings`, `vehicleEarnings`, `fleetEarnings`, `platformEarnings`, with an `adMicro` field), so histories show it on the day the ads were watched.
  - It also creates **one `views` doc per fleet** (`kind: "adRevenue"`, `day: D`, vehicles with shares) with `at` = allocation time.
  - Settlements already sum `views` by `at`, so ad revenue reaches the **next payout after it is allocated**. Ads watched on Sunday are paid with the following week. Nothing in the settlement code changes, except labelling these lines on statements.
- **Re-running a day is safe.** The day's allocation id is fixed, so the same day can't be shared twice.

### 4. Month-end check

- Around the 3rd of each month, AdMob's **finalised** earnings may differ from the daily estimates (invalid traffic deducted).
- The portal shows the difference per month (estimated vs final).
- **Proposed:** Para's share absorbs the difference, and drivers are never charged back. An optional `reserveRate` (e.g. 10%) could hold part of the daily amount until month end.

### Example

Nov 18: 1,000 verified ad views, and AdMob reports ₱180.00.

- **Per ad:** ₱0.18.
- **Split:** drivers ₱0.108, fleets ₱0.036, Para ₱0.036.
- **One ad with 2 jeepneys coming:** each driver gets ₱0.054 and each fleet ₱0.018.
- **When it lands:** allocated on Nov 20 at 06:00, so it is in the payout for the week of Nov 17–23.

## Changes

**Backend (`para-backend/functions/src/ads/`)**
- `grantAdView`: stop the fixed credit (keep `creditMicro` = 0 as an off switch for the old behaviour). Save `driverIds` and the weighting flag on the ad view.
- New `adRevenue.ts`: `allocateAdDay(day, revenueMicro, source)`, a pure share calculation plus a transaction that writes the earnings docs and `views`.
- New callables (super admin):
  - `adRevenueDays`: list days with ad views, revenue and status;
  - `adRevenueSet`: enter a day's revenue and allocate it.
- New scheduled `adRevenueDaily` (second release): the AdMob API for D+2.
- `admobPaidEvent` callable: the app's per-ad estimate, saved for reports only.
- Statements/PDFs: "Ad revenue (Nov 18)" lines.

**Portal (`para-portal`)**
- **Ad revenue** screen (super admin): a table of days (ad views, revenue, per ad, drivers/fleets/Para shares, status) with "Enter revenue" and "Allocate". It also shows the month-end check.
- Fleet payouts and current week: ad revenue lines shown apart from ₱1 views.

**App (`para`)**
- Driver Earnings/History: "Ad views" with "pending" or the allocated amount.
- Rewarded ad: listen for the paid event and send it with the ad view id.

**Config:** `config/adRevenue { driverPct, fleetPct, appPct, maxWeightedPerDay, reserveRate }`.

## Acceptance criteria

- AC1 A verified ad still grants the 3-minute pass, but credits nothing until its day is allocated. The driver sees it as pending.
- AC2 Allocating day D with revenue R shares exactly R (to the centavo, with rounding leftovers going to Para) across D's verified ad views. Each ad is split among its incoming jeepneys by `config/adRevenue`.
- AC3 A day can't be allocated twice. Re-running returns the stored result.
- AC4 Ads past a commuter's daily weighting limit unlock views but don't add to the pool's shares.
- AC5 Allocated ad revenue appears in the next settlement for each fleet, as separate "Ad revenue" lines on statements and receipts.
- AC6 Only super admins can enter or allocate revenue. Fleets and drivers can only read their own.
- AC7 The app's per-ad estimate is stored but never changes any amount.
- AC8 Tests:
  - unit tests for the share calculation (rounding, weighting, zero views, zero revenue);
  - an emulator scenario: ads → allocation → earnings → settlement includes them → re-run is refused;
  - portal and app component tests.

## Open questions (with my proposed answers)

1. **Ad revenue split:** the same 60/20/20 as ₱1 views? *Proposed: yes*, as its own setting so it can change later. Google already keeps its share before AdMob reports earnings.
2. **Revenue source first:** *Proposed: manual entry in the portal first*, then the AdMob API once you authorise it.
3. **Estimate vs final at month end:** *Proposed: Para absorbs the difference*, with no claw-back from drivers.
4. **Fixed credit now:** *Proposed: turn the ₱0.20 off when this ships.* Until then, lower it to ₱0.10 so Para doesn't overpay.
5. **Weighting limit:** *Proposed: 30 ads per commuter per day* count toward the pool.

## Out of scope

- Commuter-side changes (the Watch Ads flow stays as built).
- Other ad formats or networks (mediation).
- Tax/withholding on ad income.
