import { useCallback, useEffect, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { USER_TIERS } from '../../config/tierConfig';
import Icon from '../ui/Icon';
import { TonePill } from '../ui/TonePill/TonePill';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPaperRef = useRef<HTMLDivElement | null>(null);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const locationSignature = `${location.pathname}${location.search}${location.hash}`;
  const previousLocationSignatureRef = useRef(locationSignature);
  const suppressTriggerClickRef = useRef(false);
  const suppressTriggerTimeoutRef = useRef<number | null>(null);
  const routeCloseTimeoutRef = useRef<number | null>(null);

  const armTriggerSuppression = useCallback(() => {
    suppressTriggerClickRef.current = true;

    if (suppressTriggerTimeoutRef.current !== null) {
      clearTimeout(suppressTriggerTimeoutRef.current);
    }

    suppressTriggerTimeoutRef.current = window.setTimeout(() => {
      suppressTriggerClickRef.current = false;
      suppressTriggerTimeoutRef.current = null;
    }, 250);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (suppressTriggerClickRef.current) {
      return;
    }

    setAnchorEl((current) => (current ? null : event.currentTarget));
  };

  const handleClose = useCallback(() => {
    armTriggerSuppression();

    flushSync(() => {
      setAnchorEl(null);
    });
  }, [armTriggerSuppression]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (anchorEl && !anchorEl.isConnected) {
      setAnchorEl(null);
    }
  });

  useEffect(() => {
    const locationChanged = previousLocationSignatureRef.current !== locationSignature;

    if (locationChanged) {
      armTriggerSuppression();
      setAnchorEl(null);

      if (routeCloseTimeoutRef.current !== null) {
        clearTimeout(routeCloseTimeoutRef.current);
      }

      // Guard against browser click sequencing that can reopen the trigger right after navigation.
      routeCloseTimeoutRef.current = window.setTimeout(() => {
        setAnchorEl(null);
        routeCloseTimeoutRef.current = null;
      }, 150);
    }

    previousLocationSignatureRef.current = locationSignature;
  }, [locationSignature, armTriggerSuppression]);

  useEffect(() => {
    return () => {
      if (suppressTriggerTimeoutRef.current !== null) {
        clearTimeout(suppressTriggerTimeoutRef.current);
      }

      if (routeCloseTimeoutRef.current !== null) {
        clearTimeout(routeCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuPaperRef.current?.contains(target)) {
        return;
      }

      if (triggerRef.current?.contains(target)) {
        return;
      }

      handleClose();
    };

    document.addEventListener('mousedown', handleDocumentPointerDown, true);

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown, true);
    };
  }, [open, handleClose]);

  const handleSettings = () => {
    handleClose();
    setTimeout(() => {
      navigate('/settings');
    }, 0);
  };

  const handleUpgrade = () => {
    handleClose();
    setTimeout(() => {
      navigate('/pricing');
    }, 0);
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    navigate('/');
  };

  const handleAdminNavigation = (path: string) => {
    handleClose();
    setTimeout(() => {
      navigate(path);
    }, 0);
  };

  if (!user || !profile) return null;

  const tierConfig = USER_TIERS[profile.tier];
  // Tier reads by visual weight, matching the admin directory: outline, tint, inverse.
  const tierVariant = profile.tier === 'enterprise' ? 'solid' : profile.tier === 'pro' ? 'tonal' : 'outline';

  return (
    <>
      <Tooltip title="User Menu">
        <IconButton
          id="user-menu-button"
          ref={triggerRef}
          color="primary"
          onClick={handleClick}
          sx={{
            width: 44,
            height: 44,
            transition: (theme) =>
              `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
          }}
          aria-controls={open ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Icon name="account_circle" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={open}
        onClose={handleClose}
        hideBackdrop
        disableScrollLock
        MenuListProps={{
          'aria-labelledby': 'user-menu-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          root: {
            sx: {
              '&[aria-hidden="true"]': {
                pointerEvents: 'none',
              },
            },
          },
          paper: {
            ref: menuPaperRef,
            elevation: 0,
            sx: {
              minWidth: 264,
              mt: 1.5,
              ml: '-0.5rem',
              // Hairline surface, no outer shadow (ui-refresh SPEC §3.1). 4 × theme.shape.borderRadius = 16px.
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              backgroundImage: 'none',
              bgcolor: 'background.paper',
              '& .MuiList-root': { p: 0.75 },
              '& .MuiMenuItem-root': {
                minHeight: 44,
                borderRadius: 2,
                px: 1.5,
                gap: 0.5,
                transition: (theme: { transitions: { duration: { standard: number }; easing: { easeOut: string } } }) =>
                  `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
              },
              '& .MuiListItemIcon-root': { minWidth: 32, color: 'text.secondary' },
              '& .MuiDivider-root': { my: 0.75, mx: 0.5 },
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, pt: 1, pb: 1.25, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {profile.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {profile.email}
          </Typography>
          <Box sx={{ mt: 1.25, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TonePill variant={tierVariant}>{tierConfig.name}</TonePill>
            {profile.is_admin && <TonePill>Admin</TonePill>}
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <Icon name="settings" style={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>Account Settings</ListItemText>
        </MenuItem>

        {profile.tier === 'basic' && (
          <MenuItem onClick={handleUpgrade}>
            <ListItemIcon>
              <Icon name="workspace_premium" style={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText>Upgrade to Pro</ListItemText>
          </MenuItem>
        )}

        {profile.is_admin && (
          <>
            <Divider />
            <MenuItem onClick={() => handleAdminNavigation('/admin/users')}>
              <ListItemIcon>
                <Icon name="people" style={{ fontSize: 18 }} aria-hidden />
              </ListItemIcon>
              <ListItemText>User Management</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAdminNavigation('/admin/billing')}>
              <ListItemIcon>
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </ListItemIcon>
              <ListItemText>Billing Management</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAdminNavigation('/admin/settings')}>
              <ListItemIcon>
                <Icon name="settings" style={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText>Admin Settings</ListItemText>
            </MenuItem>
          </>
        )}

        <Divider />

        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Icon name="logout" style={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
