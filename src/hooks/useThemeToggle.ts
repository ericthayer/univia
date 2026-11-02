import { useCallback } from 'react';
import { useColorScheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export type ResolvedMode = 'light' | 'dark';

export interface ThemeToggle {
  /** The scheme on screen; undefined until MUI has read storage. */
  resolvedMode: ResolvedMode | undefined;
  toggle: () => void;
}

/**
 * One toggle for header and menu. MUI persists the mode (`mui-mode`).
 * Toggling to the scheme the OS already uses stores `system`, so the app
 * follows OS changes again; toggling away from it stores an explicit choice
 * that survives reloads and OS changes.
 */
export function useThemeToggle(): ThemeToggle {
  const { mode, setMode } = useColorScheme();
  // MUI only reports systemMode while mode is 'system', so read the OS directly.
  const osMode: ResolvedMode = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true }) ? 'dark' : 'light';
  const resolvedMode: ResolvedMode | undefined = mode === 'system' ? osMode : mode;

  const toggle = useCallback((): void => {
    const next: ResolvedMode = resolvedMode === 'dark' ? 'light' : 'dark';
    setMode(next === osMode ? 'system' : next);
  }, [resolvedMode, osMode, setMode]);

  return { resolvedMode, toggle };
}
