import { getDirection, getPoolShare, getTodayEarnings, toggleDirection } from './driverService';

describe('driverService', () => {
  it('returns direction data copied from the design', () => {
    expect(getDirection('apas').badge).toBe('OUTBOUND • TO APAS');
    expect(getDirection('colon').waypoints[0]).toBe('Apas IT Park');
  });

  it('toggles between the two directions', () => {
    expect(toggleDirection('apas')).toBe('colon');
    expect(toggleDirection('colon')).toBe('apas');
  });

  it('computes the equal pool share and daily earnings', () => {
    const pool = getPoolShare();
    expect(pool.views / pool.activeDrivers).toBe(pool.share);
    expect(getTodayEarnings()).toBe(68.5);
  });
});
