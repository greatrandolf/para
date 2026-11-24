import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useSession } from '@/hooks/useSession';
import { firestore } from '@/services/firebase';

/** Today in Manila, "YYYY-MM-DD" (the backend's earnings day). */
export const manilaDay = (ms = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));

/** Micro-pesos (₱1 = 1,000,000) to pesos. */
export const microToPeso = (micro: number) => micro / 1_000_000;

/** One unit driven today and what it earned the driver (driver-unit-earnings). */
export type TodayUnit = {
  vehicleId: string;
  unitCode: string;
  plate: string;
  routeCode: string;
  views: number;
  /** The driver's share in this unit today, in pesos. */
  driver: number;
};

/** Today's driver share by where the money came from (₱1 views, Google ads, Para Ads), in pesos. */
export type SourceSplit = { paid: number; ad: number; paraAd: number };

export type DriverEarnings = {
  /** ₱1 views the driver's unit shared today. */
  views: number;
  /** The driver's share today, in pesos. */
  driver: number;
  /** The unit's earnings today, in pesos (the driver gets `driverPct` of it). */
  unit: number;
  driverPct?: number;
  /** Per unit driven today, largest first (empty before the unit breakdown existed). */
  units: TodayUnit[];
  /** Today by source; undefined for days recorded before sources were kept. */
  sources?: SourceSplit;
  loading: boolean;
};

/** The `sources` map of a stored driver day, in pesos (undefined when the day has none). */
export function sourcesOf(raw: unknown): SourceSplit | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, { driverMicro?: number } | undefined>;
  const peso = (k: string) => microToPeso(Number(r[k]?.driverMicro ?? 0));
  return { paid: peso('paid'), ad: peso('ad'), paraAd: peso('paraAd') };
}

/** The `units` map of a stored driver day, as rows (largest first). */
export function unitsOf(raw: unknown): TodayUnit[] {
  return Object.entries((raw ?? {}) as Record<string, Record<string, unknown>>)
    .map(([vehicleId, u]) => ({
      vehicleId,
      unitCode: String(u.unitCode ?? ''),
      plate: String(u.plate ?? ''),
      routeCode: String(u.routeCode ?? ''),
      views: Number(u.views ?? 0),
      driver: microToPeso(Number(u.driverMicro ?? 0)),
    }))
    .sort((a, b) => b.driver - a.driver || a.unitCode.localeCompare(b.unitCode));
}

/**
 * The driver's earnings today (shared-view-earnings): live from `driverEarnings/{driverId}/days/{today}`, written by
 * the backend each time a commuter's ₱1 is shared with their unit.
 */
export function useDriverEarnings(): DriverEarnings {
  const session = useSession();
  const driverId = session.status === 'driver' ? session.driverId : undefined;
  const [day] = useState(() => manilaDay());
  const [state, setState] = useState<DriverEarnings>({ views: 0, driver: 0, unit: 0, units: [], loading: true });

  useEffect(() => {
    if (!driverId) return;
    return onSnapshot(
      doc(firestore, `driverEarnings/${driverId}/days/${day}`),
      (snap) => {
        const d = snap.data() ?? {};
        setState({
          views: Number(d.views ?? 0),
          driver: microToPeso(Number(d.driverMicro ?? 0)),
          unit: microToPeso(Number(d.unitEarnedMicro ?? 0)),
          driverPct: typeof d.driverPct === 'number' ? d.driverPct : undefined,
          units: unitsOf(d.units),
          sources: sourcesOf(d.sources),
          loading: false,
        });
      },
      () => setState((s) => ({ ...s, loading: false })),
    );
  }, [driverId, day]);

  return state;
}
