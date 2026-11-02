const LEGACY_KEY = 'manual-color-mode';
const MUI_KEY = 'mui-mode';
const MIGRATED_KEY = 'univia-color-mode-v2';

/**
 * Older builds kept two stores: `manual-color-mode` (set only by the toggle)
 * and MUI's `mui-mode` (also written when the OS changed). A `mui-mode` with
 * no legacy key was never a user choice, so it goes back to `system`. Runs
 * once per browser, before the ThemeProvider reads storage.
 */
export function migrateColorMode(getStorage: () => Storage = () => window.localStorage): void {
  try {
    const storage = getStorage();
    if (storage.getItem(MIGRATED_KEY)) return;
    const manual = storage.getItem(LEGACY_KEY);
    if (manual === 'light' || manual === 'dark') {
      storage.setItem(MUI_KEY, manual);
    } else if (storage.getItem(MUI_KEY) !== null) {
      storage.setItem(MUI_KEY, 'system');
    }
    storage.removeItem(LEGACY_KEY);
    storage.setItem(MIGRATED_KEY, '1');
  } catch {
    // Storage blocked (private mode): MUI falls back to the system scheme.
  }
}
