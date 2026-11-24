import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The commuter's preferred route (preferred-route): the route they last picked on the Live Map or Commute Hub, saved
 * on this phone per account. It opens selected and carries the "YOUR PREFERRED ROUTE" badge. Until they pick one,
 * the profile's default is used.
 */
const key = (uid: string) => `para.preferredRoute.${uid}`;

const codes = new Map<string, string | null>();
const loading = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const preferredRouteStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The saved route code for this account, or null/undefined when none (undefined: not loaded yet). */
  get(uid: string | undefined): string | null | undefined {
    if (!uid) return null;
    if (!codes.has(uid) && !loading.has(uid)) {
      loading.add(uid);
      AsyncStorage.getItem(key(uid))
        .then((code) => codes.set(uid, code))
        .catch(() => codes.set(uid, null))
        .finally(() => {
          loading.delete(uid);
          emit();
        });
    }
    return codes.get(uid);
  },
};

/** Saves the route the commuter picked as their preferred route. */
export function setPreferredRoute(uid: string | undefined, code: string) {
  if (!uid || codes.get(uid) === code) return;
  codes.set(uid, code);
  emit();
  void AsyncStorage.setItem(key(uid), code).catch(() => undefined);
}
