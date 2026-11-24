import { broadcastView } from './BroadcastCard';

const base = { assignmentId: 'a1', dutyStatus: 'in_service' as const, busy: false, error: undefined, ready: true };

describe('broadcastView', () => {
  it('waits for the first snapshot', () => {
    expect(broadcastView({ ...base, ready: false, tracking: { state: 'off' } }).title).toBe('CONNECTING…');
  });

  it('shows live GPS disabled without an assigned vehicle', () => {
    const view = broadcastView({ ...base, assignmentId: null, dutyStatus: 'off_duty', tracking: { state: 'off' } });
    expect(view).toMatchObject({ live: false, title: 'NO ASSIGNED VEHICLE', subtitle: 'LIVE GPS DISABLED' });
  });

  it('waits for the driver to start tracking on a new assignment', () => {
    expect(broadcastView({ ...base, dutyStatus: 'ready', tracking: { state: 'off' } })).toMatchObject({
      live: false,
      title: 'READY TO START',
      subtitle: 'UNIT ASSIGNED • GPS NOT SENT',
    });
  });

  it('shows the break', () => {
    expect(broadcastView({ ...base, dutyStatus: 'on_break', tracking: { state: 'off' } })).toMatchObject({
      live: false,
      title: 'ON BREAK',
    });
  });

  it('is live while sending, with the last send time', () => {
    const view = broadcastView({ ...base, tracking: { state: 'live', lastSentAt: Date.now() } });
    expect(view.live).toBe(true);
    expect(view.title).toBe('BROADCASTING LIVE');
    expect(view.subtitle).toMatch(/^LAST SENT /);
  });

  it('waits for a GPS fix, then explains location problems', () => {
    expect(broadcastView({ ...base, tracking: { state: 'live' } }).subtitle).toBe('WAITING FOR GPS FIX');
    expect(broadcastView({ ...base, tracking: { state: 'starting' } }).title).toBe('STARTING GPS…');
    expect(
      broadcastView({ ...base, tracking: { state: 'error', message: 'Turn on Location Services.' } }),
    ).toMatchObject({
      live: false,
      title: 'LOCATION OFF',
      help: 'Turn on Location Services.',
    });
  });
});
