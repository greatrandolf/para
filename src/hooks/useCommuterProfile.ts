import { useSyncExternalStore } from 'react';

import { useLivePass } from '@/hooks/useLivePass';
import { useOptionalSession } from '@/hooks/useSession';
import { getCommuterProfile } from '@/services/commuterService';
import { preferredRouteStore } from '@/services/preferredRoute';
import type { CommuterProfile } from '@/types/commuter';

/**
 * First name and initials for a commuter account: the name given at sign-up (or by Google), else the part of the
 * email before the @. Returns `undefined` when there is nothing to go on.
 */
export function commuterIdentity(
  displayName: string | null | undefined,
  email: string | null | undefined,
): Pick<CommuterProfile, 'firstName' | 'initials'> | undefined {
  const words = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length) {
    const first = words[0];
    const last = words.length > 1 ? words[words.length - 1] : '';
    return { firstName: first, initials: (first[0] + (last[0] ?? '')).toUpperCase() };
  }
  const local = (email ?? '').split('@')[0]?.trim();
  if (local) return { firstName: local, initials: local[0].toUpperCase() };
  return undefined;
}

/**
 * The signed-in commuter's profile. The name comes from their account; the balance is still sample data until the
 * wallet balance comes from the backend (`walletMe`).
 */
export function useCommuterProfile(): CommuterProfile {
  const session = useOptionalSession();
  const { balance } = useLivePass();
  const base = getCommuterProfile();
  // The real wallet balance once loaded (shared-view-earnings); the sample until then.
  const sample = balance !== undefined ? { ...base, balance } : base;
  const user = session?.status === 'commuter' ? session.user : undefined;
  // preferred-route: the route the commuter last picked, saved on the phone; the default until then.
  const saved = useSyncExternalStore(
    preferredRouteStore.subscribe,
    () => preferredRouteStore.get(user?.uid),
    () => preferredRouteStore.get(user?.uid),
  );
  const withRoute = saved ? { ...sample, preferredRouteCode: saved } : sample;
  const identity = user ? commuterIdentity(user.displayName, user.email) : undefined;
  return identity ? { ...withRoute, ...identity } : withRoute;
}
