import { render, screen } from '@testing-library/react-native';

import { EarningsBreakdown } from './EarningsBreakdown';

describe('EarningsBreakdown (driver-pay-balance)', () => {
  it("shows today's share by source: ₱1 views, Google Ads and Para Ads", async () => {
    await render(<EarningsBreakdown sources={{ paid: 0.6, ad: 0.12, paraAd: 0.78 }} />);
    expect(screen.getByTestId('source-paid')).toHaveTextContent('₱1 views₱0.60');
    expect(screen.getByTestId('source-ad')).toHaveTextContent('Google Ads₱0.12');
    expect(screen.getByTestId('source-paraAd')).toHaveTextContent('Para Ads₱0.78');
  });

  it('shows what is still to be paid across days, apart from today', async () => {
    await render(<EarningsBreakdown toPay={{ amount: 1.44, views: 5 }} />);
    expect(screen.getByTestId('to-pay-amount')).toHaveTextContent('₱1.44');
    expect(screen.getByTestId('to-pay')).toHaveTextContent('5 views since your last payout', { exact: false });
    expect(screen.queryByTestId('today-sources')).toBeNull();
  });

  it('says when nothing is waiting', async () => {
    await render(<EarningsBreakdown toPay={{ amount: 0, views: 0 }} />);
    expect(screen.getByTestId('to-pay')).toHaveTextContent('You are all paid', { exact: false });
  });
});
