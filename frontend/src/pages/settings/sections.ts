// The parts of the settings page, as they appear in the address: /settings/security.

export const SETTINGS_SECTIONS = ['profile', 'security', 'preferences', 'blocked'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

function isSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

/**
 * Which section an address opens. The profile section lives at plain
 * /settings, so /settings/profile and an unknown section are sent there:
 * `canonical` is false when the address should be replaced.
 */
export function resolveSection(param: string | undefined): { section: SettingsSection; canonical: boolean } {
  if (param === undefined) return { section: 'profile', canonical: true };
  if (isSection(param) && param !== 'profile') return { section: param, canonical: true };
  return { section: 'profile', canonical: false };
}
