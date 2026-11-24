import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { SegmentedControl } from './SegmentedControl';

type Filter = 'all' | 'views' | 'cashin';

const OPTIONS = [
  { value: 'all', label: 'All (18)', testID: 'seg-all' },
  { value: 'views', label: 'Views (-₱1)', testID: 'seg-views' },
  { value: 'cashin', label: 'Cash-In (+₱)', testID: 'seg-cashin' },
] as const;

function Harness({ onChange }: { onChange?: (v: Filter) => void }) {
  const [value, setValue] = useState<Filter>('all');
  return (
    <SegmentedControl<Filter>
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe('SegmentedControl', () => {
  it('renders each option as a tab and marks the current value selected', async () => {
    await render(<Harness />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'All (18)' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Views (-₱1)' })).not.toBeSelected();
  });

  it('calls onChange with the typed value and moves the selection', async () => {
    const onChange = jest.fn();
    await render(<Harness onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('seg-cashin'));

    expect(onChange).toHaveBeenCalledWith('cashin');
    expect(screen.getByRole('tab', { name: 'Cash-In (+₱)' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'All (18)' })).not.toBeSelected();
  });
});
