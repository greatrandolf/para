/** "Notify me when one is coming" (jeep-coming-alert): the commuter's free watch, as `watches/{uid}` stores it. */
export type JeepWatchStatus = 'watching' | 'coming' | 'expired';

export type JeepWatch = {
  status: JeepWatchStatus;
  /** When the watch ends (ms). */
  until: number;
  /** Set when a jeepney started coming: how many and on which routes. */
  coming?: { count: number; routeCodes: string[]; at: number };
};

export type StartWatchInput = { lat: number; lng: number; direction?: 'outbound' | 'inbound'; pushToken?: string };
export type StartWatchResult = { until: number; push: boolean };
