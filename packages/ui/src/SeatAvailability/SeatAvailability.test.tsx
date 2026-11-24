import { render, screen } from '@testing-library/react-native';

import { colors } from '../theme';
import { SeatAvailability, seatLevel } from './SeatAvailability';

describe('SeatAvailability', () => {
  it('shows seats left, the bar and the boarded count (the design: 15 of 22)', async () => {
    await render(<SeatAvailability boarded={15} capacity={22} testID="seats" />);
    expect(screen.getByText('Seat Availability')).toBeTruthy();
    expect(screen.getByTestId('seats-left')).toHaveTextContent('7 seats left');
    expect(screen.getByText('15 / 22 Passengers Boarded')).toBeTruthy();
    expect(screen.getByTestId('seats-level')).toHaveTextContent('COMFORTABLE');
    // 15/22 fills 3 of the 4 parts, in amber.
    expect(screen.getByTestId('seats-segment-2')).toHaveStyle({ backgroundColor: colors.amber });
    expect(screen.getByTestId('seats-segment-3')).toHaveStyle({ backgroundColor: colors.surfaceContainerHigh });
  });

  it('names how full a jeep is', () => {
    expect(seatLevel(5, 22)).toBe('roomy');
    expect(seatLevel(15, 22)).toBe('comfortable');
    expect(seatLevel(20, 22)).toBe('almostFull');
    expect(seatLevel(22, 22)).toBe('full');
    expect(seatLevel(0, 0)).toBe('full');
  });

  it('says when no seat is left', async () => {
    await render(<SeatAvailability boarded={22} capacity={22} testID="seats" />);
    expect(screen.getByTestId('seats-left')).toHaveTextContent('No seats left');
    expect(screen.getByTestId('seats-level')).toHaveTextContent('FULL');
    expect(screen.getByTestId('seats-segment-3')).toHaveStyle({ backgroundColor: colors.crimsonAlert });
  });

  it('says when the driver has not updated the count, with an empty bar', async () => {
    await render(<SeatAvailability unknown testID="seats" />);
    expect(screen.getByTestId('seats-left')).toHaveTextContent('Not updated');
    expect(screen.getByText('The driver has not updated the passenger count in the last 30 minutes.')).toBeOnTheScreen();
    expect(screen.queryByTestId('seats-level')).toBeNull();
  });
});
