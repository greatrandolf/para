import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/hooks/useSession';
import { saveLoad, watchLoad } from '@/services/passengerLoad';

/** How long the slider waits after the last change before saving (dragging sends many changes). */
const SAVE_DELAY_MS = 400;

/**
 * The driver's live passenger load (Revision 21): read from and saved to `driverLocations/{driverId}/load`.
 * Changes show at once and are saved shortly after the last one.
 */
export function usePassengerLoad(capacity: number | undefined) {
  const session = useSession();
  const driverId = session.status === 'driver' ? session.driverId : undefined;
  const [occupied, setOccupied] = useState(0);
  const [saveError, setSaveError] = useState<string>();
  const editing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The saved load (also after reopening the app), unless the driver is changing it right now.
  useEffect(() => {
    if (!driverId) return;
    return watchLoad(driverId, (load) => {
      if (!editing.current && load) setOccupied(load.occupied);
    });
  }, [driverId]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const change = (next: number) => {
    setOccupied(next);
    if (!driverId || !capacity) return;
    editing.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      saveLoad(driverId, next, capacity)
        .then(() => setSaveError(undefined))
        .catch(() => setSaveError('Could not send the load. It will be sent when you change it again.'))
        .finally(() => {
          editing.current = false;
        });
    }, SAVE_DELAY_MS);
  };

  return { occupied, change, saveError };
}
