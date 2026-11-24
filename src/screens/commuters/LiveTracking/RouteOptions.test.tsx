import { render, screen } from '@testing-library/react-native';

import type { RouteOption } from '@/types/commuter';

import { RouteOptions, selectedFirst } from './RouteOptions';

const option = (code: string): RouteOption => ({
  code,
  name: `Route ${code}`,
  badge: 'ALTERNATIVE',
  tone: 'alternative',
  subtitle: 'No live jeeps yet',
  eta: '—',
  etaCaption: 'NO ETA',
});

describe('RouteOptions order (preferred-route)', () => {
  const options = [option('17B'), option('14D'), option('17C')];

  it('puts the selected route first and keeps the others in order', () => {
    expect(selectedFirst(options, '14D').map((o) => o.code)).toEqual(['14D', '17B', '17C']);
    expect(selectedFirst(options, '17C').map((o) => o.code)).toEqual(['17C', '17B', '14D']);
    expect(selectedFirst(options, undefined).map((o) => o.code)).toEqual(['17B', '14D', '17C']);
    expect(selectedFirst(options, 'XX').map((o) => o.code)).toEqual(['17B', '14D', '17C']);
  });

  it('draws the selected card as the first row', async () => {
    await render(<RouteOptions options={options} selectedCode="14D" onSelect={jest.fn()} />);
    const cards = screen.getAllByRole('radio');
    expect(cards[0]).toHaveProp('testID', 'route-option-14D');
    expect(cards[0]).toBeChecked();
  });
});
