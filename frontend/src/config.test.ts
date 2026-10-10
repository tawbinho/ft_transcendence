import { DEFAULT_DEMO_FEATURES, parseDemoFeatures } from './config';

describe('parseDemoFeatures', () => {
  it('uses the features the backend does not serve yet when VITE_DEMO_FEATURES is not set', () => {
    expect(parseDemoFeatures(undefined)).toEqual([...DEFAULT_DEMO_FEATURES]);
    expect(parseDemoFeatures(undefined)).not.toContain('tournaments');
  });

  it('still lets tournaments be listed by hand', () => {
    expect(parseDemoFeatures('tournaments')).toEqual(['tournaments']);
  });

  it('reads a comma-separated list and ignores unknown names', () => {
    expect(parseDemoFeatures(' chat, users ,matches')).toEqual(['chat', 'users']);
  });

  it('turns every feature off with an empty value', () => {
    expect(parseDemoFeatures('')).toEqual([]);
  });
});
