import { onValue, ref, serverTimestamp, set } from 'firebase/database';

import { realtimeDb } from '@/services/firebase';

/** The live passenger load the driver sets, at `driverLocations/{driverId}/load`. */
export type PassengerLoad = { occupied: number; capacity: number; at?: number };

/** Saves the load (only that driver may, while they have an assignment; see database.rules.json). */
export async function saveLoad(driverId: string, occupied: number, capacity: number): Promise<void> {
  await set(ref(realtimeDb(), `driverLocations/${driverId}/load`), { occupied, capacity, at: serverTimestamp() });
}

/** Listens to the saved load. Returns the unsubscribe function. */
export function watchLoad(driverId: string, onLoad: (load: PassengerLoad | null) => void): () => void {
  let db;
  try {
    db = realtimeDb();
  } catch {
    return () => undefined; // live tracking not set up in this build
  }
  return onValue(
    ref(db, `driverLocations/${driverId}/load`),
    (snap) => onLoad((snap.val() as PassengerLoad | null) ?? null),
    () => onLoad(null),
  );
}
