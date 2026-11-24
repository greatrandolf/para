# Feature plan: Fleet pays its drivers (settlements, GCash payouts, receipts)

Status: **built, not deployed** (2026-11-17). The user said to proceed, so the proposed answers below are used.

## Request

Para no longer pays drivers directly. For each period, Para sends **all the shares earned by a fleet's units** (every driver's share plus the fleet's share) to the **fleet**. The fleet then sends each driver their share by **GCash** and the system **generates an invoice/receipt** for each driver payout.

## Today

- Every ₱1 view is split per incoming unit: 60% driver / 20% fleet / 20% Para (`config/earnings`, dynamic).
- The purchase transaction writes running totals:
  - `driverEarnings/{driverId}/days/{day}`: `views`, `driverMicro`, `unitEarnedMicro`, `driverPct`.
  - `fleetEarnings/{ownerUid}/days/{day}`: `views`, `fleetMicro`.
  - `vehicleEarnings/{vehicleId}/days/{day}`, `platformEarnings/days/list/{day}`.
  - `views/{id}`: the full per-vehicle breakdown (driverId, ownerUid, shares).
- Nothing records **which fleet** a driver's earnings belong to. A driver who changes fleets mid-period can't be split correctly.
- Payout functions, settlement records and receipts don't exist yet. The portal's **Payout & Pool Audits** page is "Coming soon". The driver app still says "Daily Auto-Release to GCash every 11:59 PM".
- The portal has a `fleet` role scoped to its own records. Only admins have `payouts:read`.

## How the money moves (proposed)

```
Commuters ──₱1 views──▶ Para (wallet balances)
                         │  keeps its 20%
                         ▼
           Para ──remits drivers' 60% + fleet's 20%──▶ Fleet
                                                       │  keeps its 20%
                                                       ▼
                               Fleet ──GCash, per driver──▶ Driver
                                                       └─▶ Payout receipt (PDF) for the driver
```

The app **records** the money movements and produces the documents. **In v1 it does not move money**: Para's admin and the fleet send the transfers in their own GCash/bank and type in the reference number. Sending through an API (GCash / PayMongo / Xendit disbursements) is a later phase.

## Worked example (one week, one fleet)

Fleet "Mabolo Transport" has 3 units. Split is 60/20/20.

| Driver | Unit earned | Driver 60% | Fleet 20% | Para 20% |
|---|---:|---:|---:|---:|
| Juan | ₱57.75 | ₱34.65 | ₱11.55 | ₱11.55 |
| Pedro | ₱35.00 | ₱21.00 | ₱7.00 | ₱7.00 |
| Rey | ₱20.50 | ₱12.30 | ₱4.10 | ₱4.10 |
| **Total** | **₱113.25** | **₱67.95** | **₱22.65** | **₱22.65** |

- **Settlement statement to the fleet:** gross ₱113.25, less the Para platform fee of ₱22.65, so **₱90.60 is remitted to the fleet**. Of that, ₱67.95 is owed to the drivers and ₱22.65 is the fleet's.
- **The fleet pays by GCash:** Juan ₱34.65, Pedro ₱21.00, Rey ₱12.30. Each payout gets a receipt such as `MBL-2026W47-0001`.

## Design

### 1. Earnings by fleet and driver (backend)

- Each settlement is built from the `views/{id}` documents of the period (`day` between Monday and Sunday). Every view already stores, per incoming unit, the `driverId`, `ownerUid`, `shareMicro`, `driverMicro`, `fleetMicro` and `appMicro`. So no purchase change and no backfill are needed, and a driver who changes fleets is paid by each fleet for that fleet's part.
- The views are read in pages of 1,000 documents.

### 2. Settlements (Para → fleet)

- Scheduled `settlementsWeekly` (Mondays 00:15 Manila) closes the week that just ended. An admin callable `settlementsClose({periodStart})` closes a week by hand (for a missed run, and for the emulator). Closing is idempotent: the settlement id is `{ownerUid}_{periodStart}`, and an existing one is never rebuilt. For every fleet with earnings in the period it creates `settlements/{ownerUid}_{periodId}`:
  - `period {start, end}`, `views`, `grossMicro`, `paraFeeMicro`, `fleetMicro`, `driversMicro`, `remitCentavos`;
  - `lines[]` per driver: `{driverId, name, views, driverMicro, payCentavos, gcashMasked}`;
  - `status: "open" → "remitted" → "paid"` (all drivers paid), and `number` (e.g. `PARA-SET-2026W47-0012`).
- **Centavos:** each driver line is rounded down to whole centavos. The leftover micro-pesos carry into that driver's next period, so no money is lost and nobody is overpaid.
- A settlement is a **snapshot**: it never changes. Views after the period end belong to the next one. Corrections are made with adjustment lines in a later settlement.
- Callable `settlementMarkRemitted({id, method, reference, sentAt})`: **admin only**. Records that Para sent the money to the fleet.

### 3. Driver payouts (fleet → driver)

- The driver's GCash number is stored on the driver record. The fleet or the driver enters it; the fleet confirms it. Receipts show it masked (`0917 ••• 1234`).
- Callable `payoutMarkPaid({settlementId, driverId, reference, paidAt?})`: **the fleet that owns the settlement** (or an admin).
  - The amount paid is the line's amount (v1 has no partial payments).
  - It is allowed before Para has remitted (Q2) and refused when the line is already paid. A paid line is never edited. Voiding a payout is a later phase.
  - It creates `payouts/{id}`: `{receiptNo, settlementId, ownerUid, fleetName, driverId, driverName, period, views, amountCentavos, gcashMasked, gcashReference, paidAt, paidBy}`.
- **Receipt numbers** go up per fleet with no gaps, for example `MBL-000123`. They are allocated in a transaction on `fleets/{ownerUid}.receiptSeq`.
- **PDF**: the callable `documentLink({kind, id})` checks who is asking and returns a one-time token valid for 10 minutes. The app opens `{functions}/documentPdf?t=<token>`, and that function draws the PDF (pdf-lib) from the stored, unchanging settlement or payout. Nothing is stored in Storage, and the old driver APK can open it with the phone's browser.
- Callable `payoutConfirm({payoutId, response: 'received' | 'problem', note?})` (driver): the driver confirms or reports a problem, and the fleet sees it.
- Bulk option: export the period's unpaid lines as CSV (name, GCash number, amount). The fleet can use it with GCash for Business bulk transfer, then upload the references.

### 4. Documents

| Document | From → to | Contents |
|---|---|---|
| **Settlement statement and platform-fee invoice** | Para → fleet | Period, units, views, gross, Para fee, amount remitted, per-driver amounts owed |
| **Payout receipt** | Fleet → driver | Receipt no., fleet, driver, period, views, amount, GCash (masked), GCash reference, date paid |

These are payout statements and acknowledgement receipts, **not BIR official receipts or invoices** (see Q4).

### 5. Portal (`para-portal`)

- **Payouts** page, replacing "Coming soon":
  - **Fleet role:** their own settlements, each driver line with Pay / Paid status, "Mark as paid" (GCash reference), CSV export, and receipt download.
  - **Admin:** every fleet's settlements, "Mark remitted", and overdue payouts.
- Permissions: the `fleet` role gets `payouts:read` and a new `payouts:write`, both scoped to its own fleet. Admins also get `payouts:remit`. `settlements`, `payouts`, `payoutCarry` and `docLinks` have no client access: everything goes through the callables.

### 6. Driver app (`para`)

- Duty hub earnings card: replace "Daily Auto-Release to GCash every 11:59 PM" with "Paid by {fleet} by GCash • next payout {date}".
- **Payouts** list (Earnings tab): one row per period with Pending, Paid or Problem reported, and a **receipt** opened as a PDF that can be shared.
- "I received it" and "Report a problem" buttons on a paid payout (Q5).
- The rest of the Earnings tab (the old pool and base wage mock-ups) is unchanged in this feature; it is a separate clean-up.

## Acceptance criteria (to be finalised after the questions)

- AC1 Every view's driver share is recorded under the fleet that owned the unit at the time. The per-fleet driver totals equal `driverEarnings` for the same days.
- AC2 Closing a period creates one settlement per fleet with earnings. In it, gross = fleet + drivers + Para fee exactly (in µ₱), and each driver line matches that driver's earnings in that fleet's units.
- AC3 Rounding to centavos never overpays, and the remainder appears in the driver's next settlement.
- AC4 Only an admin can mark a settlement remitted. Only the owning fleet (or an admin) can mark its drivers paid. A fleet can never see another fleet's settlements or drivers.
- AC5 Marking a driver paid needs a GCash reference. It creates exactly one receipt with the next number for that fleet, and the same line can't be paid twice.
- AC6 The receipt PDF shows every field in section 4, with the GCash number masked. Only that driver, their fleet and admins can open it.
- AC7 The driver app shows the fleet payout text, the payout list with statuses, and the receipts.
- AC8 The amounts in a settlement and a receipt never change after creation. Only the remittance, the paid status and the driver's response are added.
- AC9 Unit tests for the period close and rounding, rules tests for access, and an emulator scenario: simulated views for 2 fleets → close → remit → pay → receipt.

## Decisions (the proposed answers, approved 2026-11-17)

- **Q1 Period:** weekly (Mon–Sun, paid by Wednesday) or daily? A driver makes about ₱5/day today, so daily GCash transfers of a few pesos aren't practical. *Proposed: weekly.*
- **Q2 Para → fleet:** in v1, does Para's admin send the money manually and record it? Can a fleet pay drivers before Para has remitted (from its own funds)? *Proposed: manual record; paying early is allowed.*
- **Q3 Fleet → driver:** the fleet sends GCash itself and types in the reference (v1). Automatic disbursement later. *Proposed: yes.*
- **Q4 Tax:** Is Para's fee to the fleet a VAT/BIR invoice, and do fleets need BIR-registered receipts for drivers? *Proposed: v1 issues statements and acknowledgement receipts only. Check with an accountant before going live.*
- **Q5 Driver confirmation:** should drivers confirm "received" or report a problem? *Proposed: yes, optional.* Built: the buttons; the 7-day auto-confirm is left out (an unanswered payout just stays "Paid").
- **Q6 Minimum payout:** carry forward amounts under a minimum, e.g. ₱20? *Proposed: no minimum to start.*

## Out of scope (v1)

- Moving money through GCash, PayMongo or Xendit APIs.
- BIR-registered e-invoicing and tax withholding.
- Commuter wallet top-ups and refunds.

## Build results (2026-11-17)

- **Backend** (`para-backend/functions/src/payouts/`):
  - `settle.ts`: weeks, totals from views, rounding and carry, masking; pure code.
  - `pdf.ts`: the receipt and statement PDFs, using pdf-lib.
  - `model.ts`.
  - `payoutFunctions.ts`: `settlementsWeekly`, `settlementsClose`, `settlementsList`, `settlementMarkRemitted`, `payoutMarkPaid`, `payoutsMine`, `payoutConfirm`, `documentLink`, `documentPdf`, `docLinksCleanup`.
  - New permissions `payouts:write` (fleet and admins) and `payouts:remit` (admins). The fleet role also gets `payouts:read`.
  - Drivers get an optional `gcash` field.
  - Documented in `para-backend/docs/api.md`.
- **Unit tests:** 28/28 (8 new: weeks, totals, the plan's ₱90.60 example, carry, masking, the PDFs). Lint is clean.
- **Emulator scenario** (`scenarioPayouts.js`): 45/45 checks.
  - 2 fleets and 3 drivers over a past week.
  - The current week and a non-Monday are refused.
  - Fleets can't close weeks.
  - Closing twice changes nothing.
  - Each driver's line equals their shares, rounded down.
  - Gross = drivers + fleet + Para fee exactly, and paid + carried + fee = gross.
  - The next week's view is excluded.
  - The driver's GCash number is used, or the phone as a fallback.
  - Remainders are carried.
  - Fleet scoping holds for listing, paying and documents.
  - The driver sees "unpaid", then "paid" with the receipt number; the GCash number is masked.
  - A driver can't confirm before payment, and a problem report needs a note.
  - The GCash reference is required, a line can't be paid twice, and receipt numbers run on without gaps.
  - Remittance is admin-only and recorded once.
  - The receipt and statement PDFs open.
  - Expired and made-up links are refused.
  - AC1–AC6 and AC8 are verified.
- **Portal:**
  - **Driver Payouts** page (replaces "Payout & Pool Audits"): flow steps, the total still to pay, one card per fleet-week with totals, remittance status and paid count, and driver lines with Mark paid / Receipt.
  - Statement PDF, CSV export; admins also get Mark remitted and Close a week.
  - The Add Driver form has an optional "GCash Number for Payouts".
  - Checked in the browser on the emulator at desktop and phone width: marking a demo driver paid gave PR-000002, and the receipt PDF opened.
- **Driver app:**
  - **Payouts from your fleet** on the Earnings tab replaces the mock "Recent Disbursements". It shows the week, fleet, views, amount and status, with Receipt (opens the PDF link in the browser, so it works on the current APK through an OTA), I received it, and Report a problem.
  - The Duty hub now says "Paid weekly by {fleet} to your GCash every Monday".
  - Tests: FleetPayouts (6), Earnings payouts (2), Duty hub text (1). Full Jest: 457 pass; the 6 failures are the same older ones.
- **Not done or not verified:**
  - Not deployed. The deploy needs Cloud Scheduler for the two scheduled functions, and `documentPdf` must allow public invocation.
  - The driver app screens weren't checked on a device.
  - The rest of the Earnings tab (pool and base-wage mock-ups, "Instant GCash Cash-in") still shows mock content.
  - There is no driver edit form in the portal, so a GCash number can only be set when the driver is added.

## Payout flow and roles (2026-11-18)

Asked for by the user: Para pays the fleet, and the fleet pays each driver. Para reviews each request; the fleet sees what it receives and what it owes.

- **Flow** of a closed week:
  - `ready`: the fleet requests its payout (GCash or bank account, remembered) → `requested`.
  - Para approves it → `approved`, or declines with a reason the fleet sees → `declined` (the fleet can request again).
  - Para sends the money and records the reference → `sent`.
  - The fleet confirms it arrived → `received`.
  - Every step is kept in the settlement's history.
- **Decisions** (defaults, since the user didn't choose): Para approves each request by hand (no auto-approval). The fleet records driver payments only after Para has sent the week's money. Para's staff can't record the fleet's driver payments.
- **Portal, Para (admin):**
  - "Fleet Payouts", grouped as Requests to review, Approved • to send, Waiting for the fleet, Sent.
  - Each week shows: pay out to fleet, for its drivers, fleet share, Para fee (kept), views, and the fleet's full payout account.
  - Actions: Approve / Decline (reason) / Mark sent. The driver list is read-only.
  - "This week so far" shows what's owed to each fleet.
- **Portal, fleet:**
  - "Payouts" shows Receive from Para = Pay to drivers + Your share, with status Ready to request / Requested • pending / Approved / Declined (reason) / Sent by Para / Received.
  - Actions: Request payout / Request again / Confirm received.
  - Drivers show "Pay after Para sends" until the money is sent, then Mark paid with the GCash reference, which creates the receipt.
  - "This week so far" shows what the fleet will receive and what it owes its drivers.
- **Backend:** `flow.ts` (states and account checks); `payoutRequest`, `payoutReview`, `payoutConfirmReceived`, `settlementsCurrent`; `settlementMarkRemitted` now requires approval; `payoutMarkPaid` is fleet-only and needs `sent`.
- **Checks:**
  - Backend unit tests: 44/44.
  - Emulator scenario: 24/24. It covers the order of steps, who may do each step, the decline reason, requesting again, sending once, drivers waiting for Para's money, and the full history.
  - Portal checked in the browser as the test admin and the test fleet: request → review → approve → mark sent.

## Request payout any time (2026-11-18)

Asked for by the user: fleets can request their payout whenever they want, based on the shares earned so far, without waiting for the week to close.

- **Settling by moment, not by week:**
  - Each fleet has a *settled-through* time.
  - `payoutRequestNow` settles everything after it, up to now, and files the request in one step. It's marked "Requested mid-week", needs at least ₱1.00, and Para reviews it like any other request.
  - The Monday close settles only what is left.
  - Each view is paid once: shown in tests and on the emulator.
- **Portal:**
  - The fleet's running total is "Since your last payout", with **Request payout now** (disabled under ₱1.00).
  - Para sees "Not paid out yet" per fleet.
  - Payout cards show a "Requested mid-week" badge.
- **Checks:**
  - Backend: 44/44.
  - New emulator scenario: 14/14. Requesting includes last week's unsettled views; nothing is left running afterwards; requesting again with nothing new is refused; under ₱1.00 is refused and keeps running; a second request takes only the new views; the Monday close doesn't count them again; paid + carried = earned; then review → send → driver paid.
  - Earlier flow scenario: 24/24.
  - Portal checked in the browser as the test fleet (₱4.00 requested mid-week).

