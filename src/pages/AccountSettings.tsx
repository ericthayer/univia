import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TIER_CONFIG } from '../types/auth';
import { supabase } from '../services/supabaseClient';
import Icon from '../components/ui/Icon';

export default function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (profile) {
      setFullName(profile.full_name);
      fetchAuditCount();
    }
  }, [user, profile, navigate]);

  const fetchAuditCount = async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from('accessibility_audits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!error && count !== null) {
      setAuditCount(count);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  if (!profile) return null;

  const tierConfig = TIER_CONFIG[profile.tier];
  const tierColor = profile.tier === 'enterprise' ? 'secondary' : profile.tier === 'pro' ? 'primary' : 'default';
  const usagePercentage = profile.audit_limit > 0 ? (auditCount / profile.audit_limit) * 100 : 0;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Account Settings
      </Typography>

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile updated successfully
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
            />

            <TextField
              label="Email"
              value={profile.email}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />

            <Box>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || fullName === profile.full_name}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Current Plan</Typography>
            <Chip label={tierConfig.name} color={tierColor} />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {tierConfig.price}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Features:
          </Typography>
          <Stack spacing={1}>
            {tierConfig.features.map((feature, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1}>
                <Icon name="check_circle" style={{ fontSize: 18, color: 'green' }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Stack>

          {profile.tier === 'basic' && (
            <Box mt={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Icon name="workspace_premium" />}
                onClick={() => navigate('/pricing')}
              >
                Upgrade to Pro
              </Button>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Usage Statistics
          </Typography>

          <Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Audits Saved
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {auditCount} / {profile.audit_limit === -1 ? 'Unlimited' : profile.audit_limit}
              </Typography>
            </Box>

            {profile.audit_limit > 0 && (
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: usagePercentage > 90 ? 'error.main' : 'primary.main',
                  },
                }}
              />
            )}

            {usagePercentage > 90 && profile.tier === 'basic' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You're approaching your audit limit. Upgrade to Pro for unlimited audits.
              </Alert>
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="error">
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Once you delete your account, there is no going back. This action cannot be undone.
          </Typography>
          <Button variant="outlined" color="error" sx={{ mt: 2 }}>
            Delete Account
          </Button>
        </Paper>
      </Stack>
    </Container>
  );
}
