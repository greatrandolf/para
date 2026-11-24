import { colors, gradients, type ColorToken, type GradientName } from './colors';

/**
 * WCAG 2.x contrast helpers for the v3 light palette (feature plan
 * "Contrast"). `contrast.test.ts` asserts every pair in `contrastPairs` meets
 * its minimum and every pair in `forbiddenPairs` stays below its threshold, so
 * the table cannot silently drift when a token changes.
 */

type Rgba = { r: number; g: number; b: number; a: number };

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGBA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

/** Parses `#rgb`, `#rrggbb`, `rgb()` and `rgba()` strings. */
export function parseColor(value: string): Rgba {
  const hex = HEX.exec(value);
  if (hex) {
    const raw = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba = RGBA.exec(value);
  if (rgba) {
    return { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]), a: rgba[4] === undefined ? 1 : Number(rgba[4]) };
  }
  throw new Error(`Unsupported colour: ${value}`);
}

/** Alpha-composites `top` over an opaque `bottom`. */
function composite(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an opaque colour (translucent colours are composited over `canvas`). */
export function relativeLuminance(value: string, over: string = colors.canvas): number {
  let rgba = parseColor(value);
  if (rgba.a < 1) rgba = composite(rgba, parseColor(over));
  return 0.2126 * channel(rgba.r) + 0.7152 * channel(rgba.g) + 0.0722 * channel(rgba.b);
}

/**
 * WCAG contrast ratio of `fg` on `bg`. A translucent `bg` (glass, scrim) is
 * composited over `over` first (default: the white `surfaceCard`), and a
 * translucent `fg` is composited over the resulting background.
 */
export function contrastRatio(fg: string, bg: string, over: string = colors.surfaceCard): number {
  let back = parseColor(bg);
  if (back.a < 1) back = composite(back, parseColor(over));
  let front = parseColor(fg);
  if (front.a < 1) front = composite(front, back);
  const l1 = 0.2126 * channel(front.r) + 0.7152 * channel(front.g) + 0.0722 * channel(front.b);
  const l2 = 0.2126 * channel(back.r) + 0.7152 * channel(back.g) + 0.0722 * channel(back.b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** `text`: body copy (4.5:1). `large`: large text (3:1). `nonText`: indicators and borders (3:1). */
export type ContrastKind = 'text' | 'large' | 'nonText';

export type ContrastPair = {
  fg: ColorToken;
  bg: ColorToken;
  /** Base surface under a translucent `bg` (defaults to `surfaceCard`). */
  over?: ColorToken;
  kind: ContrastKind;
  /** Minimum ratio. Defaults to 4.5 for `text`, 3 otherwise. */
  min?: number;
  use: string;
};

export const MIN_RATIO: Record<ContrastKind, number> = { text: 4.5, large: 3, nonText: 3 };

/**
 * The user-accepted minimum for white bold labels on the bright orange
 * `brandAction` fill (plan Q12 / W2). Applies to that pair only.
 */
export const BRAND_ACTION_MIN_RATIO = 3;

/** The light surface tiers text can sit on. */
export const SURFACE_TIERS = [
  'surfaceCard',
  'canvas',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
] as const satisfies readonly ColorToken[];

/** The opaque accent tints. */
export const TINTS = ['brandTint', 'liveTint', 'amberTint', 'errorTint'] as const satisfies readonly ColorToken[];

const on = (fg: ColorToken, bgs: readonly ColorToken[], use: string, kind: ContrastKind = 'text'): ContrastPair[] =>
  bgs.map((bg) => ({ fg, bg, kind, use }));

/** Allowed foreground/background pairs (plan "Contrast" table). */
export const contrastPairs: ContrastPair[] = [
  ...on('onSurface', [...SURFACE_TIERS, ...TINTS], 'primary text'),
  ...on('textMuted', [...SURFACE_TIERS, ...TINTS], 'secondary text, placeholders'),
  // W2 (user decision): bright orange fills with bold white labels, >= 3.0 only.
  { fg: 'onBrandAction', bg: 'brandAction', kind: 'text', min: BRAND_ACTION_MIN_RATIO, use: 'primary button, route badge, selected chip, ETA banner (W2)' },
  { fg: 'onBrandAction', bg: 'brandPressed', kind: 'text', min: BRAND_ACTION_MIN_RATIO, use: 'pressed primary button (W2)' },
  ...on('brandStrong', [...SURFACE_TIERS, 'brandTint', 'primaryFixed'], 'small orange text'),
  ...on('liveStrong', ['surfaceCard', 'liveTint', 'surfaceContainer'], 'green text'),
  ...on('amberStrong', ['surfaceCard', 'canvas', 'surfaceContainerLow', 'amberTint', 'brandTint'], 'fare text'),
  ...on('error', ['surfaceCard', 'errorTint', 'errorContainer'], 'error text'),
  ...on('onDark', ['crimsonAlert', 'ink', 'liveStrong'], 'text on saturated fills'),
  { fg: 'onAmber', bg: 'amber', kind: 'text', use: 'fare buttons and solid fare badges' },
  { fg: 'secondary', bg: 'surfaceContainer', kind: 'text', use: 'info badge' },
  ...on('mapLabel', ['mapLand', 'surfaceBg'], 'map text'),
  // Large text only (LARGE_TEXT_VARIANTS).
  ...on('neonOrangeDeep', ['surfaceCard', 'canvas', 'surfaceContainerLow', 'brandTint', 'surfaceContainer'], 'large orange metrics', 'large'),
  // Revision 4: Live Map route options.
  { fg: 'onDark', bg: 'preferred', kind: 'text', use: 'preferred route code tile' },
  ...on('preferredStrong', ['surfaceCard', 'preferredTint', 'brandTint'], 'preferred badge label and ETA'),
  { fg: 'textMuted', bg: 'surfaceBg', kind: 'text', use: 'alternative route badge' },
  // Required non-text graphics.
  { fg: 'brand', bg: 'surfaceCard', kind: 'nonText', use: 'active tab icon and dot, selected borders, Switch track' },
  { fg: 'onBrand', bg: 'brand', kind: 'nonText', use: 'pin and brand-mark glyphs' },
  { fg: 'liveStrong', bg: 'mapLand', kind: 'nonText', use: 'user dot' },
  { fg: 'textMuted', bg: 'surfaceCard', kind: 'nonText', use: 'inactive tab icon' },
];

export type ForbiddenPair = {
  fg: string;
  bg: ColorToken;
  /** The ratio the pair must stay below. Defaults to 4.5 (text). */
  max?: number;
  use: string;
};

/** Pairs that must stay below their threshold (plan "Contrast", forbidden rows). */
export const forbiddenPairs: ForbiddenPair[] = [
  { fg: '#FFFFFF', bg: 'brand', use: 'white small text on brand (W1)' },
  { fg: '#FFFFFF', bg: 'neonOrangeDeep', use: 'white small text on neonOrangeDeep' },
  { fg: colors.brand, bg: 'surfaceCard', use: 'brand as text (W3)' },
  { fg: colors.brand, bg: 'canvas', use: 'brand as text (W3)' },
  { fg: colors.brand, bg: 'surfaceContainerLow', use: 'brand as text (W3)' },
  { fg: colors.brand, bg: 'brandTint', use: 'brand as text (W3)' },
  { fg: colors.live, bg: 'surfaceCard', use: 'live as text (W4)' },
  { fg: colors.amber, bg: 'surfaceCard', use: 'amber as text (W4)' },
  { fg: colors.crimsonAlert, bg: 'errorTint', use: 'crimsonAlert as text (W4)' },
  { fg: colors.amberStrong, bg: 'surfaceContainer', use: 'fare text on the blue container' },
  { fg: colors.amberStrong, bg: 'surfaceContainerHigh', use: 'fare text on the blue container' },
  { fg: colors.neonOrangeDeep, bg: 'surfaceContainerHighest', max: 3, use: 'large orange text on the highest tier' },
  { fg: colors.textSubtle, bg: 'surfaceContainer', use: 'subtle is never required text' },
];

/** Text colours used on each gradient preset. Each must pass against every stop. */
export const gradientTextColors: Record<GradientName, { fg: ColorToken; kind: ContrastKind }[]> = {
  credits: [
    { fg: 'onSurface', kind: 'text' },
    { fg: 'textMuted', kind: 'text' },
    { fg: 'brandStrong', kind: 'text' },
  ],
  broadcast: [
    { fg: 'onDark', kind: 'text' },
    { fg: 'onDarkMuted', kind: 'text' },
    { fg: 'tertiaryFixed', kind: 'nonText' },
  ],
  broadcastPaused: [
    { fg: 'onDark', kind: 'text' },
    { fg: 'onDarkMuted', kind: 'text' },
  ],
  poolBanner: [
    { fg: 'onDark', kind: 'text' },
    { fg: 'onDarkMuted', kind: 'text' },
    { fg: 'tertiaryFixed', kind: 'nonText' },
  ],
  viewsAmber: [{ fg: 'onAmber', kind: 'text' }],
  dailyEarnings: [
    { fg: 'onSurface', kind: 'text' },
    { fg: 'textMuted', kind: 'text' },
    { fg: 'brandStrong', kind: 'text' },
    { fg: 'neonOrangeDeep', kind: 'large' },
  ],
  radarMap: [{ fg: 'mapLabel', kind: 'text' }],
};

/** Lowest contrast of `fg` across every stop of a gradient preset (`bg` optionally layered over each stop). */
export function gradientContrast(preset: GradientName, fg: string, layer?: string): number {
  return Math.min(...gradients[preset].map((stop) => (layer ? contrastRatio(fg, layer, stop) : contrastRatio(fg, stop))));
}
