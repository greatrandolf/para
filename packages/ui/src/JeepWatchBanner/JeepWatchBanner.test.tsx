import { fireEvent, render, screen } from '@testing-library/react-native';

import { JeepWatchBanner } from './JeepWatchBanner';

describe('JeepWatchBanner', () => {
  it('while watching: says it is free, shows minutes left, and Cancel stops it', async () => {
    const onCancel = jest.fn();
    await render(<JeepWatchBanner status="watching" minutesLeft={28} fare="₱1" onView={jest.fn()} onCancel={onCancel} />);
    expect(screen.getByText('Watching for jeepneys coming your way')).toBeOnTheScreen();
    expect(screen.getByText("We'll tell you when one is coming. Free • 28 min left.")).toBeOnTheScreen();
    expect(screen.queryByTestId('jeep-watch-banner-view')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Stop watching' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('when one is coming: names the route and offers the paid view', async () => {
    const onView = jest.fn();
    await render(
      <JeepWatchBanner status="coming" count={1} routeCodes={['17B']} fare="₱1" onView={onView} onCancel={jest.fn()} />,
    );
    expect(screen.getByText('17B is coming your way')).toBeOnTheScreen();
    expect(screen.getByText('See it live for ₱1.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: '₱1 view live' }));
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it('counts several jeepneys on several routes', async () => {
    await render(
      <JeepWatchBanner
        status="coming"
        count={3}
        routeCodes={['17B', '14D']}
        fare="₱1"
        onView={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('3 jeepneys coming your way (17B, 14D)')).toBeOnTheScreen();
  });
});
