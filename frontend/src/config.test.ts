import { DEMO_FEATURES, parseDemoFeatures } from './config';

describe('parseDemoFeatures', () => {
  it('turns every demo feature on when VITE_DEMO_FEATURES is not set', () => {
    expect(parseDemoFeatures(undefined)).toEqual([...DEMO_FEATURES]);
  });

  it('reads a comma-separated list and ignores unknown names', () => {
    expect(parseDemoFeatures(' chat, users ,matches')).toEqual(['chat', 'users']);
  });

  it('turns every feature off with an empty value', () => {
    expect(parseDemoFeatures('')).toEqual([]);
  });
});
