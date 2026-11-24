import type { IconName } from '@packages/ui/Icon';

export type VehicleType = 'jeepney' | 'bus';

/** Visual family of the vehicle tag on a route card. */
export type VehicleStyle = 'mixedJeepney' | 'cityBus' | 'modernJeepney' | 'traditionalJeepney';

export type RouteStatus = 'active' | 'offline';

export interface TransitRoute {
  id: string;
  /** Route code without the `#`, e.g. `04-C`. Used in testIDs. */
  code: string;
  name: string;
  vehicleType: VehicleType;
  vehicleStyle: VehicleStyle;
  vehicleLabel: string;
  vehicleIcon: IconName;
  vehiclesOnRoad: number;
  via: string;
  /** e.g. `9.2 km`. */
  distance: string;
  stops: number;
  baseFare: number;
  /** ₱ charged per live view (0 when offline). */
  trackPassFare: number;
  status: RouteStatus;
  /** Live jeeps on the road per direction, e.g. "Going to Sto. Niño" • 1 (routes from the backend). */
  directionsOnRoad?: { label: string; count: number }[];
}

export type RouteFilter = 'all' | 'jeepney' | 'bus';

export interface RouteFilterOption {
  value: RouteFilter;
  label: string;
  icon: IconName;
}

export interface RecentView {
  id: string;
  routeName: string;
  status: string;
  viewedAgo: string;
  vehiclesTracked: number;
}

export interface CommuterProfile {
  firstName: string;
  initials: string;
  balance: number;
  /** Route code the commuter usually rides; the Live Map starts with it. */
  preferredRouteCode: string;
}

export type TravelDirection = 'apas' | 'colon';

export interface TrackedUnit {
  id: string;
  name: string;
  eta: string;
  tracked?: boolean;
}

export interface DirectionUnits {
  id: TravelDirection;
  label: string;
  /** Long label used by the in-sheet direction selector. */
  selectorLabel: string;
  icon: IconName;
  units: TrackedUnit[];
}

export interface LiveTrip {
  routeCode: string;
  routeTag: string;
  title: string;
  passTimeLeft: string;
  corridorLabel: string;
  vehiclesActive: number;
  directions: DirectionUnits[];
  defaultDirection: TravelDirection;
  description: string;
  telemetryNote: string;
  guaranteeNote: string;
  roadShield: string;
  pickup: { title: string; subtitle: string };
  vehiclePlate: string;
  stopNote: string;
  mapLabels: string[];
  eta: { label: string; nextStop: string; minutes: number; status: string };
  vehicleClass: string;
  routeLine: string;
  driver: { name: string; initials: string; rating: number; safeTrips: string };
  lastGpsSeconds: number;
  accuracyNote: string;
  pass: { title: string; subtitle: string; status: string };
}

/** Visual tone of a Live Map route option (revision 4). */
export type RouteOptionTone = 'best' | 'alternative' | 'preferred';

/** One tappable route option in the Live Map sheet (revision 4). */
export interface RouteOption {
  /** Route code, e.g. `17D`. Used in testIDs. */
  code: string;
  name: string;
  badge: string;
  tone: RouteOptionTone;
  subtitle: string;
  /** Display ETA, e.g. `5 min`. */
  eta: string;
  /** Small caption under the ETA, e.g. `ETA` or `18m left`. */
  etaCaption: string;
}

export interface TopUpPackage {
  amount: number;
  views: string;
  perk: string;
  perkIcon: IconName;
  tag?: string;
}

export type PaymentChannelId = 'gcash' | 'maya' | 'shopeepay' | 'seven-eleven';

export interface PaymentChannel {
  id: PaymentChannelId;
  name: string;
  icon: IconName;
}

export type LedgerKind = 'view' | 'cashIn';

export type LedgerFilter = 'all' | 'views' | 'cashin';

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  title: string;
  time: string;
  ref: string;
  status: string;
  statusTone: 'success' | 'neutral' | 'warning';
  /** Signed amount in ₱: -1 for a view, +50 for a cash-in, 0 for a refunded view. */
  amount: number;
  note: string;
  icon: IconName;
}

export interface WalletSummary {
  balance: number;
  sessionsAvailable: number;
  ledgerCount: number;
}
