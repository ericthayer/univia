import { AppBar, Toolbar, Tooltip, IconButton, Box, Typography, Stack, Button, useColorScheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoUniviaUrl from '../../assets/images/logo-univia.svg';
import { getHeaderMenuItems } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import UserMenu from '../auth/UserMenu';
import AuthModal from '../auth/AuthModal';
import Icon from '../ui/Icon';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export default function Header({ onMobileMenuToggle, mobileMenuOpen = false }: HeaderProps) {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = getHeaderMenuItems();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleColorMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    localStorage.setItem('manual-color-mode', nextMode);
  };

  if (!mounted) {
    return null;
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        borderColor: 'divider',
        borderRadius: 0,
        pr: 'env(safe-area-inset-right)',
        pl: 'env(safe-area-inset-left)',
        '> .MuiToolbar-root': {
          py: 1,
          pl: { xs: 1 },
          pr: { xs: 2, sm: 1.5 },
        }
      }}
    >
      <Toolbar>
        <Box sx={{ flex: { xs: 1, md: 0, xxl: 1 } }}>
          <Button
            onClick={() => navigate('/')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/');
              }
            }}
            variant="text"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              borderColor: 'transparent',
              p: 1,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <Icon name="accessibility_new" />
            </Box>
            <Typography
              variant="h3"
              component="div"
              sx={{
                display: 'none',
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              Univia
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                '[data-color-scheme="dark"] &': {
                  '> img' : {
                    filter: 'invert(1)',
                  }
                },
              }}
            >
              <img src={logoUniviaUrl} alt="Univia Logo" style={{ width: 100, height: 33 }} />
            </Box>
          </Button>
        </Box>

        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: { xs: 'none', md: 'flex', xxl: 'none' },
            flex: 1,
            justifyContent: 'center',
            px: 2,
            containerType: 'inline-size',
          }}
        >
          <Stack direction="row" gap={'clamp(1rem, 3cqw, 2dvw)'}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'contained' : 'text'}
                  onClick={() => navigate(item.path)}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                  disabled={item.disabled}
                  title={item.disabled ? 'Item Disabled' : item.text}
                  
                  startIcon={ 
                  <Box className='button-icon' sx={{ display: { xs: 'none', '@800': 'flex' } }}>
                    <Icon name={item.icon} style={{ fontSize: '1.25rem' }} aria-hidden />
                    </Box>
                  }
                  
                  sx={{
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    fontSize: '1rem',
                    px: 'clamp(0.35rem, 2cqw, 0.75rem)',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.main' : 'action.hover',
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                    '.MuiButton-icon:has(> .button-icon)': {
                      display: { xs: 'none', '@800': 'inherit' }
                    },
                  }}
                >
                  {item.text}
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Stack direction="row" gap={1.5} alignItems="center" sx={{ ml: 'auto' }}>           

          {!authLoading && (
            <Box sx={{ display: { xxl: 'none' } }}>
              {user ? (
                <UserMenu />
              ) : (
                <Stack direction="row" gap={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setAuthModalMode('signin');
                      setAuthModalOpen(true);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }}
                  >
                    Register
                  </Button>
                </Stack>
              )}
            </Box>
          )}

          <Tooltip title="Toggle Color Mode">
            <IconButton
              color="primary"
              aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleColorMode}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Icon name="contrast" aria-hidden />
            </IconButton>
          </Tooltip>

          <Button
            color="primary"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            variant="contained"
            onClick={onMobileMenuToggle}
            sx={{
              background: 'transparent',
              display: { xs: 'inline-flex', md: 'none' },
              minHeight: 44,
              textTransform: 'uppercase',
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Box component="div" sx={{ bgcolor: 'primary.main' }}>Menu</Box>
          </Button>
        </Stack>

        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </Toolbar>
    </AppBar>
  );
}
