import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its label', async () => {
    await render(<Badge label="LIVE RADAR" tone="brand" />);
    expect(screen.getByText('LIVE RADAR')).toBeOnTheScreen();
  });

  it('renders a status dot only when requested', async () => {
    await render(<Badge label="6 on road" tone="live" dot testID="badge" />);
    expect(screen.getByTestId('badge-dot')).toBeOnTheScreen();
  });

  it('omits the status dot by default', async () => {
    await render(<Badge label="Route #04-C" tone="liveSolid" testID="plain" />);
    expect(screen.queryByTestId('plain-dot')).toBeNull();
  });

  it('is a full pill with green v3 live colours and JetBrains Mono text (AC48, AC49)', async () => {
    await render(<Badge label="LIVE" tone="live" testID="live" />);
    const box = StyleSheet.flatten(screen.getByTestId('live').props.style);
    expect(box.borderRadius).toBe(radius.full);
    expect(box.paddingHorizontal).toBeGreaterThanOrEqual(8);
    expect(box.backgroundColor).toBe(colors.liveTint);
    const text = StyleSheet.flatten(screen.getByText('LIVE').props.style);
    expect(text.fontFamily).toMatch(/^JetBrainsMono_/);
    expect(text.color).toBe(colors.liveStrong);
  });

  it('draws route identifiers in bright orange with bold white text (W2 user decision)', async () => {
    await render(<Badge label="ROUTE 17B" tone="route" testID="route" />);
    const box = StyleSheet.flatten(screen.getByTestId('route').props.style);
    expect(box).toMatchObject({ backgroundColor: colors.brandAction, borderColor: colors.brand, borderWidth: 1, borderRadius: radius.full });
    expect(colors.brandAction).toBe('#FF5500');
    const text = StyleSheet.flatten(screen.getByText('ROUTE 17B').props.style);
    expect(text.fontFamily).toBe('JetBrainsMono_700Bold');
    expect(text.color).toBe(colors.onBrandAction);
  });

  it('uses brandStrong text on the brand tint, on every tier (AC46)', async () => {
    await render(<Badge label="TRACKED" tone="brand" testID="tracked" />);
    expect(StyleSheet.flatten(screen.getByTestId('tracked').props.style).backgroundColor).toBe(colors.brandTint);
    expect(StyleSheet.flatten(screen.getByText('TRACKED').props.style).color).toBe(colors.brandStrong);
  });

  it('keeps the bright accents off badge text (W3, W4)', async () => {
    for (const tone of ['brand', 'fare', 'live', 'error'] as const) {
      await render(<Badge label={tone} tone={tone} />);
      const color = StyleSheet.flatten(screen.getByText(tone).props.style).color;
      expect([colors.brand, colors.live, colors.amber, colors.crimsonAlert]).not.toContain(color);
    }
  });
});
