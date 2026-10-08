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

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage is blocked: nothing was saved, so there is nothing to remove.
  }
}
