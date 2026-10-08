// Build-time settings, read from the environment (see .env.example).
//
// DEMO FEATURES
// Some pages need backend routes that do not exist yet (see
// docs/api-contract.md). Until they do, an in-browser demo server answers
// those routes with made-up players and data (src/demo). Each feature listed
// in VITE_DEMO_FEATURES is answered by the demo server; every other request
// goes to the real backend. Remove a feature from the list as soon as the
// backend serves its routes.
//
// REALTIME
// With VITE_REALTIME=socket the app opens a Socket.IO connection for live
// updates. Leave it unset until the backend has a gateway: the pages refresh
// themselves by polling either way.

export const DEMO_FEATURES = ['users', 'friends', 'chat', 'spectate', 'tournaments'] as const;
export type DemoFeature = (typeof DEMO_FEATURES)[number];

const isDemoFeature = (value: string): value is DemoFeature => DEMO_FEATURES.includes(value as DemoFeature);

/** "users,chat" → ['users', 'chat']. Unset means every feature; empty means none. */
export function parseDemoFeatures(value: string | undefined): DemoFeature[] {
  if (value === undefined) return [...DEMO_FEATURES];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(isDemoFeature);
}

export const config = {
  demoFeatures: new Set<DemoFeature>(parseDemoFeatures(import.meta.env.VITE_DEMO_FEATURES)),
  realtime: import.meta.env.VITE_REALTIME === 'socket' ? 'socket' : 'polling',
} as const;

/** True when this feature's routes are answered by the in-browser demo server. */
export function isDemo(feature: DemoFeature): boolean {
  return config.demoFeatures.has(feature);
}
