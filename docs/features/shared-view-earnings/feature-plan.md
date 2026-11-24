# Feature plan: shared ₱1 view earnings

Status: **built, not deployed** (2026-11-17). Backend, commuter app and driver Duty Hub done; deploy and portal reports pending.

## Request

When a commuter pays ₱1 to see live jeepneys, share that ₱1 among the drivers who are actually coming to them. Example: 35 vehicles running, only 8 incoming on the routes on the commuter's way, so the ₱1 is split among those 8. Each vehicle's earnings are then shared: driver 60 %, fleet (per unit) 20 %, app owner 20 % (a unit earning ₱400 a day → driver ₱240, fleet ₱80, app ₱80). Each driver sees their views and share earnings.

## Today (what exists)

- The ₱1 pass is **app-only**: the balance and the 15-minute pass live in memory (`useLivePass`), nothing reaches the backend, nobody is paid.
- Driver earnings on the Duty Hub are **sample data**: ₱20 duty base + "Route View Bonus Pool" (route views ÷ active drivers, min 100 views).
- The rules for "incoming" already exist in the app (`placeLiveJeep`, `boardingPoints`, `isIncoming`): lane by heading / closest lane, before the commuter's boarding stop in their direction.

## Design

### 1. Buying a view happens on the backend

New callable `viewsPurchase({ lat, lng, direction? })` (signed-in commuter):

1. Finds the routes on the commuter's way (same geofence as `routesNearby`, rounded location).
2. Reads live positions (RTDB `driverLocations`) for those routes and decides **incoming drivers** with the same rules as the app, ported to the backend:
   - in service, online, fix under 2 minutes old;
   - on a lane of the route (within 50 m of the road);
   - on the commuter's direction (or either direction if the app sends none) and **before** their boarding stop;
   - not too far: road distance to the stop up to a limit (proposed 5 km, about 15 min).
3. **0 incoming → no charge** (keeps the "Walay Driver = ₱0" promise) and the app shows "No jeepneys coming".
4. Otherwise charges ₱1 from the commuter's wallet and splits it (see 2), all in one Firestore transaction.
5. Returns the pass and who was paid (count only, not names).

**What ₱1 unlocks (decided):** all routes on the commuter's way for 15 minutes, but the commuter sees only the **incoming** jeepneys (the ones that share the ₱1). Jeeps going the other way or that already passed are not shown during the pass.

The snapshot is taken **at purchase time**; drivers who become incoming during the 15 minutes are not paid for that view (simple and auditable).

### 2. Splitting ₱1 (decided, revised 2026-11-16)

Two steps:

1. **₱1 is divided equally among all incoming vehicles** on all the routes on the commuter's way. Each incoming vehicle earns `₱1 ÷ n` for that view.
2. **Each vehicle's earnings are split 60 / 20 / 20**:

| Who | Share of each vehicle's earnings |
|---|---|
| Driver | 60 % |
| Fleet (per unit / vehicle, goes to the vehicle's fleet owner) | 20 % |
| Para (app owner) | 20 % |

Example from the request: a vehicle that earns **₱400 in a day** → driver **₱240**, its fleet **₱80**, Para **₱80**.

Example, one view with 8 incoming vehicles: each vehicle earns ₱0.125 → driver ₱0.075, fleet ₱0.025, Para ₱0.025. Together: drivers ₱0.60, fleets ₱0.20, Para ₱0.20 = ₱1.

**Precision.** One view splits into fractions of a centavo (₱1 ÷ 35 ≈ ₱0.0286), so amounts are kept in **micro-pesos** (₱1 = 1,000,000 µ₱) as whole numbers. Per view, the vehicles' shares use largest-remainder rounding (extra µ₱ to the nearest vehicles), so every view adds up to exactly ₱1. Daily totals are summed in µ₱ and rounded to centavos only when shown or paid out; the leftover fraction carries to the next day.

### 3. Records (Firestore, written only by functions)

- `wallets/{uid}`: `{ balanceCentavos }` and `wallets/{uid}/ledger/{id}` (cash-in, view, refund).
- `views/{viewId}`: `{ commuterUid, at, amountMicro, routeIds, direction, vehicles: [{ vehicleId, unitCode, driverId, ownerUid, routeId, distanceM, shareMicro, driverMicro, fleetMicro, paraMicro }] }`. No exact commuter location stored.
- `vehicleEarnings/{vehicleId}/days/{YYYY-MM-DD}`: `{ views, earnedMicro, driverMicro, fleetMicro, paraMicro, driverId, ownerUid }`, incremented in the same transaction (the per-unit record the 60/20/20 is based on). Days in Manila time.
- `driverEarnings/{driverId}/days/{YYYY-MM-DD}`: `{ views, driverMicro }` (their 60 %).
- `fleetEarnings/{ownerUid}/days/{YYYY-MM-DD}`: `{ views, fleetMicro, vehicles }` (20 % of each of its units).
- `platformEarnings/days/{YYYY-MM-DD}`: `{ views, paraMicro }` (20 % of every unit).
- Rules: a driver reads only their own earnings; a fleet reads its units' and drivers'; commuters read their own wallet/ledger; nobody writes from the apps.

### 4. Where people see it

- **Driver app**:
  - Duty Hub "Today's instant daily earnings" from `driverEarnings` (real, live): "N views today • ₱X.XX (60 % of your unit's ₱Y.YY)". Driver earnings are **only** view shares.
  - The Earnings tab lists today's views (time, route, unit share, driver 60 %).
  - **Removed (decided):** the "Route View Bonus Pool Sharing" card and the ₱20 duty base.
- **Commuter app**: the ₱1 button explains "Shared with the N jeepneys coming your way"; during the pass the Live Map shows only those incoming jeepneys, on all routes on the way; the wallet ledger shows each view.
- **Portal**: a fleet sees, per unit per day, views, the unit's earnings and the 60 / 20 / 20 split (its own 20 %); admins see Para's 20 % and totals.

### 5. Abuse and edge cases

- A driver parked near a busy stop: counts only with a fresh fix on the route lane and in service; proposed extra rule: must have moved in the last 5 minutes.
- Same commuter buying again during an active pass: no new charge (the pass already covers all routes on the way).
- A driver on two routes is impossible (one assignment); a driver is paid at most once per view.
- Offline driver / stale GPS: not incoming, not paid.
- Rounding: totals always add up to exactly the amount charged.

## Phases

1. **Wallet backend**: real balance and ledger (admin top-up for testing; GCash / Maya cash-in later). Replaces the in-memory pass and balance.
2. **`viewsPurchase` + incoming rules on the backend**, records and rules; the commuter ₱1 button calls it.
3. **Driver earnings** on the Duty Hub and Earnings tab from `driverEarnings`.
4. **Portal** reports per driver.
5. Payouts (GCash auto-release) — separate project.

## Acceptance criteria

- AC1 With 8 incoming vehicles, a ₱1 view charges ₱1 and records ₱0.125 per vehicle, each split driver 60 % / fleet 20 % / Para 20 %; the view's records add up to exactly ₱1.
- AC1a A vehicle whose views total ₱400 in a day shows driver ₱240, fleet ₱80, Para ₱80 for that day.
- AC1b During the pass the commuter sees only the incoming jeepneys, on all routes on their way.
- AC2 Drivers that are running but not incoming (other direction, already passed, too far, stale GPS, on break) get nothing.
- AC3 With no incoming driver the commuter is not charged.
- AC4 Each driver sees today's view count and share in the app, live; the fleet sees its 20 % and its drivers' shares in the portal; the Route View Bonus Pool and the ₱20 duty base are gone.
- AC5 A second purchase during an active pass is not charged.
- AC6 Only functions write wallets, views and earnings; drivers read only their own.
- AC7 Unit tests for the split (equal per-vehicle share, 60/20/20, micro-peso rounding, n = 1…50, totals exact) and the incoming rules on the backend; an emulator test with scripted drivers (35 running, 8 incoming).

## Decisions (2026-11-16)

1. ₱1 unlocks all routes on the commuter's way for 15 minutes, showing only the incoming jeepneys.
2. Split (revised): ₱1 ÷ all incoming vehicles on all routes on the way; each vehicle's earnings → driver 60 %, fleet (per unit) 20 %, Para 20 %.
3. The Route View Bonus Pool and the ₱20 duty base are removed.

## Open questions

1. **"Incoming" distance limit:** 5 km / ~15 min before the stop, or another value?
2. **Wallet funding for now:** admin top-up only until GCash / Maya, or start the payment integration in phase 1?
3. **Refund if the jeepneys stop coming:** e.g. all incoming drivers go off duty within the first minute. Refund, or keep it simple (no refund)?

## Decisions (2026-11-17) and build choices

- **Incoming = moving on the streets, not at a terminal**: in service, online, GPS under 2 minutes old, moving (speed ≥ 1 m/s), on a route lane (within 50 m), more than 150 m from the route's terminal stops, on the commuter's direction and before their boarding stop. No distance limit.
- **Dynamic percentages**: Firestore `config/earnings` `{ driverPct: 60, fleetPct: 20, appPct: 20 }` (whole numbers summing to 100), read by the backend at each purchase (cached 1 min), changeable without a deploy; each view records the percentages it used. Also `priceCentavos` (100) and `passMinutes` (15).
- Build choices for the open questions (changeable): wallets start with a test balance `config/earnings.starterCentavos` (₱45, like today's sample) until GCash / Maya; no refund once a view is shared.
- Portal reports are a later phase.

## Build status (2026-11-17)

- Backend: `viewsPurchase`, `walletMe` (`functions/src/views/`), incoming rules and the split with unit tests (14 pass); emulator scenario 35 running / 8 incoming passed (₱1 → 8 × ₱0.125, 60/20/20, totals exact).
- Commuter app: ₱1 button calls the backend; the Live Map shows only the paid incoming jeepneys on every route on the way.
- Driver app: Duty Hub earnings card is live from `driverEarnings/{driverId}/days/{Manila day}` (`useDriverEarnings`): "N views today • P% of your unit's ₱Y", P being the percentage the backend used. The Route View Bonus Pool card and the ₱20 duty base are removed.
- Not done: production deploy (functions, Firestore rules), the Earnings tab view list, portal reports.
