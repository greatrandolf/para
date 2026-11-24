import AsyncStorage from '@react-native-async-storage/async-storage';

import { preferredRouteStore, setPreferredRoute } from './preferredRoute';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('preferred route (preferred-route)', () => {
  beforeEach(() => AsyncStorage.clear());

  it('has none for a signed-out user', () => {
    expect(preferredRouteStore.get(undefined)).toBeNull();
  });

  it('saves the picked route per account and tells listeners', async () => {
    const listener = jest.fn();
    const off = preferredRouteStore.subscribe(listener);
    setPreferredRoute('u1', '14D');
    expect(preferredRouteStore.get('u1')).toBe('14D');
    expect(listener).toHaveBeenCalled();
    await flush();
    expect(await AsyncStorage.getItem('para.preferredRoute.u1')).toBe('14D');
    expect(preferredRouteStore.get('u2')).toBeUndefined(); // another account: loading, nothing saved
    off();
  });

  it('loads a route saved earlier on the phone', async () => {
    await AsyncStorage.setItem('para.preferredRoute.u3', '17C');
    expect(preferredRouteStore.get('u3')).toBeUndefined(); // loading
    await flush();
    expect(preferredRouteStore.get('u3')).toBe('17C');
  });
});
