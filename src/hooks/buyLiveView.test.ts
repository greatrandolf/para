import { Alert } from 'react-native';

import { buyLiveView } from './buyLiveView';

const me = { latitude: 10.3157, longitude: 123.8854 };
type Btn = { text: string; onPress?: () => void };

const passWith = (result: object) =>
  ({
    has: () => false,
    minutesLeft: () => undefined,
    driverIds: [],
    buy: jest.fn(async () => result),
    buying: false,
  }) as never;

const watchWith = (push: boolean) =>
  ({ watch: null, busy: false, start: jest.fn(async () => ({ push })), cancel: jest.fn() }) as never as {
    start: jest.Mock;
  };

describe('buyLiveView (jeep-coming-alert)', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });
  afterEach(() => alert.mockRestore());

  it('with no jeepney coming: not charged, and offers a free Notify me', async () => {
    const watch = watchWith(true);
    const live = await buyLiveView(passWith({ charged: false, reason: 'no-incoming' }), me, 'outbound', watch as never);
    expect(live).toBe(false);
    const [title, text, buttons] = alert.mock.calls[0] as [string, string, Btn[]];
    expect(title).toBe('No jeepneys coming yet');
    expect(text).toMatch(/You were not charged/);
    expect(buttons.map((b) => b.text)).toEqual(['Not now', 'Notify me — free']);

    buttons[1].onPress?.();
    await Promise.resolve();
    expect(watch.start).toHaveBeenCalledWith({ lat: me.latitude, lng: me.longitude, direction: 'outbound' });
  });

  it('without notification permission: explains the in-app alert', async () => {
    const watch = watchWith(false);
    await buyLiveView(passWith({ charged: false, reason: 'no-incoming' }), me, undefined, watch as never);
    const buttons = alert.mock.calls[0][2] as Btn[];
    buttons[1].onPress?.();
    await new Promise<void>((r) => setImmediate(() => r()));
    expect(alert).toHaveBeenLastCalledWith('Watching for jeepneys', expect.stringMatching(/next 30 minutes/));
  });

  it('Not now does nothing', async () => {
    const watch = watchWith(true);
    await buyLiveView(passWith({ charged: false, reason: 'no-incoming' }), me, undefined, watch as never);
    (alert.mock.calls[0][2] as Btn[])[0].onPress?.();
    expect(watch.start).not.toHaveBeenCalled();
  });

  it('charged: live at once, no alert', async () => {
    const live = await buyLiveView(passWith({ charged: true }), me, undefined, watchWith(true) as never);
    expect(live).toBe(true);
    expect(alert).not.toHaveBeenCalled();
  });
});
