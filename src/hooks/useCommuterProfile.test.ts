import { commuterIdentity } from './useCommuterProfile';

describe('commuterIdentity', () => {
  it('uses the name given at sign-up', () => {
    expect(commuterIdentity('  Juan  Dela Cruz ', 'juan@example.com')).toEqual({ firstName: 'Juan', initials: 'JC' });
    expect(commuterIdentity('ana', null)).toEqual({ firstName: 'ana', initials: 'A' });
  });

  it('falls back to the email when there is no name', () => {
    expect(commuterIdentity(null, 'rider42@example.com')).toEqual({ firstName: 'rider42', initials: 'R' });
    expect(commuterIdentity('   ', 'rider42@example.com')).toEqual({ firstName: 'rider42', initials: 'R' });
  });

  it('gives nothing when there is neither', () => {
    expect(commuterIdentity(null, null)).toBeUndefined();
  });
});
