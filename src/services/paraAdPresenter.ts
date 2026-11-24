import type { ParaAd } from '@packages/tanstack/query/views';

/**
 * Shows a Para Ad (para-ads) from the ad flow and waits for the commuter: `continue` after the countdown, or
 * `closed`. The ad itself is drawn by ParaAdHost (mounted once in the commuter tabs), which reads this store.
 */
export type ParaAdOutcome = 'continue' | 'closed';

export type ParaAdRequest = {
  /** Unique per request, so a new request always restarts the countdown. */
  id: number;
  ad: ParaAd;
  minutes: number;
  finish: (outcome: ParaAdOutcome) => void;
};

let current: ParaAdRequest | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showParaAd(ad: ParaAd, minutes: number): Promise<ParaAdOutcome> {
  // Only one ad at a time: a new one closes the one showing.
  current?.finish('closed');
  return new Promise((resolve) => {
    const request: ParaAdRequest = {
      id: nextId++,
      ad,
      minutes,
      finish: (outcome) => {
        if (current === request) {
          current = null;
          emit();
        }
        resolve(outcome);
      },
    };
    current = request;
    emit();
  });
}

export const paraAdStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => current,
};
