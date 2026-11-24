import { liveViewAction } from './liveViewAction';

describe('liveViewAction (ad-supported-live-view)', () => {
  it('pays ₱1 with a balance of ₱1 or more', () => {
    expect(liveViewAction({ hasJeeps: true, canPay: true, adsAvailable: true })).toBe('pay');
  });

  it('offers Watch Ads under ₱1 where ads can play', () => {
    expect(liveViewAction({ hasJeeps: true, canPay: false, adsAvailable: true })).toBe('ad');
  });

  it('offers a top-up (no pop-up) under ₱1 where ads cannot play', () => {
    expect(liveViewAction({ hasJeeps: true, canPay: false, adsAvailable: false })).toBe('topup');
  });

  it('keeps the ₱0 guarantee: nothing to pay or watch without a live jeepney', () => {
    expect(liveViewAction({ hasJeeps: false, canPay: false, adsAvailable: true })).toBe('none');
    expect(liveViewAction({ hasJeeps: false, canPay: true, adsAvailable: true })).toBe('none');
  });
});
