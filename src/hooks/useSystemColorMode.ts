import { useEffect } from 'react';
import { useColorScheme } from '@mui/material/styles';

export function useSystemColorMode() {
  const { setMode } = useColorScheme();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newMode = e.matches ? 'dark' : 'light';
      setMode(newMode);
      localStorage.removeItem('manual-color-mode');
    };

    const listener = (e: MediaQueryListEvent) => handleChange(e);
    mediaQuery.addEventListener('change', listener);

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [setMode]);
}
