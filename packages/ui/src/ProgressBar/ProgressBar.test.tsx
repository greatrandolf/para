import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';
import { clampProgress, ProgressBar } from './ProgressBar';

describe('clampProgress', () => {
  it('clamps to the 0–1 range', () => {
    expect(clampProgress(-0.5)).toBe(0);
    expect(clampProgress(0.6)).toBe(0.6);
    expect(clampProgress(1.94)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe('ProgressBar', () => {
  it('reports a clamped accessibility value and fill width', async () => {
    await render(<ProgressBar value={1.94} testID="bar" accessibilityLabel="Pool views" />);
    const bar = screen.getByTestId('bar');
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
    expect(StyleSheet.flatten(screen.getByTestId('bar-fill').props.style).width).toBe('100%');
  });

  it('draws a second segment that never overflows the track', async () => {
    await render(<ProgressBar value={0.6} secondary={{ value: 0.8, tone: 'fare' }} testID="two" />);
    expect(StyleSheet.flatten(screen.getByTestId('two-fill').props.style).width).toBe('60%');
    const second = StyleSheet.flatten(screen.getByTestId('two-fill-2').props.style).width as string;
    expect(parseFloat(second)).toBeCloseTo(40);
  });

  it('draws a full-radius track on the highest surface (AC48)', async () => {
    await render(<ProgressBar value={0.5} tone="live" testID="tone" />);
    const track = StyleSheet.flatten(screen.getByTestId('tone').props.style);
    expect(track).toMatchObject({ borderRadius: radius.full, backgroundColor: colors.surfaceContainerHighest });
  });

  it.each([
    ['brand', colors.brand],
    ['live', colors.live],
    ['fare', colors.amber],
    ['neutral', colors.textSubtle],
  ] as const)('fills the %s tone with its v3 token', async (tone, color) => {
    await render(<ProgressBar value={0.5} tone={tone} testID={`bar-${tone}`} />);
    expect(StyleSheet.flatten(screen.getByTestId(`bar-${tone}-fill`).props.style).backgroundColor).toBe(color);
  });
});
