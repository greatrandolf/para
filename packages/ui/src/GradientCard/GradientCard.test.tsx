import { render, screen } from '@testing-library/react-native';
import { processColor, StyleSheet, Text } from 'react-native';

import { colors, elevation, gradients, radius } from '../theme';
import { GradientCard } from './GradientCard';

describe('GradientCard', () => {
  // Regression (D4): radius, overflow and shadow on the LinearGradient itself left the
  // fill square on iOS. The frame must sit on an outer View and the clip on an inner View.
  // v3 (light) brings the soft level-1 shadow back on the outer view.
  it('puts the radius, border and shadow on an outer View and clips the gradient in an inner View', async () => {
    await render(
      <GradientCard preset="credits" testID="card" style={{ padding: 20 }}>
        <Text>Body</Text>
      </GradientCard>,
    );
    const outer = screen.getByTestId('card');
    const outerStyle = StyleSheet.flatten(outer.props.style);
    expect(outerStyle.borderRadius).toBe(radius.md);
    expect(outerStyle.borderWidth).toBe(1);
    expect(outerStyle.borderColor).toBe(colors.borderSubtle);
    expect(outerStyle.boxShadow).toBe(elevation.level1);
    expect(outerStyle.overflow).toBeUndefined();

    const clip = screen.getByTestId('card-clip');
    const clipStyle = StyleSheet.flatten(clip.props.style);
    expect(clipStyle.borderRadius).toBe(radius.md);
    expect(clipStyle.overflow).toBe('hidden');
    expect(clipStyle.boxShadow).toBeUndefined();

    const gradient = screen.getByTestId('card-gradient');
    const gradientStyle = StyleSheet.flatten(gradient.props.style);
    expect(gradientStyle.boxShadow).toBeUndefined();
    // Caller style (padding) still applies to the content box.
    expect(gradientStyle.padding).toBe(20);
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('paints the preset stops (AC50)', async () => {
    await render(<GradientCard preset="credits" testID="credits" />);
    expect(screen.getByTestId('credits-gradient').props.colors).toEqual(gradients.credits.map((stop) => processColor(stop)));
    expect(gradients.credits).toEqual(['#FFF1E8', '#FFDBCE']);
  });
});
