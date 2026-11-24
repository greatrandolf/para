import type {
  Assignment,
  BroadcastStatus,
  ComplianceDoc,
  DirectionInfo,
  DisbursementSummary,
  DriverIdentity,
  DriverMetrics,
  DriverProfileDetails,
  DutyBaseSupport,
  EarningsSummary,
  PoolShare,
  PoolTelemetry,
  RadarSnapshot,
  StopDemand,
} from '@/types/driver';

export const driverIdentity: DriverIdentity = {
  id: 'DRV-0042',
  shortName: 'Mang Ernesto',
  fullName: 'Mang Ernesto Santos',
  legalName: 'Ernesto V. Santos',
  initials: 'E',
  fullInitials: 'ES',
  rating: 4.9,
  safeTrips: '2,410',
  cooperative: 'Cebu City South Transport Coop (CCSTC)',
  rank: 'Active Master',
  status: 'ON DUTY',
  walletBalance: 1420.5,
};

export const assignment: Assignment = {
  vehicleTag: 'E-JEEP',
  unitLabel: 'Jeepney #08 • NDF-4821',
  vehicleDescription: 'Modern Electric Mini-Bus (22-seater • CCTV Active)',
  routeLabel: 'Cebu City Route 17B • Apas ⇄ Carbon',
  corridor: 'IT Park (Apas) ⇄ Carbon Market (Colon)',
};

/** Both directions, copied from the design's `initRoute17BSwitcher` script. */
export const directions: DirectionInfo[] = [
  {
    id: 'apas',
    tabLabel: 'To Apas (IT Park)',
    tabIcon: 'arrow-upward',
    badge: 'OUTBOUND • TO APAS',
    origin: 'From: Carbon Market',
    density: 'Density: High',
    headway: 'Headway: 4 min',
    waypoints: ['Carbon', 'Fuente', 'Escario', 'JY Square', 'Apas IT Park'],
    currentIndex: 2,
    nextStop: 'N. Escario Central (Parklane)',
    radarStop: 'Escario Central / Cebu Parklane - 350m',
    radarPax: '14 Waiting',
  },
  {
    id: 'colon',
    tabLabel: 'To Colon (Carbon)',
    tabIcon: 'arrow-downward',
    badge: 'INBOUND • TO COLON',
    origin: 'From: Apas IT Park Terminal',
    density: 'Density: Very High',
    headway: 'Headway: 3 min',
    waypoints: ['Apas IT Park', 'JY Square', 'Fuente', 'Jones Ave', 'Carbon Market'],
    currentIndex: 2,
    nextStop: 'Fuente Osmeña Circle / Bogo Bus',
    radarStop: 'Fuente Osmeña Circle - 280m',
    radarPax: '22 Waiting',
  },
];

export const broadcastStatus: BroadcastStatus = {
  battery: 94,
  pingInterval: 'Every 6s',
  foregroundService: 'STABLE',
  speed: 'Speed: 22 km/h',
  paxWaiting: '+14 pax waiting',
  radarNote: 'Next scheduled Route 17B stop',
};

export const dutyBaseSupport: DutyBaseSupport = {
  monthlyBase: 600,
  days: 30,
  dailyCredit: 20,
  completedDays: 18,
  accrued: 360,
};

export const poolShare: PoolShare = {
  corridor: 'Corridor: Cebu 17B (Apas ⇄ Carbon via Escario)',
  views: 194,
  minimumViews: 100,
  activeDrivers: 4,
  share: 48.5,
};

export const earningsSummary: EarningsSummary = {
  todayTotal: 682.5,
  growth: '+13.7%',
  releaseSchedule: 'Today at 11:59 PM • Direct to GCash',
  destination: '0917••••421',
  baseWage: 600,
  baseWageNote: 'Calculated at ₱600 per active scheduled shift completion (Standard LTFRB jeepney daily guarantee).',
  shiftActive: 'Shift Active: 7.5 hrs',
  shiftTarget: '• Shift Target: 8.0 hrs',
  poolAmount: 82.5,
  poolFormula:
    '₱1.00 per commuter live-view pool. Minimum threshold: 1,000 views reached (Total Corridor Views today: 1,650 views = ₱1,650 pool divided equally across 20 active Route 17B drivers).',
  corridorViews: 1650,
  minimumViews: 1000,
  poolDrivers: 20,
  thresholdNote: 'Corridor threshold achieved at 11:20 AM. All surplus views continue accumulating until midnight!',
};

export const poolTelemetry: PoolTelemetry[] = [
  {
    id: 'unlocks',
    caption: 'Unit GMD-1782 Contribution',
    value: '412 Commuter Unlocks',
    detail: '25.0% of total corridor views',
    badge: 'High Trajectory',
    badgeTone: 'emerald',
    icon: 'directions-bus',
    iconTone: 'primary',
  },
  {
    id: 'pool-size',
    caption: 'Route 17B Driver Pool Size',
    value: '20 Drivers On-Duty',
    detail: 'Equal split: ₱82.50 / driver',
    badge: 'Co-op Verified',
    badgeTone: 'info',
    icon: 'hub',
    iconTone: 'amber',
  },
  {
    id: 'tier',
    caption: 'Bonus Tier Level',
    value: 'Tier 2 Unlocked',
    detail: 'Target Tier 3: 2,000 views (+₱25)',
    badge: '1,000–1,999',
    badgeTone: 'amberSolid',
    icon: 'military-tech',
    iconTone: 'emerald',
  },
];

export const disbursements: DisbursementSummary = {
  monthLabel: 'November Payout MTD',
  monthToDate: 14840,
  shiftsCompleted: 21,
  entries: [
    {
      id: 'nov-8',
      label: 'Yesterday (Nov 8)',
      reference: 'Ref #GC-9938102 • Direct GCash',
      amount: 710,
      note: 'Disbursed 11:59 PM',
    },
    {
      id: 'nov-7',
      label: 'Thursday (Nov 7)',
      reference: 'Ref #GC-9912093 • Direct GCash',
      amount: 665,
      note: 'Disbursed 11:59 PM',
    },
  ],
};

export const radarSnapshot: RadarSnapshot = {
  rtkLock: 'RTK LOCK 99.8%',
  corridor: '17B: IT Park ⇄ Carbon via Escario',
  fareNote: '₱1/view active',
  plate: 'GMD-1782',
  unit: 'UNIT #23',
  heading: 'N. Escario ➔ Capitol',
  ping: '2s Ping',
  headway: '+4m 12s ideal',
  ahead: { unit: 'Unit 14', gap: '650m ahead (3m gap)' },
  behind: { unit: 'Unit 09', gap: '-1.2km' },
  stopCluster: { name: 'Escario Central', pax: '18 pax' },
  nextStopCallout: { name: 'Capitol Stop', pax: '14 pax waiting' },
  flow: 'Escario: Moderate Flow',
  speed: 28,
  speedLimit: 35,
  seatsUsed: 15,
  seatsTotal: 23,
  nextStation: 'Escario Central Mall (Stop #08)',
  eta: '2m 40s',
  views: 412,
  viewsEarned: 412,
};

export const stopDemand: StopDemand[] = [
  { id: 'it-park', name: 'IT Park Term', pax: 32, label: 'High Surge', level: 'high', icon: 'trending-up' },
  { id: 'escario', name: 'Escario Ctr', pax: 18, label: 'Approaching', level: 'approaching', icon: 'bolt' },
  { id: 'fuente', name: 'Fuente Rotunda', pax: 14, label: 'Steady Flow', level: 'steady', icon: 'check-circle' },
];

export const driverMetrics: DriverMetrics = {
  metrics: [
    { id: 'punctuality', value: '96.4%', label: 'Headway Punctuality', icon: 'timer', tone: 'emerald' },
    { id: 'active', value: '8.2 hrs', label: 'Avg Active Daily', icon: 'av-timer', tone: 'primary' },
    { id: 'eco', value: '92/100', label: 'Eco Efficiency', icon: 'eco', tone: 'amber' },
  ],
};

export const driverProfileDetails: DriverProfileDetails = {
  certifications: [
    { id: 'ltfrb', label: 'LTFRB Modern PUV Verified', icon: 'verified-user' },
    { id: 'rtk', label: 'RTK Telemetry Certified', icon: 'satellite-alt' },
    { id: 'record', label: 'Clean Driving Record 2026', icon: 'workspace-premium' },
  ],
  unitNumber: 'UNIT #17',
  plate: 'GMD-1782',
  classification: 'Isuzu NLR Class 2',
  routeTag: 'ROUTE 17B',
  terminals: 'IT Park ⇄ Carbon Terminal',
  via: 'via Escario, Capitol & Osmeña Blvd',
  capacity: '23 Passengers',
  cameraStatus: 'Online & Beaconing',
  checklist: 'Cleared Nov 9, 2026 • 05:15 AM (Terminal South)',
  payoutWallet: 'GCash Transit Wallet',
  payoutNumber: '0917-882-9421',
  payoutNote: 'Fares auto-credited daily at 11:59 PM after cooperative gross deductions.',
  savingsRate: '5.0% withheld from fare total',
  savingsTotal: 42150,
  versionLine: 'Para Operator v2.4.1 • CCSTC Fleet ID: 0042',
};

export const complianceDocs: ComplianceDoc[] = [
  {
    id: 'license',
    title: "Professional Driver's License",
    subtitle: 'Valid until Oct 24, 2028 (Restr: 2, 3)',
    icon: 'featured-play-list',
  },
  {
    id: 'cpc',
    title: 'LTFRB Operator CPC Franchise',
    subtitle: 'CPC-2024-CCSTC-0917 • Modern PUV',
    icon: 'policy',
  },
  {
    id: 'philhealth',
    title: 'PhilHealth & SSS Transit ID',
    subtitle: 'Cooperative Member In Good Standing',
    icon: 'health-and-safety',
  },
];
