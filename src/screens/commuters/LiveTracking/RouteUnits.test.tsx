import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RouteUnit } from './commuteOptions';
import { RouteUnits } from './RouteUnits';

const units: RouteUnit[] = [
  { driverId: 'a', unitCode: 'PARA-0006', plate: 'GMD-2938', coming: true, minutes: 3, seatsFree: 6 },
  { driverId: 'b', unitCode: 'PARA-0011', plate: 'GMD-1782', coming: true, minutes: 7 },
  { driverId: 'c', unitCode: 'PARA-0020', plate: 'ABC-1234', coming: false },
];

describe('RouteUnits (route-units)', () => {
  it('lists the jeeps on the route, the nearest coming one tracked', async () => {
    await render(<RouteUnits routeCode="14D" units={units} />);
    expect(screen.getByText('3 jeeps on Route 14D')).toBeTruthy();
    expect(screen.getByTestId('route-unit-a')).toHaveTextContent('PARA-0006 • GMD-2938', { exact: false });
    expect(screen.getByTestId('route-unit-a')).toHaveTextContent('Tracked', { exact: false });
    expect(screen.getByTestId('route-unit-a')).toHaveTextContent('6 seats free', { exact: false });
    expect(screen.getByTestId('route-unit-b')).toHaveTextContent('7 min', { exact: false });
    expect(screen.getByTestId('route-unit-b')).not.toHaveTextContent('Tracked', { exact: false });
    expect(screen.getByTestId('route-unit-c')).toHaveTextContent('Not your way', { exact: false });
  });

  it('collapses and opens like a dropdown', async () => {
    await render(<RouteUnits routeCode="14D" units={units} />);
    await fireEvent.press(screen.getByTestId('route-units-14D-toggle'));
    expect(screen.queryByTestId('route-unit-a')).toBeNull();
    await fireEvent.press(screen.getByTestId('route-units-14D-toggle'));
    expect(screen.getByTestId('route-unit-a')).toBeOnTheScreen();
  });

  it('shows nothing without jeeps', async () => {
    await render(<RouteUnits routeCode="14D" units={[]} />);
    expect(screen.queryByTestId('route-units-14D')).toBeNull();
  });
});
