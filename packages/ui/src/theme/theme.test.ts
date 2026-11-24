import { colors, designColorKeys, gradients } from './colors';
import { contrastRatio, relativeLuminance } from './contrast';
import { elevation, tiers } from './elevation';
import { fonts } from './fonts';
import { radius } from './radius';
import { spacing } from './spacing';
import { designTypographyKeys, LARGE_TEXT_VARIANTS, typography, variantFamily, weightFamilies } from './typography';

// The project tsconfig only loads Jest types, so `fs` is typed locally here.
const { readFileSync } = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');

/** The design sources, resolved from this test file's path. */
const STITCH = expect.getState().testPath!.replace(/packages\/ui\/src\/theme\/theme\.test\.ts$/, 'docs/features/jeeptrack-screens/stitch/');
/** v3 (light): colours, `rounded` and `spacing`. */
const frontMatter = readFileSync(`${STITCH}DESIGN.md`, 'utf8').split('---')[1];
/** v2: the type scale the user kept (plan Q6). */
const typeFrontMatter = readFileSync(`${STITCH}DESIGN-v2-dark.md`, 'utf8').split('---')[1];

const camel = (key: string) => key.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

/** Returns the indented block under a top-level front-matter key. */
function block(name: string, source: string = frontMatter): string {
  const match = new RegExp(`^${name}:\\n((?:  .*\\n?)+)`, 'm').exec(source);
  if (!match) throw new Error(`DESIGN.md has no "${name}" block`);
  return match[1];
}

const designValues = Object.fromEntries(
  [...block('colors').matchAll(/^ {2}([a-z-]+): '?(#[0-9a-f]{6}|rgba\([^)]+\))'?$/gm)].map((m) => [camel(m[1]), m[2]]),
);

const luminanceOf = (key: string) => relativeLuminance(colors[key as keyof typeof colors]);

describe('colour tokens (AC11)', () => {
  it('defines all 57 DESIGN.md v3 front-matter colours with the exact values', () => {
    expect(Object.keys(designValues)).toHaveLength(57);
    expect(designValues.neonOrangeGlow).toBe('rgba(255, 94, 0, 0.28)');
    expect([...designColorKeys].sort()).toEqual(Object.keys(designValues).sort());
    for (const [key, value] of Object.entries(designValues)) {
      expect({ key, value: colors[key as keyof typeof colors] }).toEqual({ key, value });
    }
  });

  it('uses the user brand overrides and the v3 semantic tokens', () => {
    expect(colors.brand).toBe('#FF5500');
    expect(colors.onBrand).toBe('#FFFFFF');
    // W2 (user decision): orange fills that carry text are bright #FF5500 with white labels.
    expect(colors.brandAction).toBe('#FF5500');
    expect(colors.onBrandAction).toBe('#FFFFFF');
    expect(colors.brandPressed).toBe('#EA5200');
    expect(colors.brandStrong).toBe('#A63B00');
    expect(colors.live).toBe('#00B37E');
    expect(colors.liveStrong).toBe('#006C4B');
    expect(colors.onDark).toBe('#FFFFFF');
    expect(colors.onDarkMuted).toBe('#CCFBF1');
    expect(colors.amber).toBe('#F59E0B');
    expect(colors.onAmber).toBe('#0B1C30');
    expect(colors.amberStrong).toBe('#B45309');
    expect(colors.ink).toBe('#0F172A');
    expect(colors.canvas).toBe('#F8F9FF');
  });

  it('defines the v3 extension tokens', () => {
    expect(colors).toMatchObject({
      textMuted: '#475569',
      textSubtle: '#64748B',
      borderSubtle: '#E2E8F0',
      borderStrong: '#CBD5E1',
      brandTint: '#FFF1E8',
      liveTint: '#ECFDF5',
      amberTint: '#FFFBEB',
      errorTint: '#FFF1F2',
      preferred: '#0277BD',
      preferredStrong: '#0369A1',
      preferredTint: '#E0F2FE',
      preferredBorder: '#BAE6FD',
      scrim: 'rgba(15, 23, 42, 0.50)',
      pulseBrand: 'rgba(255, 85, 0, 0.25)',
      pulseLive: 'rgba(0, 179, 126, 0.25)',
      glassFill: 'rgba(255, 255, 255, 0.08)',
      glassBorder: 'rgba(255, 255, 255, 0.32)',
      mapLand: '#F1F5F9',
      mapWater: '#D3E4FE',
      mapRoad: '#FFFFFF',
      mapRoadMinor: '#E2E8F0',
      mapLabel: '#475569',
    });
  });

  it('keeps every surface, background and canvas token light (AC44)', () => {
    const lightKeys = Object.keys(colors).filter((key) => /^(surface|background|canvas)/.test(key) && key !== 'surfaceTint');
    expect(lightKeys.length).toBeGreaterThanOrEqual(12);
    for (const key of lightKeys) {
      expect({ key, light: luminanceOf(key) > 0.6 }).toEqual({ key, light: true });
    }
  });

  it('has removed the cyan, v1 hue-named and v2 dark tokens (D12)', () => {
    const keys = Object.keys(colors);
    for (const removed of ['cyan', 'cyanTint', 'onCyan', 'pulseCyan']) expect(keys).not.toContain(removed);
    const stale = keys.filter(
      (key) =>
        key !== 'emeraldActive' &&
        /^(emerald|teal|slate|red\d|amber\d|amberText|white|whiteA|blackA|status.*Bg|routeRed|routeGreen|userDot|radarLand)/.test(key),
    );
    expect(stale).toEqual([]);
    const values = [...Object.values(colors), ...Object.values(gradients).flat()].map((v) => v.toLowerCase());
    for (const dark of ['#0a0e17', '#0f131c', '#181b25', '#1c1f29', '#262a34', '#31353f', '#dfe2ef']) {
      expect(values).not.toContain(dark);
    }
    for (const v1 of ['#dc2626', '#b70011', '#bf0715']) expect(values).not.toContain(v1);
  });

  it('exports one palette and no dark scheme (AC15)', () => {
    const theme = jest.requireActual<Record<string, unknown>>('./index');
    for (const name of ['dark', 'darkColors', 'colorSchemes']) expect(theme).not.toHaveProperty(name);
  });

  it('defines the v3 gradient stops (AC50)', () => {
    const lower = Object.fromEntries(Object.entries(gradients).map(([k, stops]) => [k, stops.map((s) => s.toLowerCase())]));
    expect(lower).toEqual({
      credits: ['#fff1e8', '#ffdbce'],
      broadcast: ['#0e7490', '#115e59'],
      broadcastPaused: ['#475569', '#334155'],
      poolBanner: ['#0e7490', '#115e59'],
      viewsAmber: ['#f59e0b', '#fbbf24'],
      dailyEarnings: ['#ffffff', '#fff1e8'],
      radarMap: ['#f8fafc', '#f1f5f9'],
    });
  });

  it('keeps small white text off the plain brand fill except via brandAction (W1, W2)', () => {
    expect(contrastRatio('#ffffff', colors.brand)).toBeLessThan(4.5);
    expect(contrastRatio(colors.onBrandAction, colors.brandAction)).toBeGreaterThanOrEqual(3);
  });
});

describe('typography tokens (AC11, AC12)', () => {
  const FAMILY_PREFIX: Record<string, string> = {
    'Space Grotesk': 'SpaceGrotesk_',
    'Hanken Grotesk': 'HankenGrotesk_',
    'JetBrains Mono': 'JetBrainsMono_',
  };
  const styles = block('typography', typeFrontMatter)
    .split(/^ {2}(?=[a-z])/m)
    .filter(Boolean)
    .map((chunk) => {
      const name = camel(/^([a-z-]+):/.exec(chunk)![1]);
      const prop = (p: string) => new RegExp(`${p}: '?([^'\\n]+)'?`).exec(chunk)?.[1];
      return {
        name,
        family: prop('fontFamily')!,
        weight: prop('fontWeight')!,
        size: parseFloat(prop('fontSize')!),
        lineHeight: parseFloat(prop('lineHeight')!),
        letterSpacingEm: prop('letterSpacing') ? parseFloat(prop('letterSpacing')!) : 0,
      };
    });

  it('defines the 12 DESIGN-v2 styles plus only labelAction and metricDisplay', () => {
    expect(styles).toHaveLength(12);
    expect(styles.map((s) => s.name)).toEqual([...designTypographyKeys]);
    expect(Object.keys(typography).sort()).toEqual([...designTypographyKeys, 'labelAction', 'metricDisplay'].sort());
  });

  it.each(styles.map((s) => [s.name, s]))('%s matches DESIGN.md size, line height, tracking and family', (_n, s) => {
    const token = typography[s.name as keyof typeof typography];
    expect(token.fontSize).toBe(s.size);
    expect(token.lineHeight).toBe(s.lineHeight);
    expect(token.letterSpacing).toBeCloseTo(s.letterSpacingEm * s.size, 2);
    expect(token.fontFamily.startsWith(FAMILY_PREFIX[s.family])).toBe(true);
    expect(token.fontFamily).toContain(`_${s.weight}`);
  });

  it('assigns families by role and never sets fontWeight', () => {
    expect(typography.labelAction.fontFamily).toBe('HankenGrotesk_700Bold');
    expect(typography.metricDisplay.fontFamily).toBe('JetBrainsMono_700Bold');
    for (const token of Object.values(typography)) {
      expect(token).not.toHaveProperty('fontWeight');
    }
  });

  it('lists the WCAG large-text variants (>= 24 pt, or >= 18.66 pt bold)', () => {
    expect([...LARGE_TEXT_VARIANTS]).toEqual(['displayHero', 'displayHeroMobile', 'headlineLg', 'headlineLgMobile', 'labelEta', 'metricDisplay']);
    for (const variant of LARGE_TEXT_VARIANTS) {
      const { fontSize, fontFamily } = typography[variant];
      expect(fontSize >= 24 || (fontSize >= 18.66 && fontFamily.includes('700'))).toBe(true);
    }
  });

  it('only maps weights to the 11 loaded faces', () => {
    const loaded = new Set(Object.values(fonts));
    expect(loaded.size).toBe(11);
    for (const family of Object.values(weightFamilies)) {
      for (const face of Object.values(family)) expect(loaded.has(face as (typeof fonts)[keyof typeof fonts])).toBe(true);
    }
    for (const [variant, role] of Object.entries(variantFamily)) {
      const face = typography[variant as keyof typeof typography].fontFamily;
      expect(Object.values(weightFamilies[role])).toContain(face);
    }
  });
});

describe('shape and spacing tokens (AC11, AC48)', () => {
  it('converts the DESIGN.md v3 rounded table (ROUND_EIGHT)', () => {
    expect(radius).toEqual({ sm: 4, base: 8, md: 12, lg: 16, xl: 24, full: 9999 });
    const rounded = Object.fromEntries(
      [...block('rounded').matchAll(/^ {2}([A-Za-z]+): ([\d.]+)(rem|px)$/gm)].map((m) => [
        m[1] === 'DEFAULT' ? 'base' : m[1],
        m[3] === 'rem' ? parseFloat(m[2]) * 16 : parseFloat(m[2]),
      ]),
    );
    expect(rounded).toEqual(radius);
  });

  it('converts the DESIGN.md v3 spacing table', () => {
    expect(spacing).toEqual({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32, gutter: 16, gutterSm: 12, margin: 16, marginLg: 24 });
    const table = Object.fromEntries(
      [...block('spacing').matchAll(/^ {2}([a-z-]+): ([\d.]+)rem$/gm)].map((m) => [m[1], parseFloat(m[2]) * 16]),
    );
    expect(spacing.xs).toBe(table['space-xs']);
    expect(spacing.sm).toBe(table['space-sm']);
    expect(spacing.md).toBe(table['space-md']);
    expect(spacing.lg).toBe(table['space-lg']);
    expect(spacing.xl).toBe(table['space-xl']);
    expect(spacing.gutter).toBe(table.gutter);
    expect(spacing.gutterSm).toBe(table['gutter-sm']);
    expect(spacing.margin).toBe(table.margin);
    expect(spacing.marginLg).toBe(table['margin-lg']);
  });

  it('exports the v3 elevation levels and glows', () => {
    expect(Object.keys(elevation).sort()).toEqual(['ctaGlow', 'focusRing', 'glowBrand', 'glowLive', 'level1', 'level2', 'level3']);
    expect(elevation.level1).toBe('0px 2px 8px -2px rgba(15, 23, 42, 0.05)');
    expect(elevation.level3).toBe('0px -16px 36px -8px rgba(15, 23, 42, 0.16)');
    expect(elevation.ctaGlow).toBe('0px 4px 14px rgba(255, 85, 0, 0.35)');
    expect(elevation.glowLive).toBe('0px 0px 12px rgba(0, 179, 126, 0.40)');
    expect(elevation.focusRing).toBe('0px 0px 0px 3px rgba(255, 85, 0, 0.25)');
  });

  it('defines the v3 tier objects', () => {
    expect(Object.keys(tiers).sort()).toEqual(['canvas', 'infoBox', 'tier1', 'tier2']);
    expect(tiers.canvas).toEqual({ backgroundColor: colors.canvas });
    expect(tiers.tier1).toEqual({
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      boxShadow: elevation.level1,
    });
    expect(tiers.tier2).toEqual({
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      boxShadow: elevation.level3,
    });
    expect(tiers.infoBox).toEqual({
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.surfaceContainerHigh,
    });
  });
});
