/** Driver app shapes returned by the para-backend callables (see para-backend/docs/api.md). */

export type DriverStatus = 'active' | 'available' | 'standby' | 'leave';
export type VehicleStatus = 'active' | 'standby' | 'maintenance' | 'inactive';
export type VehicleType = 'modern' | 'traditional' | 'electric';
/**
 * What the driver is doing on the assignment. A new assignment is `ready` until the driver taps Start Tracking.
 * Live GPS is sent only while `in_service`.
 */
export type DutyStatus = 'ready' | 'in_service' | 'on_break' | 'off_duty';

/** What `driverMe` returns: the signed-in driver and the unit and route their fleet assigned (read-only). */
export type DriverMe = {
  driver: {
    id: string;
    driverNo: string;
    name: string;
    status: DriverStatus;
    /** "YYYY-MM" */
    licenseExpiry: string;
    licenseRenewalSoon: boolean;
  };
  fleet: { name: string };
  assignment: {
    unitCode: string;
    plate: string;
    type: VehicleType;
    make: string;
    seats: number;
    vehicleStatus: VehicleStatus;
    routeId: string | null;
    routeCode: string | null;
    routeName: string | null;
    /** "YYYY-MM-DD" */
    start: string | null;
    /** The ongoing assignment record; null when the unit is set without one. */
    id: string | null;
    dutyStatus: DutyStatus;
  } | null;
};

/** `driverDutySet` / `driverShiftEnd`: the driver's ongoing assignment after the change. */
export type DriverDuty = { assignmentId: string | null; dutyStatus: DutyStatus };

/** `driverAccessActivate`: a Firebase custom token for this phone. */
export type DriverActivationResult = { customToken: string; driverName: string };

/** One week's payout from the driver's fleet (`payoutsMine`, fleet-driver-payouts). Money in centavos / micro-pesos. */
export type DriverPayout = {
  settlementId: string;
  fleetName: string;
  /** Monday and Sunday, "YYYY-MM-DD" (Manila). */
  periodStart: string;
  periodEnd: string;
  views: number;
  unitEarnedMicro: number;
  driverMicro: number;
  payCentavos: number;
  /** `unpaid`: the fleet has not sent it yet; `carried`: under ₱0.01, added to next week. */
  status: 'unpaid' | 'paid' | 'carried';
  gcashMasked: string;
  payoutId: string | null;
  receiptNo: string | null;
  reference: string | null;
  paidAt: number | null;
  driverResponse: { response: 'received' | 'problem'; note: string; at: number } | null;
};

export type ConfirmPayoutInput = { settlementId: string; response: 'received' | 'problem'; note?: string };

/** One unit's part of a driver's day (driver-unit-earnings). Money in micro-pesos (₱1 = 1,000,000). */
export type UnitDay = {
  vehicleId: string;
  unitCode: string;
  plate: string;
  routeCode: string;
  ownerUid: string;
  views: number;
  driverMicro: number;
  unitEarnedMicro: number;
};

/** A driver's day: totals, and per unit driven (largest first; empty for days before the breakdown). */
export type DriverDay = {
  day: string;
  views: number;
  driverMicro: number;
  unitEarnedMicro: number;
  driverPct: number | null;
  units: UnitDay[];
};

/** `driverEarningsSummary`: a period's days (newest first) and totals per unit, with fleet names by owner. */
export type EarningsSummary = {
  from: string;
  to: string;
  days: DriverDay[];
  totals: { views: number; driverMicro: number; unitEarnedMicro: number; units: UnitDay[] };
  fleets: Record<string, string>;
};

/** One ₱1 view that paid the driver (never the commuter or the other drivers). */
export type EarningEntry = {
  id: string;
  at: number;
  vehicleId: string;
  unitCode: string;
  plate: string;
  routeCode: string;
  direction: string;
  /** How many jeepneys shared the ₱1, this one included. */
  sharedWith: number;
  unitShareMicro: number;
  driverMicro: number;
};

/** `driverEarningsDay`: one page (50) of a day's views, newest first. */
export type EarningsDayPage = { day: DriverDay; entries: EarningEntry[]; next: string | null };

/** Where a view's money came from: ₱1 from the wallet, a Google rewarded ad, or a business's Para Ad. */
export type EarningSource = 'paid' | 'ad' | 'paraAd';
export type SourceTotals = Record<EarningSource, { views: number; driverMicro: number }>;

/**
 * `driverPayBalance` (driver-pay-balance): what the driver is still owed. Settled-but-unpaid lines (e.g. a payout
 * the fleet requested and is waiting on) plus views since the fleet's last settlement. Money in micro-pesos.
 */
export type PayBalance = {
  toPayMicro: number;
  toPayViews: number;
  settledUnpaid: { driverMicro: number; views: number; payCentavos: number };
  pending: { views: number; driverMicro: number; sources: SourceTotals };
};
