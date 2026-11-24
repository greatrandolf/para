# Feature plan: Driver earnings by unit, and earnings history

Status: **built, not deployed** (2026-11-18). The user approved the proposed answers.

## Request

A driver may drive a different unit each day, or more than one unit in a day. The driver should be able to see:
- what they earned in each unit;
- a history of their earnings, down to each ₱1 view that paid them.

## How it works today

- **Each ₱1 view** (`views/{id}`) already stores, for every jeepney that shared it:
  - who drove: `driverId`;
  - which unit: `vehicleId`, `unitCode`;
  - the fleet, route and direction: `ownerUid`, `routeId`, `direction`;
  - the exact shares: `shareMicro`, `driverMicro`, `fleetMicro`, `appMicro`.

  So the history is already there: every peso is recorded with its unit.
- **The driver's daily total** (`driverEarnings/{driverId}/days/{day}`) is one number: views, driver share, the unit's total. It has **no breakdown by unit**.
- **The unit's daily total** (`vehicleEarnings/{vehicleId}/days/{day}`) is not split by driver either. It only keeps the last driver.
- **No driver-facing query exists** for "my views": the view records have no list of the drivers in them to search by, and no rule lets a driver read them.
- **Driver app:**
  - The Duty hub shows today's total.
  - The Earnings tab shows the weekly fleet payouts.
  - The rest of the Earnings tab (bonus pool, base wage, "Instant GCash Cash-in") is still mock content.

## Main idea

**Earnings belong to the driver; the unit is where they were earned.** Every peso a driver sees is tied to the unit they drove at that moment. When a driver changes units mid-day, that day is split by unit. A unit driven by someone else never shows in this driver's history.

Three levels in the app, from overview to detail:

1. **Period summary** (This week, Last week, This month): total, views, and a bar per unit.
2. **Day list:** one row per day with the total and unit chips (`PARA-00001 ₱3.60 • PARA-00007 ₱0.90`). It also shows which payout the day belongs to (pending, or paid with its receipt).
3. **Day detail:** the day's units, each with its route(s) and hours driven, and a timeline of the ₱1 views in that unit, for example:
   - "9:42 AM • 17B to Sto. Niño • shared with 2 jeepneys • +₱0.30".

## Design

### 1. Backend data

- **When a ₱1 view is bought** (`viewsPurchase`, in the same transaction):
  - Write `driverIds: string[]` on the view, so a driver's views can be searched.
  - Write the unit's route code and plate on each jeepney entry, for display without extra reads.
  - Add a **per-unit breakdown** to the driver's day, as running totals: `driverEarnings/{driverId}/days/{day}.units.{vehicleId} = { unitCode, plate, routeCode, ownerUid, views, driverMicro, unitEarnedMicro, firstAt, lastAt }`.
  - Add a **per-driver breakdown** to the unit's day (`vehicleEarnings/.../days/{day}.drivers.{driverId}`), for the fleet's view later.
- **Backfill script** (emulator first, then production with your OK):
  - rebuild `driverIds`;
  - rebuild the `units` breakdown from the existing views, so past days show units too.
- **Firestore index:** `views` by `driverIds` (array-contains) + `at` (descending).

### 2. Backend API (driver app; drivers read only their own)

| Function | Returns |
|---|---|
| `driverEarningsSummary({ from, to })` | Per day: total, views, per-unit breakdown. Period totals per unit. At most 62 days per call. |
| `driverEarningsDay({ day, cursor? })` | The day's per-unit totals, plus the views that paid this driver, newest first, 50 per page. Each view gives the time, unit, route, direction, how many jeepneys shared it, the unit's share and the driver's share. |
| `payoutsMine` (exists) | Weekly or mid-week payouts. Each day is matched to its payout using the payout's covered time range. |

- **Privacy:** no commuter information is ever sent to the driver. Only the time and route of each view are shown, and the time is rounded to the minute.
- **Other drivers:** for views another driver shared, only the count of jeepneys is shown, never who they were.

### 3. Driver app (Earnings tab)

Replaces the old mock content:

- **Today card:** today's total, plus a row per unit driven today. It updates live, like the Duty hub card.
- **Period switch:** This week / Last week / This month. Shows the total, views, and a bar per unit with its share of the total.
- **Day list:** day, total, unit chips and payout status (Pending, Requested, Paid • PR-000123). Tapping a day opens the **day detail**.
- **Day detail:**
  - per unit: unit code, plate, route(s), first to last view time, views, total;
  - under each unit, the timeline of ₱1 views ("+₱0.30, shared with 2");
  - "Load more" for busy days.
- **Payouts from your fleet** (exists) stays at the bottom, with its receipts.
- Empty state: "No ₱1 views yet. Earnings appear here as commuters view your jeepney live."
- Amounts under a centavo show as "₱0.075" in the timeline (exact), and day totals are rounded to centavos.

### 4. Fleet portal (optional, same data)

- The driver page gets "Earnings by unit" for a chosen week.
- The unit page gets "Earnings by driver".

## Edge cases

- **Changing units mid-day:** each view counts for the unit driven at that moment (the live GPS record holds the unit). The day shows both units.
- **Two drivers sharing one unit on the same day** (shifts): each sees only their own views in it.
- **Moving to another fleet:** the day and payouts are grouped by fleet as well. The unit row shows the fleet name.
- **Days split across payouts:** with "Request payout now", part of a day can be in one payout and the rest in the next. The day row then shows both payout statuses.
- **Time zone:** days are Manila days.
- **Remainders under a centavo** are carried to the next payout. The history shows exact amounts; the payout shows rounded ones.
- **Offline or old app versions:** the screens use the backend calls. Older driver apps keep showing the Duty hub total.

## Acceptance criteria

- AC1 Each new ₱1 view adds to the driver's day under the unit they drove. The per-unit numbers add up to the day total, to the micro-peso.
- AC2 A driver who drove two units in one day sees both, each with its own views and amount.
- AC3 The day detail lists every view that paid the driver that day, with time, unit, route, direction, jeepneys sharing and the driver's share. Paging returns each view once.
- AC4 A driver never sees another driver's earnings, nor any commuter information. A driver can't read another driver's history: refused with "not found".
- AC5 The period summary (week or month) equals the sum of its days, and each unit's bar equals that unit's days.
- AC6 Each day shows the payout(s) it belongs to and their status. Paid days link to the receipt.
- AC7 After the backfill, past days show the per-unit breakdown, and their totals don't change.
- AC8 Tests:
  - unit tests for the summing and paging;
  - an emulator scenario with one driver on two units in a day, plus a second driver on the same unit;
  - component tests for the Earnings tab states (loading, empty, one unit, several units, paged day).

## Open questions (with my proposed answers)

1. **Show each ₱1 view, or only per-unit totals?**
   *Proposed: show each view*, with time, route and amount. It's the most transparent for drivers, and the data already exists.
2. **How far back?** *Proposed: 90 days in the app*; older history on request through the fleet.
3. **Show the unit's whole share (fleet's and Para's cut too) or only the driver's?**
   *Proposed: the driver's amount first*, with "60% of the unit's ₱X" as a small line, as on the Duty hub.
4. **Also add the fleet portal views** (earnings by unit, earnings by driver) in this feature, or later?
   *Proposed: later*, as a small follow-up using the same data.
5. **Remove the old mock content** on the Earnings tab (bonus pool, base wage, "Instant GCash Cash-in")?
   *Proposed: yes*. It no longer matches how drivers are paid.

## Out of scope

- Trip logs and GPS tracks per unit (the Trips tab).
- Driver tips and cash fares.
- Exporting the history as a file. It can come later, like the payout receipts.

## Build results (2026-11-18)

- **Backend:**
  - `viewsPurchase` now writes `driverIds`, plus each jeepney's `plate` and `routeCode`, on the view.
  - It adds `units.{vehicleId}` to the driver's day and `drivers.{driverId}` to the unit's day, as running totals.
  - New: `driverEarningsSummary`, `driverEarningsDay` (in `src/earnings/`).
  - New index: views by `driverIds` + `day` + `at`.
  - New backfill: `npm run backfill:driver-units` (emulator by default; `--live --project <id>` for production; `--dry-run` to preview).
- **Backend checks:**
  - Unit tests: 49/49.
  - Emulator scenario through real ₱1 purchases: 15/15. One driver on unit A then unit B, and a second driver on unit A. It covers per-unit amounts adding up to the day; period totals; the timeline newest first with route, direction and shared-with; privacy (no commuter, no other driver); a cursor can't be borrowed from another driver; the 90-day limit; the backfill rebuilding the same breakdown.
- **Driver app, Earnings tab:**
  - Live "Today's earnings" with a row per unit.
  - "Earnings by unit": This week / Last week / This month, with the total, views, a bar per unit and the fleet name.
  - A day list with unit chips and the payouts each day belongs to (a mid-week request can split a day).
  - Tapping a day shows each unit (plate, route, first to last view) and every ₱1 view: time, route, how many jeepneys shared it, and the exact amount (e.g. +₱0.0750). "Load more" after 50.
  - "Payouts from your fleet" is unchanged.
  - The old mock content is removed (bonus pool, base wage, Instant GCash Cash-in, telemetry).
- **App checks:**
  - Jest: 473 pass; the 6 failures are the same older ones.
  - New tests for today by unit, the period/day/detail view, period switching, payouts per day, and the text helpers.
  - Also fixed: the ₱1 drawer's direction picker used `colors.surface` as a fill (design-system rule); it now uses `colors.surfaceCard`.
- **Not verified:** the Earnings tab on the Android driver app. The app reloaded, but it is behind the driver's PIN, which Claude doesn't enter.

