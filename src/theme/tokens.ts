export const primitiveTokens = {
  light: {
    primary: {
      main: '#252525',
      light: '#333333',
      dark: '#252525',
      contrastText: '#FCFCFC',
    },
    secondary: {
      main: '#666666',
      light: '#999999',
      dark: '#333333',
      contrastText: '#FCFCFC',
    },
    success: {
      main: '#166534',
      light: '#15803d',
      dark: '#14532d',
      contrastText: '#FCFCFC',
    },
    warning: {
      main: '#ca8a04',
      light: '#eab308',
      dark: '#a16207',
      contrastText: '#FCFCFC',
    },
    error: {
      main: '#b91c1c',
      light: '#dc2626',
      dark: '#991b1b',
      contrastText: '#FCFCFC',
    },
    background: {
      default: '#FCFCFC',
      paper: '#F5F5F5',
    },
    text: {
      primary: '#252525',
      secondary: '#666666',
    },
    divider: '#E1E1E1',
  },
  dark: {
    primary: {
      main: '#FCFCFC',
      light: '#F5F5F5',
      dark: '#E5E5E5',
      contrastText: '#252525',
    },
    secondary: {
      main: '#A3A3A3',
      light: '#D4D4D4',
      dark: '#737373',
      contrastText: '#252525',
    },
    success: {
      main: '#4ade80',
      light: '#86efac',
      dark: '#22c55e',
      contrastText: '#252525',
    },
    warning: {
      main: '#facc15',
      light: '#fde047',
      dark: '#eab308',
      contrastText: '#252525',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
      contrastText: '#252525',
    },
    background: {
      default: '#0A0A0A',
      paper: '#171717',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A3A3A3',
    },
    divider: '#333',
  },
} as const;
