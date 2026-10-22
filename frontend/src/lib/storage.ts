// localStorage can throw (private mode, blocked cookies, quota): every access
// is guarded so a preference that cannot be saved never breaks the app.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The preference only lasts for this visit.
  }
}
