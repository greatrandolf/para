import { fonts } from './fonts';

/** Converts a DESIGN.md `em` letter-spacing to React Native points. */
const em = (value: number, fontSize: number) => Math.round(value * fontSize * 100) / 100;

/**
 * The 12 DESIGN.md v2 text styles (camelCased DESIGN names) plus two
 * documented extensions:
 * - `labelAction` (plan Q8): button labels. JetBrains Mono would truncate long
 *   button copy at 375 pt, so buttons use Hanken Grotesk 700.
 * - `metricDisplay`: large amounts and counters, in JetBrains Mono.
 *
 * Weight is carried by the family name only (no `fontWeight`), so Android does
 * not fall back to the system font.
 */
export const typography = {
  displayHero: { fontFamily: fonts.spaceBold, fontSize: 56, lineHeight: 64, letterSpacing: em(-0.03, 56) },
  displayHeroMobile: { fontFamily: fonts.spaceBold, fontSize: 36, lineHeight: 44, letterSpacing: em(-0.02, 36) },
  headlineLg: { fontFamily: fonts.spaceBold, fontSize: 32, lineHeight: 40, letterSpacing: em(-0.02, 32) },
  headlineLgMobile: { fontFamily: fonts.spaceBold, fontSize: 26, lineHeight: 32, letterSpacing: em(-0.01, 26) },
  headlineMd: { fontFamily: fonts.spaceSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  headlineSm: { fontFamily: fonts.spaceSemiBold, fontSize: 18, lineHeight: 24, letterSpacing: 0 },
  bodyLg: { fontFamily: fonts.hankenRegular, fontSize: 18, lineHeight: 28, letterSpacing: 0 },
  bodyMd: { fontFamily: fonts.hankenRegular, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodySm: { fontFamily: fonts.hankenRegular, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  labelTelemetry: { fontFamily: fonts.monoSemiBold, fontSize: 14, lineHeight: 18, letterSpacing: em(0.04, 14) },
  labelEta: { fontFamily: fonts.monoBold, fontSize: 20, lineHeight: 24, letterSpacing: em(-0.01, 20) },
  labelBadge: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 14, letterSpacing: em(0.08, 11) },
  // Extensions (documented in the feature plan).
  labelAction: { fontFamily: fonts.hankenBold, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  metricDisplay: { fontFamily: fonts.monoBold, fontSize: 28, lineHeight: 32, letterSpacing: em(-0.02, 28) },
} as const;

export type TypographyVariant = keyof typeof typography;

/** The 12 style names defined by DESIGN.md (the rest are extensions). */
export const designTypographyKeys = [
  'displayHero',
  'displayHeroMobile',
  'headlineLg',
  'headlineLgMobile',
  'headlineMd',
  'headlineSm',
  'bodyLg',
  'bodyMd',
  'bodySm',
  'labelTelemetry',
  'labelEta',
  'labelBadge',
] as const satisfies readonly TypographyVariant[];

export type FontRole = 'space' | 'hanken' | 'mono';

/** Which font family a variant belongs to, used for weight overrides. */
export const variantFamily: Record<TypographyVariant, FontRole> = {
  displayHero: 'space',
  displayHeroMobile: 'space',
  headlineLg: 'space',
  headlineLgMobile: 'space',
  headlineMd: 'space',
  headlineSm: 'space',
  bodyLg: 'hanken',
  bodyMd: 'hanken',
  bodySm: 'hanken',
  labelTelemetry: 'mono',
  labelEta: 'mono',
  labelBadge: 'mono',
  labelAction: 'hanken',
  metricDisplay: 'mono',
};

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/**
 * Weight overrides per family. Only the loaded faces exist: Space Grotesk
 * 500–700 (`regular` maps to 500), Hanken Grotesk and JetBrains Mono 400–700.
 * `extrabold` maps to 700 everywhere.
 */
export const weightFamilies: Record<FontRole, Record<FontWeightName, string>> = {
  space: {
    regular: fonts.spaceMedium,
    medium: fonts.spaceMedium,
    semibold: fonts.spaceSemiBold,
    bold: fonts.spaceBold,
    extrabold: fonts.spaceBold,
  },
  hanken: {
    regular: fonts.hankenRegular,
    medium: fonts.hankenMedium,
    semibold: fonts.hankenSemiBold,
    bold: fonts.hankenBold,
    extrabold: fonts.hankenBold,
  },
  mono: {
    regular: fonts.monoRegular,
    medium: fonts.monoMedium,
    semibold: fonts.monoSemiBold,
    bold: fonts.monoBold,
    extrabold: fonts.monoBold,
  },
};

/**
 * WCAG "large" text: at least 24 pt, or at least 18.66 pt in a 700 face.
 * Only these variants may use `neonOrangeDeep` or white on `brand` (plan W1, W3).
 */
export const LARGE_TEXT_VARIANTS = [
  'displayHero',
  'displayHeroMobile',
  'headlineLg',
  'headlineLgMobile',
  'labelEta',
  'metricDisplay',
] as const satisfies readonly TypographyVariant[];

export type LargeTextVariant = (typeof LARGE_TEXT_VARIANTS)[number];
