import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { CorridorRadarScreen } from './CorridorRadarScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), navigate: jest.fn() } }));

describe('CorridorRadarScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the design content', async () => {
    await render(<CorridorRadarScreen />);
    expect(screen.getByTestId('screen-radar')).toBeOnTheScreen();
    expect(screen.getByText('RTK LOCK 99.8%')).toBeOnTheScreen();
    expect(screen.getByText('GMD-1782')).toBeOnTheScreen();
    expect(screen.getByText('UNIT #23')).toBeOnTheScreen();
    expect(screen.getByTestId('radar-map')).toBeOnTheScreen();
    expect(screen.getByText('Headway: +4m 12s ideal')).toBeOnTheScreen();
    expect(screen.getByText('YOU • 28 km/h')).toBeOnTheScreen();
    expect(screen.getByText('ESCARIO CENTRAL')).toBeOnTheScreen();
    expect(screen.getByText('18 pax')).toBeOnTheScreen();
    expect(screen.getByText('Capitol Stop')).toBeOnTheScreen();
    expect(screen.getByText('Live Stop Demand Heatmap')).toBeOnTheScreen();
    for (const pax of ['32', '18', '14']) expect(screen.getByText(pax)).toBeOnTheScreen();
    expect(screen.getByText('SPEED TELEMETRY')).toBeOnTheScreen();
    expect(screen.getByText('28')).toBeOnTheScreen();
    expect(screen.getByText('SAFE')).toBeOnTheScreen();
    expect(screen.getByText('SEATING MANIFEST')).toBeOnTheScreen();
    expect(screen.getByText('15')).toBeOnTheScreen();
    expect(screen.getByText('/ 23 pax')).toBeOnTheScreen();
    expect(screen.getByText(/Escario Central Mall/)).toBeOnTheScreen();
    expect(screen.getByText('2m 40s')).toBeOnTheScreen();
    expect(screen.getByText('412 Commuter Views')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Report Hazard / Baha' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Terminal Check-In' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'SOS Dispatch' })).toBeOnTheScreen();
  });

  it('opens the Earnings tab from View Pot', async () => {
    await render(<CorridorRadarScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'View Pot' }));
    expect(router.navigate).toHaveBeenCalledWith('/earnings');
  });
});
