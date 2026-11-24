import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('renders its content under the testID', async () => {
    await render(
      <BottomSheet snapPoints={[300, '85%']} testID="sheet">
        <Text>Route 14D</Text>
      </BottomSheet>,
    );
    expect(screen.getByTestId('sheet')).toHaveTextContent('Route 14D');
  });

  it('renders without scrolling content', async () => {
    await render(
      <BottomSheet snapPoints={['40%']} scrollable={false} testID="sheet">
        <Text>Static</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Static')).toBeTruthy();
  });
});
