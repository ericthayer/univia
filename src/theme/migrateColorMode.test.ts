import { beforeEach, describe, expect, it } from 'vitest';
import { migrateColorMode } from './migrateColorMode';

describe('migrateColorMode', () => {
  beforeEach(() => localStorage.clear());

  it('keeps an explicit choice from the old toggle', () => {
    localStorage.setItem('manual-color-mode', 'light');
    localStorage.setItem('mui-mode', 'dark');
    migrateColorMode(() => localStorage);
    expect(localStorage.getItem('mui-mode')).toBe('light');
    expect(localStorage.getItem('manual-color-mode')).toBeNull();
  });

  it('returns a mode the user never picked to system', () => {
    localStorage.setItem('mui-mode', 'light');
    migrateColorMode(() => localStorage);
    expect(localStorage.getItem('mui-mode')).toBe('system');
  });

  it('runs once, so later explicit choices survive reloads', () => {
    migrateColorMode(() => localStorage);
    localStorage.setItem('mui-mode', 'dark');
    migrateColorMode(() => localStorage);
    expect(localStorage.getItem('mui-mode')).toBe('dark');
  });
});
