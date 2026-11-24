import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, elevation, radius } from '../theme';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label as an accessible button and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress and reports disabled when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="No Charge (₱0)" onPress={onPress} disabled testID="btn" />);

    const button = screen.getByTestId('btn');
    expect(button).toBeDisabled();
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('draws the primary CTA in bright orange with a bold white label and the CTA glow (W2)', async () => {
    await render(<Button label="View Live (₱1)" testID="cta" />);
    const box = StyleSheet.flatten(screen.getByTestId('cta').props.style);
    expect(box).toMatchObject({
      backgroundColor: colors.brandAction,
      borderRadius: radius.base,
      boxShadow: elevation.ctaGlow,
    });
    expect(colors.brandAction).toBe('#FF5500');
    const label = StyleSheet.flatten(screen.getByText('View Live (₱1)').props.style);
    expect(label.color).toBe(colors.onBrandAction);
    expect(label.fontFamily).toBe('HankenGrotesk_700Bold');
  });

  it('drops the glow and greys out when disabled', async () => {
    await render(<Button label="No Charge (₱0)" disabled testID="off" />);
    const box = StyleSheet.flatten(screen.getByTestId('off').props.style);
    expect(box.backgroundColor).toBe(colors.surfaceContainerHigh);
    expect(box.boxShadow).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByText('No Charge (₱0)').props.style).color).toBe(colors.textMuted);
  });

  it.each([
    ['secondary', colors.surfaceCard, colors.brandStrong],
    ['danger', colors.crimsonAlert, colors.onDark],
    ['tonal-dark', colors.ink, colors.onDark],
    ['glass', colors.glassFill, colors.onDark],
  ] as const)('styles the %s variant per the v3 rules', async (variant, fill, text) => {
    await render(<Button label={variant} variant={variant} testID={variant} />);
    expect(StyleSheet.flatten(screen.getByTestId(variant).props.style).backgroundColor).toBe(fill);
    expect(StyleSheet.flatten(screen.getByText(variant).props.style).color).toBe(text);
  });
});
