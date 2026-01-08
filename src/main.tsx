import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App.tsx';
import theme from './theme/theme';
import './index.css';

const getInitialMode = (): 'light' | 'dark' => {
  const manualMode = localStorage.getItem('manual-color-mode') as 'light' | 'dark' | null;

  if (manualMode === 'light' || manualMode === 'dark') {
    return manualMode;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const initialMode = getInitialMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode={initialMode} disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  </StrictMode>
);
