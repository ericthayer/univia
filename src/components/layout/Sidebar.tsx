import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSidebarMenuItems, MenuItem } from '../../config/navigation';
import Icon from '../ui/Icon';
import { useThemeToggle } from '../../hooks/useThemeToggle';
import { controlRadius } from '../../theme/tokens';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRegistered } = useAuth();
  const menuItems = getSidebarMenuItems(isRegistered);
  const { resolvedMode, toggle: toggleColorMode } = useThemeToggle();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigation = (path: string) => {
    onMobileClose();
    // Small delay to ensure drawer starts closing before navigation
    setTimeout(() => navigate(path), 50);
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
            {menuItems.map((item: MenuItem) => {
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
                      borderRadius: controlRadius,
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
                  aria-label={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  sx={{
                    borderRadius: controlRadius,
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
                    primary="Theme"
                  />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </nav>

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
    </>
  );
}
