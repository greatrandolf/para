import { render, screen } from '@testing-library/react-native';

import { RouteChips } from './RouteChips';
import { distanceText } from './commuteOptions';

describe('RouteChips', () => {
  it('shows the notice instead of chips when there are no routes', async () => {
    await render(<RouteChips codes={[]} onSelect={jest.fn()} notice="No routes found near you yet." />);
    expect(screen.getByTestId('route-chips-notice')).toHaveTextContent('No routes found near you yet.');
  });

  it('shows the far routes as free chips, with how far the nearest one is', async () => {
    const notice = `No route passes close to you. Showing the nearest: 17B, ${distanceText(643)} away.`;
    await render(<RouteChips codes={['17B', '04L']} selectedCode="17B" onSelect={jest.fn()} notice={notice} />);
    expect(screen.getByTestId('route-chip-17B')).toBeOnTheScreen();
    expect(screen.getByTestId('route-chip-04L')).toBeOnTheScreen();
    expect(screen.getByTestId('route-chips-notice')).toHaveTextContent(
      'No route passes close to you. Showing the nearest: 17B, 640 m away.',
    );
  });

  it('writes distances in metres or kilometres', () => {
    expect(distanceText(643)).toBe('640 m');
    expect(distanceText(1145)).toBe('1.1 km');
  });
});
