import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';
import { TabBarIcon } from './TabBarIcon';

describe('TabBarIcon', () => {
  it('shows the brand indicator dot when focused (AC19)', async () => {
    await render(<TabBarIcon name="commute" color={colors.brandStrong} focused />);
    const dot = screen.getByTestId('tab-indicator-dot');
    expect(dot).toBeOnTheScreen();
    expect(StyleSheet.flatten(dot.props.style)).toMatchObject({ backgroundColor: colors.brand, borderRadius: radius.full });
    // The label tint is brandStrong; the focused icon itself is painted brand (non-text).
    expect(StyleSheet.flatten(screen.getByTestId('tabbar-icon-focused').props.style).color).toBe(colors.brand);
  });

  it('hides the indicator dot when not focused', async () => {
    await render(<TabBarIcon name="commute" color={colors.textMuted} focused={false} />);
    expect(screen.queryByTestId('tab-indicator-dot')).toBeNull();
  });
});
