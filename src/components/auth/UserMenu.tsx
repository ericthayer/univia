import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TIER_CONFIG } from '../../types/auth';
import Icon from '../ui/Icon';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleUpgrade = () => {
    navigate('/pricing');
    handleClose();
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    navigate('/');
  };

  const handleAdminNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  if (!user || !profile) return null;

  const tierConfig = TIER_CONFIG[profile.tier];
  const tierColor = profile.tier === 'enterprise' ? 'secondary' : profile.tier === 'pro' ? 'primary' : 'default';

  return (
    <>
      <Tooltip title="User Menu">
        <IconButton
          color="primary"
          onClick={handleClick}
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
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 240,
              mt: 1.5,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {profile.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {profile.email}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip label={tierConfig.name} size="small" color={tierColor} />
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
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
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
