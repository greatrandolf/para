import { onDisconnect, onValue, ref, serverTimestamp, set } from 'firebase/database';

import { realtimeDb } from '@/services/firebase';

/**
 * Driver app presence (Firebase's recommended pattern), at `driverLocations/{driverId}/presence`:
 * `{ online, at }`. While connected the app writes `online: true`; the Realtime Database server writes
 * `online: false` by itself when the connection drops: the app is killed, the phone loses signal, or the OS
 * suspends it. The portal shows the assignment as Disconnected from that.
 *
 * Returns a function that marks the driver offline and stops.
 */
export function startPresence(driverId: string): () => void {
  let db;
  try {
    db = realtimeDb();
  } catch {
    return () => undefined; // live tracking not set up in this build
  }
  const presenceRef = ref(db, `driverLocations/${driverId}/presence`);
  const offline = () => ({ online: false, at: serverTimestamp() });

  // Register the server-side "offline" write first, then mark online, so a drop between the two can never leave the
  // driver shown online.
  let connected = false;
  let assigned = false;
  const announce = () => {
    if (!connected || !assigned) return;
    void onDisconnect(presenceRef)
      .set(offline())
      .then(() => set(presenceRef, { online: true, at: serverTimestamp() }))
      .catch(() => undefined); // e.g. the shift just ended and the live record is gone
  };
  // `.info/connected` turns true on every (re)connection.
  const offConnected = onValue(ref(db, '.info/connected'), (snap) => {
    connected = snap.val() === true;
    announce();
  });
  // The rules accept presence only once the server has written the live record for the assignment. A new
  // assignment reaches the app (Firestore) slightly before that, so wait for it.
  const offAssigned = onValue(
    ref(db, `driverLocations/${driverId}/meta/authUid`),
    (snap) => {
      const was = assigned;
      assigned = snap.exists();
      if (assigned && !was) announce();
    },
    () => undefined,
  );

  return () => {
    offConnected();
    offAssigned();
    // Locked, shift ended, or signed out: say so now instead of waiting for the connection to drop.
    void set(presenceRef, offline())
      .catch(() => undefined)
      .finally(
        () =>
          void onDisconnect(presenceRef)
            .cancel()
            .catch(() => undefined),
      );
  };
}
