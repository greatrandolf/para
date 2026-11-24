import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DutyHubScreen } from './DutyHubScreen';

const mockLoad = () => jest.requireMock('@/hooks/usePassengerLoad').mockLoad as { saved: number[] };

describe('Live passenger load card (Revision 21)', () => {
  beforeEach(() => {
    mockLoad().saved = [];
  });

  it('is hidden until the driver starts tracking, and hides again on a break', async () => {
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    for (const status of ['ready', 'on_break', 'off_duty']) {
      duty.dutyStatus = status;
      await render(<DutyHubScreen />);
      expect(screen.queryByTestId('passenger-load-card')).toBeNull();
    }
    duty.dutyStatus = 'in_service';
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('passenger-load-card')).toBeOnTheScreen();
  });

  it('has the fixed top bar, then the assignment and the load card scrolling with the page (Revision 22b)', async () => {
    await render(<DutyHubScreen />);
    expect(screen.getByText('Para Live')).toBeOnTheScreen(); // fixed top bar
    const header = screen.getByTestId('driver-hub-header'); // assignment, scrolls with the page
    expect(header).toHaveTextContent(/U-08 • NDF-4821/);
    expect(header).toHaveTextContent(/17B • Apas ⇄ Carbon/);
    expect(screen.getByTestId('passenger-load-card')).toBeOnTheScreen();
    expect(screen.getByTestId('duty-hub-scroll').props.stickyHeaderIndices).toBeUndefined();
  });

  it('shows on the Driver Hub for the unit, empty to start', async () => {
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('passenger-load-card')).toBeOnTheScreen();
    expect(screen.getByTestId('load-percent')).toHaveTextContent('0%');
    expect(screen.getByTestId('load-available')).toHaveTextContent('22 seats available');
    expect(screen.getByTestId('load-level')).toHaveTextContent('EMPTY');
  });

  it('sets the load from the presets', async () => {
    await render(<DutyHubScreen />);
    await act(async () => fireEvent.press(screen.getByTestId('load-preset-heavy')));
    expect(screen.getByTestId('load-percent')).toHaveTextContent('82%');
    expect(screen.getByTestId('load-level')).toHaveTextContent('HEAVY LOAD');
    await act(async () => fireEvent.press(screen.getByTestId('load-preset-half')));
    expect(screen.getByTestId('load-seats')).toHaveTextContent(/^11 \/ 22/);
    expect(screen.getByTestId('load-level')).toHaveTextContent('MODERATE LOAD');
    await act(async () => fireEvent.press(screen.getByTestId('load-preset-standing')));
    expect(screen.getByTestId('load-seats')).toHaveTextContent(/^22 \/ 22/);
    expect(mockLoad().saved).toEqual([18, 11, 22]);
  });

  it('ignores an up/down swipe that starts on the slider (scrolling the page)', async () => {
    await render(<DutyHubScreen />);
    const slider = screen.getByTestId('load-slider');
    const at = (pageX: number, pageY: number) => ({ nativeEvent: { pageX, pageY } });
    slider.props.onTouchStart(at(100, 300));
    expect(slider.props.onMoveShouldSetResponder(at(110, 200))).toBe(false); // mostly vertical
    expect(slider.props.onMoveShouldSetResponder(at(103, 301))).toBe(false); // barely moved
    expect(slider.props.onMoveShouldSetResponder(at(160, 305))).toBe(true); // sideways drag
    expect(slider.props.onStartShouldSetResponder()).toBe(false); // never on touch-down
  });

  it('works with a screen reader (adjustable, ± one seat)', async () => {
    await render(<DutyHubScreen />);
    const slider = screen.getByTestId('load-slider');
    expect(slider).toHaveProp('accessibilityRole', 'adjustable');
    await act(async () => slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
    expect(screen.getByTestId('load-seats')).toHaveTextContent(/^1 \/ 22/);
  });
});
