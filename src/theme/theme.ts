import { createTheme } from '@mui/material/styles';
import { primitiveTokens } from './tokens';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-color-scheme',
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  colorSchemes: {
    light: {
      palette: primitiveTokens.light,
    },
    dark: {
      palette: primitiveTokens.dark,
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 475,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 700,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 450,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 450,
    },
    button: {
      textTransform: 'none',
      fontWeight: 550,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 4,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.05)',
    '0 1px 3px rgba(0, 0, 0, 0.1)',
    '0 1px 4px rgba(0, 0, 0, 0.1)',
    '0 2px 4px rgba(0, 0, 0, 0.1)',
    '0 2px 8px rgba(0, 0, 0, 0.1)',
    '0 4px 8px rgba(0, 0, 0, 0.1)',
    '0 4px 16px rgba(0, 0, 0, 0.1)',
    '0 8px 16px rgba(0, 0, 0, 0.1)',
    '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 60px rgba(0, 0, 0, 0.15)',
  ],
  breakpoints: {
    values: {
      xs: 0,
      tiny: 360,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      xxl: 1800,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'a': {
          color: 'inherit',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          borderWidth: 2,
          fontSize: '1rem',
          fontWeight: 550,
          textTransform: 'none',

          '&.Mui-disabled': {
            color: 'var(--mui-palette-text-secondary)',
            borderWidth: 2,
            pointerEvents: 'all',
            cursor: 'not-allowed',
          }
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
        text: {
          color: 'var(--mui-palette-action-active)',
          p: 0,
          minWidth: 'auto',
          textDecoration: 'underline !important',
          '&:hover': {
            color: 'var(--mui-palette-text-primary)',
          },
        },       
        sizeLarge: {
          padding: '.875rem 1.5rem',
          fontSize: '1.125rem',
        },
        sizeSmall: {
          padding: '.5rem 1rem',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid var(--mui-palette-divider)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiPopper: {
      styleOverrides: {
        root: {
          '.MuiTooltip-tooltip': {
            fontSize: '0.8rem !important',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--mui-shape-borderRadius)',
          fontWeight: 550,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid var(--mui-palette-divider)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {          
          '.MuiTypography-root': {
            fontWeight: 550,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {          
          minHeight: 44,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {          
          background: 'var(--mui-palette-background-default)',
          borderRadius: 'var(--mui-shape-borderRadius)',
        },
      },
    },
  },
});

export default theme;
