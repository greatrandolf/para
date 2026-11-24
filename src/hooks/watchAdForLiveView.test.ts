import { Alert } from 'react-native';

import type { LivePass } from '@/hooks/useLivePass';
import { showParaAd } from '@/services/paraAdPresenter';
import type { ParaAd } from '@packages/tanstack/query/views';

import { watchAdForLiveView, type AdApi } from './watchAdForLiveView';

jest.mock('@/services/paraAdPresenter', () => ({ showParaAd: jest.fn() }));

const ads = () => jest.requireMock('@/services/rewardedAds') as {
  mockAds: { supported: boolean };
  showRewardedAd: jest.Mock;
};

const para: ParaAd = {
  campaignId: 'c1',
  businessName: 'Lechon ni Inday',
  headline: 'Best lechon in Cebu',
  imageUrl: 'https://example.test/p.jpg',
  ctaLabel: null,
  ctaUrl: null,
  minSeconds: 5,
};
const me = { latitude: 10.3186, longitude: 123.8977 };
const route = { id: 'route-17B', code: '17B' };

const apiWith = (start: Awaited<ReturnType<AdApi['adViewStart']>>): AdApi => ({
  adViewStart: jest.fn(async () => start),
  adViewDevReward: jest.fn(async () => ({ result: 'granted' })),
  paraAdViewed: jest.fn(async () => ({ result: 'granted', charged: true })),
});
const passWith = (unlocked: boolean) => ({ refresh: jest.fn(async () => unlocked) }) as unknown as LivePass;

describe('watchAdForLiveView with Para Ads (para-ads)', () => {
  beforeEach(() => {
    jest.mocked(showParaAd).mockReset();
    ads().showRewardedAd.mockClear();
    ads().mockAds.supported = true;
  });

  it('shows the Para Ad, confirms it after Continue and unlocks the route', async () => {
    jest.mocked(showParaAd).mockResolvedValue('continue');
    const api = apiWith({ started: true, adViewId: 'ad1', passMinutes: 3, source: 'para', para });
    const pass = passWith(true);
    await expect(watchAdForLiveView(api, pass, 'u1', me, 'inbound', undefined, route)).resolves.toBe(true);
    expect(showParaAd).toHaveBeenCalledWith(para, 3);
    expect(api.paraAdViewed).toHaveBeenCalledWith('ad1');
    expect(pass.refresh).toHaveBeenCalledWith('17B');
    expect(ads().showRewardedAd).not.toHaveBeenCalled();
  });

  it('unlocks nothing when the Para Ad is closed early', async () => {
    jest.mocked(showParaAd).mockResolvedValue('closed');
    const api = apiWith({ started: true, adViewId: 'ad1', passMinutes: 3, source: 'para', para });
    await expect(watchAdForLiveView(api, passWith(true), 'u1', me, 'inbound', undefined, route)).resolves.toBe(false);
    expect(api.paraAdViewed).not.toHaveBeenCalled();
  });

  it('falls back to Google AdMob when no Para Ad runs', async () => {
    const api = apiWith({ started: true, adViewId: 'ad2', passMinutes: 3, source: 'admob' });
    await watchAdForLiveView(api, passWith(true), 'u1', me, 'inbound', undefined, route);
    expect(showParaAd).not.toHaveBeenCalled();
    expect(ads().showRewardedAd).toHaveBeenCalledWith({ userId: 'u1', customData: 'ad2' });
  });

  it('says no ad is available when only Google ads would play and they cannot here', async () => {
    ads().mockAds.supported = false;
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const api = apiWith({ started: true, adViewId: 'ad3', passMinutes: 3, source: 'admob' });
    await expect(watchAdForLiveView(api, passWith(true), 'u1', me, 'inbound', undefined, route)).resolves.toBe(false);
    expect(alert).toHaveBeenCalledWith('No ad available right now', expect.any(String));
    expect(ads().showRewardedAd).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
