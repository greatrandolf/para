import type { IconName } from '@packages/ui/Icon';

export interface DriverIdentity {
  id: string;
  shortName: string;
  fullName: string;
  legalName: string;
  initials: string;
  /** Two-letter initials for the large profile avatar (e.g. "ES"). */
  fullInitials: string;
  rating: number;
  safeTrips: string;
  cooperative: string;
  rank: string;
  status: string;
  walletBalance: number;
}

export interface Assignment {
  vehicleTag: string;
  unitLabel: string;
  vehicleDescription: string;
  routeLabel: string;
  corridor: string;
}

export type DutyDirection = 'apas' | 'colon';

export interface DirectionInfo {
  id: DutyDirection;
  tabLabel: string;
  tabIcon: IconName;
  badge: string;
  origin: string;
  density: string;
  headway: string;
  waypoints: string[];
  /** Index of the highlighted (current) waypoint. */
  currentIndex: number;
  nextStop: string;
  radarStop: string;
  radarPax: string;
}

export interface BroadcastStatus {
  battery: number;
  pingInterval: string;
  foregroundService: string;
  speed: string;
  paxWaiting: string;
  radarNote: string;
}

export interface DutyBaseSupport {
  monthlyBase: number;
  days: number;
  dailyCredit: number;
  completedDays: number;
  accrued: number;
}

export interface PoolShare {
  corridor: string;
  views: number;
  minimumViews: number;
  activeDrivers: number;
  share: number;
}

export interface EarningsSummary {
  todayTotal: number;
  growth: string;
  releaseSchedule: string;
  destination: string;
  baseWage: number;
  baseWageNote: string;
  shiftActive: string;
  shiftTarget: string;
  poolAmount: number;
  poolFormula: string;
  corridorViews: number;
  minimumViews: number;
  poolDrivers: number;
  thresholdNote: string;
}

export interface PoolTelemetry {
  id: string;
  caption: string;
  value: string;
  detail: string;
  badge: string;
  badgeTone: 'emerald' | 'info' | 'amberSolid';
  icon: IconName;
  iconTone: 'primary' | 'amber' | 'emerald';
}

export interface Disbursement {
  id: string;
  label: string;
  reference: string;
  amount: number;
  note: string;
}

export interface DisbursementSummary {
  monthLabel: string;
  monthToDate: number;
  shiftsCompleted: number;
  entries: Disbursement[];
}

export type DemandLevel = 'high' | 'approaching' | 'steady';

export interface StopDemand {
  id: string;
  name: string;
  pax: number;
  label: string;
  level: DemandLevel;
  icon: IconName;
}

export interface RadarSnapshot {
  rtkLock: string;
  corridor: string;
  fareNote: string;
  plate: string;
  unit: string;
  heading: string;
  ping: string;
  headway: string;
  ahead: { unit: string; gap: string };
  behind: { unit: string; gap: string };
  stopCluster: { name: string; pax: string };
  nextStopCallout: { name: string; pax: string };
  flow: string;
  speed: number;
  speedLimit: number;
  seatsUsed: number;
  seatsTotal: number;
  nextStation: string;
  eta: string;
  views: number;
  viewsEarned: number;
}

export interface ComplianceDoc {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
}

export interface DriverMetric {
  id: string;
  value: string;
  label: string;
  icon: IconName;
  tone: 'emerald' | 'primary' | 'amber';
}

export interface DriverMetrics {
  metrics: DriverMetric[];
}

export interface Certification {
  id: string;
  label: string;
  icon: IconName;
}

export interface DriverProfileDetails {
  certifications: Certification[];
  unitNumber: string;
  plate: string;
  classification: string;
  routeTag: string;
  terminals: string;
  via: string;
  capacity: string;
  cameraStatus: string;
  checklist: string;
  payoutWallet: string;
  payoutNumber: string;
  payoutNote: string;
  savingsRate: string;
  savingsTotal: number;
  versionLine: string;
}
