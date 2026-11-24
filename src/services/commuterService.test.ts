import { filterLedger, filterRoutes, getLedger, getRouteOptions, getRoutes } from './commuterService';

const names = (items: { name: string }[]) => items.map((item) => item.name);

describe('filterRoutes', () => {
  const routes = getRoutes();

  it('returns every route for the all filter and an empty query', () => {
    expect(filterRoutes(routes, 'all', '')).toHaveLength(4);
  });

  it('keeps only jeepney routes for the jeepney filter', () => {
    expect(names(filterRoutes(routes, 'jeepney', ''))).toEqual([
      'Colon to I.T Park',
      'Monumento — Baclaran',
      'Pasig Palengke — Quiapo',
    ]);
  });

  it('keeps only bus routes for the bus filter', () => {
    expect(names(filterRoutes(routes, 'bus', ''))).toEqual(['Fairview — PITX']);
  });

  it('matches the route name case-insensitively', () => {
    expect(names(filterRoutes(routes, 'all', 'pitx'))).toEqual(['Fairview — PITX']);
    expect(names(filterRoutes(routes, 'all', 'COLON'))).toEqual(['Colon to I.T Park']);
  });

  it('matches the route code and via line', () => {
    expect(names(filterRoutes(routes, 'all', '01-t'))).toEqual(['Monumento — Baclaran']);
    expect(names(filterRoutes(routes, 'all', 'taft'))).toEqual(['Monumento — Baclaran']);
  });

  it('combines the vehicle filter with the query', () => {
    expect(filterRoutes(routes, 'jeepney', 'PITX')).toEqual([]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterRoutes(routes, 'all', 'zzz')).toEqual([]);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(filterRoutes(routes, 'all', '   ')).toHaveLength(4);
  });
});

describe('filterLedger', () => {
  const entries = getLedger();

  it('returns all entries for the all filter', () => {
    expect(filterLedger(entries, 'all')).toHaveLength(4);
  });

  it('returns the three view entries, including the ₱0 refunded view', () => {
    const views = filterLedger(entries, 'views');
    expect(views.map((e) => e.ref)).toEqual(['TXN-83910', 'TXN-83742', 'REV-00214']);
    expect(views.map((e) => e.amount)).toEqual([-1, -1, 0]);
  });

  it('returns only the cash-in entry', () => {
    expect(filterLedger(entries, 'cashin').map((e) => e.title)).toEqual(['Cash-in via GCash']);
  });

  it('does not mutate the input', () => {
    const copy = [...entries];
    filterLedger(entries, 'views');
    expect(entries).toEqual(copy);
  });
});

describe('getRouteOptions', () => {
  it('returns the three Live Map route options in display order', () => {
    expect(getRouteOptions()).toEqual([
      expect.objectContaining({
        code: '17D',
        name: 'Route 17D',
        badge: 'BEST OPTION',
        tone: 'best',
        eta: '5 min',
        etaCaption: 'ETA',
      }),
      expect.objectContaining({
        code: '44B',
        name: 'Route 44B',
        badge: 'ALTERNATIVE',
        tone: 'alternative',
        eta: '9 min',
        etaCaption: 'ETA',
      }),
      expect.objectContaining({
        code: '17B',
        name: 'Route 17B',
        badge: 'YOUR PREFERRED ROUTE',
        tone: 'preferred',
        eta: '18 min',
        etaCaption: '18m left',
      }),
    ]);
  });

  it('has unique codes, used in testIDs', () => {
    const codes = getRouteOptions().map((option) => option.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
