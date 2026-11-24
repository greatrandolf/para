import { useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { useSession } from '@/hooks/useSession';
import { firestore } from '@/services/firebase';
import { startLiveTracking, stopBackgroundTracking, type TrackingState } from '@/services/liveLocation';
import { startPresence } from '@/services/presence';
import { driverKeys, useDriverApi, type DutyStatus } from '@packages/tanstack/query/driver';

/**
 * The driver's duty, live:
 * - listens to their ongoing assignment (Firestore onSnapshot), so a change by the fleet shows at once;
 * - sends live GPS while the assignment is in service, and presence (online / offline) while assigned;
 * - Stop / Resume Tracking (break) and End Shift.
 */
export type DutyValue = {
  /** The ongoing assignment, or null (not assigned, or the shift ended). */
  assignmentId: string | null;
  dutyStatus: DutyStatus;
  /** False until the first snapshot arrives. */
  ready: boolean;
  tracking: TrackingState;
  /** A failed break / resume / end shift. */
  error?: string;
  busy: boolean;
  setBreak: (onBreak: boolean) => Promise<void>;
  /** Completes the assignment (rotated). Throws if the server refuses. */
  endShift: () => Promise<void>;
};

const DutyContext = createContext<DutyValue | null>(null);

type Live = { assignmentId: string | null; dutyStatus: DutyStatus; ready: boolean };

export function DutyProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const driverId = session.status === 'driver' ? session.driverId : undefined;
  const api = useDriverApi();
  const queryClient = useQueryClient();
  const [live, setLive] = useState<Live>({ assignmentId: null, dutyStatus: 'off_duty', ready: false });
  const [tracking, setTracking] = useState<TrackingState>({ state: 'off' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const firstSnapshot = useRef(true);

  // Live assignment. The query matches the security rules (own driverId, not deleted).
  useEffect(() => {
    if (!driverId) return;
    firstSnapshot.current = true;
    const ongoing = query(
      collection(firestore, 'assignments'),
      where('driverId', '==', driverId),
      where('state', '==', 'ongoing'),
      where('deletedAt', '==', null),
    );
    return onSnapshot(
      ongoing,
      (snap) => {
        const doc = snap.docs[0];
        const dutyStatus = doc ? ((doc.get('dutyStatus') as DutyStatus | undefined) ?? 'in_service') : 'off_duty';
        setLive({ assignmentId: doc?.id ?? null, dutyStatus, ready: true });
        // The card shows unit and route details from driverMe: refresh it on every change after the first.
        if (!firstSnapshot.current) void queryClient.invalidateQueries({ queryKey: driverKeys.me() });
        firstSnapshot.current = false;
      },
      // Access turned off: driverMe fails too, and the drivers layout signs the phone out.
      () => void queryClient.invalidateQueries({ queryKey: driverKeys.me() }),
    );
  }, [driverId, queryClient]);

  // Presence while the driver has an assignment (in service or on break): the fleet sees "Disconnected" when the
  // app is closed, killed or offline.
  const assigned = !!driverId && !!live.assignmentId;
  useEffect(() => {
    if (!assigned || !driverId) return;
    return startPresence(driverId);
  }, [assigned, driverId]);

  // Live GPS while in service.
  const sending = !!driverId && !!live.assignmentId && live.dutyStatus === 'in_service';
  useEffect(() => {
    if (!sending || !driverId) {
      // driver-background-gps: never leave a background task running from an earlier session (break, no unit).
      if (live.ready) void stopBackgroundTracking();
      return;
    }
    return startLiveTracking(driverId, setTracking);
  }, [sending, driverId, live.ready]);

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await work();
      await queryClient.invalidateQueries({ queryKey: driverKeys.me() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const value: DutyValue = {
    ...live,
    tracking,
    busy,
    error,
    setBreak: (onBreak) =>
      run(async () => {
        const result = await api.setDuty(onBreak ? 'on_break' : 'in_service');
        // Show it now; the snapshot confirms it.
        setLive((current) => ({ ...current, dutyStatus: result.dutyStatus }));
      }).catch(() => undefined),
    endShift: () =>
      run(async () => {
        await api.endShift();
        setLive((current) => ({ ...current, assignmentId: null, dutyStatus: 'off_duty' }));
      }),
  };

  return <DutyContext.Provider value={value}>{children}</DutyContext.Provider>;
}

export function useDuty(): DutyValue {
  const value = useContext(DutyContext);
  if (!value) throw new Error('useDuty must be used inside <DutyProvider>.');
  return value;
}
