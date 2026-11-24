/**
 * Para Live colour tokens, design system v3 ("Electric Transit Engine",
 * `stitch/DESIGN.md`). Light only: there is one palette, no dark scheme.
 *
 * This folder is the only place hex / rgba literals are allowed (enforced by
 * ESLint `no-restricted-syntax`).
 *
 * The palette has three layers (feature plan "Design system v3 (light)"):
 * 1. `designColors`: all 57 DESIGN.md v3 front-matter keys, camelCased, with
 *    the exact DESIGN values. `primaryContainer` (#ff5e00), `neonOrangeBright`
 *    and `neonOrangeGlow` are kept for fidelity only; lint forbids reading
 *    `colors.primaryContainer` outside this folder.
 * 2. `brandColors`: the user's brand (#FF5500) and the semantic accent layer.
 * 3. `extensionColors`: DESIGN prose values, tints, overlays and map colours.
 *
 * White-on-orange rule (plan "Contrast"):
 * - W1. White on `brand` is for icons, glyphs and large text.
 * - W2 (user decision). Orange fills that carry text (primary buttons, route
 *   badges, selected chips and segments, the ETA banner) are bright `#FF5500`
 *   (`brandAction`) with white bold labels (`onBrandAction`). 3.21:1, an
 *   accepted AA exception asserted at >= 3.0 in `contrast.test.ts`.
 * - W3. Orange text never uses `brand`: small text uses `brandStrong`, large
 *   text (`LARGE_TEXT_VARIANTS`) may use `neonOrangeDeep`.
 * - W4. `live`, `amber` and `crimsonAlert` are never text colours; use
 *   `liveStrong`, `amberStrong` and `error`.
 */
const designColors = {
  surface: '#f8f9ff',
  surfaceDim: '#cbdbf5',
  surfaceBright: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#5b4137',
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',
  outline: '#8f7065',
  outlineVariant: '#e4bfb1',
  surfaceTint: '#a63b00',
  primary: '#a63b00',
  onPrimary: '#ffffff',
  primaryContainer: '#ff5e00',
  onPrimaryContainer: '#531900',
  inversePrimary: '#ffb599',
  secondary: '#565e74',
  onSecondary: '#ffffff',
  secondaryContainer: '#dae2fd',
  onSecondaryContainer: '#5c647a',
  tertiary: '#006c4b',
  onTertiary: '#ffffff',
  tertiaryContainer: '#00a876',
  onTertiaryContainer: '#003422',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#ffdbce',
  primaryFixedDim: '#ffb599',
  onPrimaryFixed: '#370e00',
  onPrimaryFixedVariant: '#7f2b00',
  secondaryFixed: '#dae2fd',
  secondaryFixedDim: '#bec6e0',
  onSecondaryFixed: '#131b2e',
  onSecondaryFixedVariant: '#3f465c',
  tertiaryFixed: '#71fbc0',
  tertiaryFixedDim: '#50dea5',
  onTertiaryFixed: '#002114',
  onTertiaryFixedVariant: '#005137',
  background: '#f8f9ff',
  onBackground: '#0b1c30',
  surfaceVariant: '#d3e4fe',
  // DESIGN.md custom keys.
  neonOrangeBright: '#ff6b00',
  neonOrangeDeep: '#ea5200',
  neonOrangeSubtle: '#fff1e8',
  neonOrangeGlow: 'rgba(255, 94, 0, 0.28)',
  amberFare: '#f59e0b',
  emeraldActive: '#00b37e',
  crimsonAlert: '#e11d48',
  surfaceBg: '#f8fafc',
  surfaceCard: '#ffffff',
  surfaceBorder: '#e2e8f0',
} as const;

/** The user's brand and the semantic accent layer (plan "brandColors"). */
const brandColors = {
  /** Non-text and icon fills: brand mark, icon tiles, active tab icon and dot, pins, route line, selected borders. Never a text colour. */
  brand: '#FF5500',
  /** White icons and large text on `brand` (3.21:1, W1). */
  onBrand: '#FFFFFF',
  /** Fills under white labels: primary button, route and `brandSolid` badges, selected chips and segments, ETA banner (W2 user decision). */
  brandAction: '#FF5500',
  /** Bold white labels and icons on `brandAction` (3.21:1, W2). */
  onBrandAction: '#FFFFFF',
  /** Pressed `brandAction` (DESIGN `neon-orange-deep`, white 3.68:1). */
  brandPressed: '#EA5200',
  /** Small orange text on any light surface (DESIGN `primary`, >= 5.0:1). */
  brandStrong: '#A63B00',
  /** Live dots, pulses, live progress fills and segments (DESIGN `emerald-active`). Non-text only. */
  live: '#00B37E',
  /** Green text, the `liveSolid` badge fill and the user dot (DESIGN `tertiary`). */
  liveStrong: '#006C4B',
  /** Text on dark or saturated fills: teal and slate gradients, `ink`, `liveStrong`, `crimsonAlert`, glass. */
  onDark: '#FFFFFF',
  /** Secondary text on the teal and slate gradients. */
  onDarkMuted: '#CCFBF1',
  /** Fare fills (DESIGN `amber-fare`). Never a text colour. */
  amber: '#F59E0B',
  /** Text on `amber` (DESIGN `on-surface`, 7.99:1). */
  onAmber: '#0B1C30',
  /** Fare, wallet and earnings text (DESIGN heavy-traffic badge text). */
  amberStrong: '#B45309',
  /** Deep Transit Slate (DESIGN `overrideSecondaryColor`): `tonal-dark` fill, floating-control icons. */
  ink: '#0F172A',
  /** Screen and scene background, splash, root view (DESIGN `background`). */
  canvas: '#F8F9FF',
} as const;

const extensionColors = {
  transparent: 'transparent',

  /** Secondary text, inactive tab tint, placeholders, ghost buttons, map labels (Q9; >= 5.88:1 everywhere). */
  textMuted: '#475569',
  /** DESIGN neutral. Completed timeline nodes, disabled glyphs, dividers. Non-text only. */
  textSubtle: '#64748B',
  /** Card, top bar and tab bar borders (DESIGN `surface-border`). */
  borderSubtle: '#E2E8F0',
  /** Inputs, unselected chips and selectable cards, dashed offline card, avatar ring, sheet handle. */
  borderStrong: '#CBD5E1',

  // Opaque light tints (DESIGN prose).
  /** Brand badge, selected-card fill, icon tiles (DESIGN `neon-orange-subtle`). */
  brandTint: '#FFF1E8',
  /** Live badge fill, user accuracy ring (DESIGN emerald tint). */
  liveTint: '#ECFDF5',
  /** Fare badge, balance card (DESIGN amber tint). */
  amberTint: '#FFFBEB',
  /** `danger-soft` fill, error badge. */
  errorTint: '#FFF1F2',

  // Preferred-route accent (revision 4, Live Map route options). Light-blue family
  // tuned for AA: white bold code on `preferred`, `preferredStrong` text on white and tint.
  /** Preferred route code tile under bold white text (4.79:1). */
  preferred: '#0277BD',
  /** Blue text: the preferred badge label and ETA (>= 5.1:1 on white, tint and brandTint). */
  preferredStrong: '#0369A1',
  /** Preferred badge fill. */
  preferredTint: '#E0F2FE',
  /** Preferred badge border (non-text). */
  preferredBorder: '#BAE6FD',

  // Overlays.
  scrim: 'rgba(15, 23, 42, 0.50)',
  pulseBrand: 'rgba(255, 85, 0, 0.25)',
  pulseLive: 'rgba(0, 179, 126, 0.25)',
  /** Buttons and badges inside the teal and slate gradient cards. */
  glassFill: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.32)',
  /** See-through white on the orange arrival card (its tag and ETA box). */
  onBrandGlass: 'rgba(255, 255, 255, 0.18)',
  onBrandGlassBorder: 'rgba(255, 255, 255, 0.35)',
  onBrandMuted: 'rgba(255, 255, 255, 0.82)',
  /** Full-screen photo viewer backdrop (para-ads), and its muted text. */
  photoBackdrop: '#000000',
  onPhotoMuted: 'rgba(255, 255, 255, 0.72)',

  // Stylised light map canvas (DESIGN Level 0).
  mapLand: '#F1F5F9',
  mapWater: '#D3E4FE',
  mapRoad: '#FFFFFF',
  mapRoadMinor: '#E2E8F0',
  mapLabel: '#475569',
} as const;

/** The only palette (light). */
export const colors = { ...designColors, ...brandColors, ...extensionColors } as const;

export type ColorToken = keyof typeof colors;
export type DesignColorKey = keyof typeof designColors;
export const designColorKeys = Object.keys(designColors) as DesignColorKey[];
export { designColors };

/**
 * Named gradient presets for `GradientCard` (expo-linear-gradient), plan Q7.
 * Each preset stays in one hue family so its text colours hold contrast at
 * both stops (asserted in `contrast.test.ts`).
 */
export const gradients = {
  /** Wallet "COMMUTER TRANSIT CREDITS": orange tint. */
  credits: ['#FFF1E8', '#FFDBCE'],
  /** Duty "BROADCASTING LIVE": teal. */
  broadcast: ['#0E7490', '#115E59'],
  /** Duty "TRACKING PAUSED": slate. */
  broadcastPaused: ['#475569', '#334155'],
  /** Earnings "ROUTE 17B DRIVER POOL": teal. */
  poolBanner: ['#0E7490', '#115E59'],
  /** Radar "412 Commuter Views": amber. */
  viewsAmber: ['#F59E0B', '#FBBF24'],
  /** Duty "TODAY'S INSTANT DAILY EARNINGS": white to orange tint. */
  dailyEarnings: ['#FFFFFF', '#FFF1E8'],
  /** Radar map ground. */
  radarMap: ['#F8FAFC', '#F1F5F9'],
} as const satisfies Record<string, readonly [string, string, ...string[]]>;

export type GradientName = keyof typeof gradients;
