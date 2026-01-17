import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  useColorScheme,
  Button,
  Stack,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSidebarMenuItems } from '../../config/navigation';
import Icon from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = getSidebarMenuItems();
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleColorMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    localStorage.setItem('manual-color-mode', nextMode);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const drawer = (
    <>
      <Toolbar />
      <Box
        sx={{ 
          overflow: 'auto', 
          py: 2, display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          pr: 'env(safe-area-inset-right)',
          pl: 'env(safe-area-inset-left)',
        }}
      >
        <nav aria-label="Main navigation" style={{ flex: 1 }}>
          <List sx={{ pt: 1, pb: 0 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.id} disablePadding sx={{ px: 2, mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive}
                    aria-label={item.ariaLabel}
                    aria-current={isActive ? 'page' : undefined}
                    disabled={item.disabled}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          opacity: 0.9,
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'text.primary' }}>
                      <Icon name={item.icon} style={{ fontSize: '1.25rem' }} aria-hidden />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {mounted && (
            <List sx={{ py: 0, display: { xxl: 'none' } }}>
              <ListItem disablePadding sx={{ px: 2 }}>
                <ListItemButton
                  onClick={toggleColorMode}
                  aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'text.primary' }}>
                    <Icon name="contrast" style={{ fontSize: '1.25rem' }} aria-hidden />
                  </ListItemIcon>
                  <ListItemText
                    primary={mode === 'dark' ? 'Color Mode' : 'Color Mode'}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </nav>

        <Box sx={{ mt: 'auto' }}>
          
          <Divider sx={{ my: 2 }} />
                  
          {!user && (
            <Stack gap={2} flexDirection="row" flexWrap="wrap" sx={{ px: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleOpenAuth('signin')}
                sx={{
                  flex: '1 1 15rem',
                  minHeight: 44,
                }}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleOpenAuth('signup')}
                sx={{
                  flex: '1 1 15rem',
                  
                  minHeight: 44,
                }}
              >
                Register
              </Button>
            </Stack>
          )}          
        </Box>
      </Box>
    </>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        anchor="top"
        ModalProps={{
          keepMounted: true,
        }}
        aria-label="Mobile navigation menu"
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '100dvw',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', xxl: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
