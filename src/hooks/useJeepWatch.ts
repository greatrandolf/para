import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useOptionalSession } from '@/hooks/useSession';
import { getPushToken } from '@/services/pushNotifications';
import { firestore } from '@/services/firebase';
import { useCancelWatch, useStartWatch, type JeepWatch } from '@packages/tanstack/query/views';

import { minutesLeftUntil } from './useLivePass';

export type StartWatch = { lat: number; lng: number; direction?: 'outbound' | 'inbound' };

export type JeepWatchState = {
  /** The running watch: `watching` or `coming`, until it ends. Null without one. */
  watch: JeepWatch | null;
  minutesLeft?: number;
  /** Starts a free watch (asks for notification permission first). Returns whether a push will be sent. */
  start: (input: StartWatch) => Promise<{ push: boolean }>;
  cancel: () => Promise<void>;
  busy: boolean;
};

/**
 * The commuter's free "Notify me when one is coming" watch (jeep-coming-alert), live from `watches/{uid}`, which
 * only the backend writes.
 */
export function useJeepWatch(): JeepWatchState {
  const session = useOptionalSession();
  const uid = session?.status === 'commuter' ? session.user.uid : undefined;
  const [watch, setWatch] = useState<JeepWatch | null>(null);
  const startWatch = useStartWatch();
  const cancelWatch = useCancelWatch();

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(firestore, 'watches', uid),
      (snap) => setWatch(snap.exists() ? (snap.data() as JeepWatch) : null),
      () => setWatch(null),
    );
  }, [uid]);

  // Tick while a watch runs (minutes left) and right when it ends.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!watch || watch.until <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(15_000, watch.until - now + 50));
    return () => clearTimeout(timer);
  }, [watch, now]);

  const active = watch && watch.status !== 'expired' && watch.until > now ? watch : null;
  return {
    watch: uid ? active : null,
    minutesLeft: active ? minutesLeftUntil(active.until, now) : undefined,
    start: async (input) => {
      const pushToken = await getPushToken();
      const result = await startWatch.mutateAsync({ ...input, pushToken });
      return { push: result.push };
    },
    cancel: async () => {
      setWatch(null);
      await cancelWatch.mutateAsync();
    },
    busy: startWatch.isPending || cancelWatch.isPending,
  };
}
