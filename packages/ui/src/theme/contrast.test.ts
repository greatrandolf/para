import { colors, gradients, type GradientName } from './colors';
import {
  BRAND_ACTION_MIN_RATIO,
  contrastPairs,
  contrastRatio,
  forbiddenPairs,
  gradientContrast,
  gradientTextColors,
  MIN_RATIO,
  parseColor,
} from './contrast';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // Symmetric.
    expect(contrastRatio(colors.onBrand, colors.brand)).toBeCloseTo(contrastRatio(colors.brand, colors.onBrand), 5);
  });

  it('measures the documented brand pairs', () => {
    expect(contrastRatio('#ffffff', colors.brand)).toBeCloseTo(3.21, 1);
    expect(contrastRatio('#ffffff', colors.neonOrangeDeep)).toBeCloseTo(3.68, 1);
    expect(contrastRatio(colors.brandStrong, colors.surfaceCard)).toBeCloseTo(6.47, 1);
  });

  it('alpha-composites translucent fills over their base surface', () => {
    expect(parseColor(colors.glassFill).a).toBeCloseTo(0.08);
    const overWhite = contrastRatio(colors.onSurface, colors.scrim);
    const overCanvas = contrastRatio(colors.onSurface, colors.scrim, colors.ink);
    expect(overWhite).not.toBeCloseTo(overCanvas, 3);
  });
});

describe('contrastPairs (WCAG AA)', () => {
  it.each(contrastPairs.map((pair) => [`${pair.fg} on ${pair.bg}${pair.over ? ` over ${pair.over}` : ''} (${pair.use})`, pair]))(
    '%s',
    (_name, pair) => {
      const min = pair.min ?? MIN_RATIO[pair.kind];
      const over = pair.over ? colors[pair.over] : undefined;
      expect(contrastRatio(colors[pair.fg], colors[pair.bg], over)).toBeGreaterThanOrEqual(min);
    },
  );

  it('holds body text to 4.5:1 everywhere except the user-accepted brandAction pair (W2)', () => {
    for (const pair of contrastPairs) {
      if (pair.kind !== 'text') continue;
      const isBrandAction = pair.fg === 'onBrandAction' && (pair.bg === 'brandAction' || pair.bg === 'brandPressed');
      expect({ pair: `${pair.fg}/${pair.bg}`, min: pair.min ?? MIN_RATIO.text }).toEqual({
        pair: `${pair.fg}/${pair.bg}`,
        min: isBrandAction ? BRAND_ACTION_MIN_RATIO : MIN_RATIO.text,
      });
    }
  });

  it('uses bright #FF5500 with white labels for orange fills that carry text (W2)', () => {
    expect(colors.brandAction).toBe(colors.brand);
    expect(colors.onBrandAction).toBe('#FFFFFF');
    expect(contrastRatio(colors.onBrandAction, colors.brandAction)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.onBrandAction, colors.brandPressed)).toBeGreaterThanOrEqual(3);
  });
});

describe('Live Map route options (revision 4)', () => {
  it('lists the new route-option pairs', () => {
    const listed = contrastPairs.map((pair) => `${pair.fg}/${pair.bg}/${pair.kind}`);
    expect(listed).toEqual(
      expect.arrayContaining([
        'onBrandAction/brandAction/text',
        'onDark/preferred/text',
        'onDark/ink/text',
        'preferredStrong/surfaceCard/text',
        'preferredStrong/preferredTint/text',
        'preferredStrong/brandTint/text',
        'textMuted/surfaceBg/text',
        'neonOrangeDeep/surfaceCard/large',
        'neonOrangeDeep/brandTint/large',
      ]),
    );
  });

  it('keeps the preferred blue text at AA on white and on its tint', () => {
    expect(contrastRatio(colors.preferredStrong, colors.surfaceCard)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.preferredStrong, colors.preferredTint)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.onDark, colors.preferred)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('forbiddenPairs', () => {
  it.each(forbiddenPairs.map((pair) => [`${pair.fg} on ${pair.bg} (${pair.use})`, pair]))('%s stays below its threshold', (_name, pair) => {
    expect(contrastRatio(pair.fg, colors[pair.bg])).toBeLessThan(pair.max ?? MIN_RATIO.text);
  });
});

describe('gradient presets', () => {
  const rows = (Object.keys(gradientTextColors) as GradientName[]).flatMap((preset) =>
    gradientTextColors[preset].map((text) => [`${text.fg} on ${preset}`, preset, text] as const),
  );

  it('covers every preset', () => {
    expect(Object.keys(gradientTextColors).sort()).toEqual(Object.keys(gradients).sort());
  });

  it.each(rows)('%s reaches its minimum against every stop', (_name, preset, text) => {
    expect(gradientContrast(preset, colors[text.fg])).toBeGreaterThanOrEqual(MIN_RATIO[text.kind]);
  });

  it('keeps glass button text readable on the teal gradient', () => {
    expect(gradientContrast('broadcast', colors.onDark, colors.glassFill)).toBeGreaterThanOrEqual(4.5);
    expect(gradientContrast('broadcastPaused', colors.onDark, colors.glassFill)).toBeGreaterThanOrEqual(4.5);
  });

  it('never puts white text on the light gradients', () => {
    for (const preset of ['credits', 'dailyEarnings'] as const) {
      expect(gradientContrast(preset, '#ffffff')).toBeLessThan(4.5);
    }
  });
});
