import { render, screen } from '@testing-library/react-native';

import { ArrivalEtaCard } from './ArrivalEtaCard';

describe('ArrivalEtaCard', () => {
  it('shows the minutes and where to board', async () => {
    await render(
      <ArrivalEtaCard minutes={3} stopName="Escario Capitol" detail="You're on the road" tag="₱1 PAID" testID="arrival" />,
    );
    expect(screen.getByText('Unlocked arrival ETA')).toBeTruthy();
    expect(screen.getByTestId('arrival-minutes')).toHaveTextContent('3MINS');
    expect(screen.getByText('Board at: Escario Capitol')).toBeTruthy();
    expect(screen.getByText('ON THE WAY')).toBeTruthy();
    expect(screen.getByTestId('arrival-tag')).toHaveTextContent('₱1 PAID');
    expect(screen.getByText("You're on the road")).toBeTruthy();
    expect(screen.getByTestId('arrival').props.accessibilityLabel).toBe(
      'Unlocked arrival ETA: 3 minutes, board at Escario Capitol',
    );
  });

  it('uses the singular for 1 minute', async () => {
    await render(<ArrivalEtaCard minutes={1} testID="arrival" />);
    expect(screen.getByTestId('arrival-minutes')).toHaveTextContent('1MIN');
  });

  it('waits when no jeep is heading to the stop', async () => {
    await render(<ArrivalEtaCard testID="arrival" />);
    expect(screen.getByTestId('arrival-minutes')).toHaveTextContent('—');
    expect(screen.getByText('WAITING')).toBeTruthy();
    expect(screen.getByText('No jeep heading to your stop yet')).toBeTruthy();
  });
});
