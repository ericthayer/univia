import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_TIERS } from '../config/tierConfig';
import { supabase } from '../services/supabaseClient';
import Icon from '../components/ui/Icon';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { TonePill } from '../components/ui/TonePill/TonePill';
import { validatePasswordChange } from '../utils/validation';

const WIDE = '@container (min-width: 900px)';

// Pill fields: the theme paints the whole TextField root (helper text included)
// with a square background. Clear it on the root and paint the outlined input
// instead, so corners and helper text sit on the card surface.
const pillFieldSx = {
  borderRadius: 999,
  bgcolor: 'transparent',
  '& .MuiOutlinedInput-root': { borderRadius: 999, minHeight: 48, pl: 0.5, bgcolor: 'background.default' },
  '& .MuiOutlinedInput-input': { px: 2 },
  '& .MuiInputLabel-root': { ml: 1 },
  '& .MuiFormHelperText-root': { mx: 2, mt: 1 },
} as const;

const pillButtonSx = {
  borderRadius: 999,
  minHeight: 48,
  px: 3,
  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' },
} as const;

export default function AccountSettings() {
  const { user, profile, refreshProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [auditCount, setAuditCount] = useState(0);

  const fetchAuditCount = useCallback(async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from('accessibility_audits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!error && count !== null) {
      setAuditCount(count);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (profile) {
      setFullName(profile.full_name);
      fetchAuditCount();
    }
  }, [user, profile, navigate, fetchAuditCount]);

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

  const handlePasswordUpdate = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    const validationError = validatePasswordChange(newPassword, confirmNewPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!profile) return null;

  const tierConfig = USER_TIERS[profile.tier];
  const tierVariant = profile.tier === 'enterprise' ? 'solid' : profile.tier === 'pro' ? 'tonal' : 'outline';
  const usagePercentage = profile.audit_limit > 0 ? (auditCount / profile.audit_limit) * 100 : 0;
  const limitLabel = profile.audit_limit === -1 ? 'Unlimited' : profile.audit_limit;

  const submitProfile = (event: FormEvent) => {
    event.preventDefault();
    if (saving || fullName === profile.full_name) return;
    handleSave();
  };

  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    if (passwordSaving || !newPassword || !confirmNewPassword) return;
    handlePasswordUpdate();
  };

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Account"
        title="Account Settings"
        description="Manage your profile, password, and plan."
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: '1fr',
          alignItems: 'start',
          [WIDE]: { gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)' },
        }}
      >
        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <BezelCard component="section" aria-labelledby="profile-heading" reveal={0}>
            <SectionHeader id="profile-heading" title="Profile" dense />

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
                Profile updated successfully
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={submitProfile} noValidate sx={{ display: 'grid', gap: 2.5 }}>
              <TextField
                label="Full Name"
                value={fullName}
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
                sx={pillFieldSx}
              />

              <TextField
                label="Email"
                value={profile.email}
                fullWidth
                disabled
                helperText="Email cannot be changed"
                sx={pillFieldSx}
              />

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || fullName === profile.full_name}
                  sx={pillButtonSx}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </BezelCard>

          <BezelCard component="section" aria-labelledby="security-heading" reveal={1}>
            <SectionHeader id="security-heading" title="Security" dense />
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2.5 }}>
              Update your account password.
            </Typography>

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
                Password updated successfully
              </Alert>
            )}
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {passwordError}
              </Alert>
            )}

            <Box component="form" onSubmit={submitPassword} noValidate sx={{ display: 'grid', gap: 2.5 }}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={pillFieldSx}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                          sx={{ minHeight: 40, minWidth: 56, borderRadius: 999, mr: 0.5 }}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                sx={pillFieldSx}
              />

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordSaving || !newPassword || !confirmNewPassword}
                  sx={pillButtonSx}
                >
                  {passwordSaving ? 'Updating…' : 'Update Password'}
                </Button>
              </Box>
            </Box>
          </BezelCard>
        </Box>

        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <BezelCard component="section" aria-labelledby="plan-heading" reveal={2}>
            <SectionHeader
              id="plan-heading"
              title="Current Plan"
              dense
              action={<TonePill variant={tierVariant}>{tierConfig.name}</TonePill>}
            />

            <Typography variant="h4" component="p" sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {tierConfig.price}
            </Typography>

            <Typography variant="eyebrow" component="p" sx={{ mt: 3, mb: 1.5 }}>
              Included
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25 }}>
              {tierConfig.features.map((feature: string) => (
                <Box component="li" key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                  <Box aria-hidden="true" sx={{ color: 'success.main', display: 'flex', mt: '3px' }}>
                    <Icon name="check_circle" style={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>

            {profile.tier === 'basic' && (
              <Box sx={{ mt: 3 }}>
                <ArrowButton onClick={() => navigate('/pricing')} startIcon={<Icon name="workspace_premium" />}>
                  Upgrade to Pro
                </ArrowButton>
              </Box>
            )}
          </BezelCard>

          <BezelCard component="section" aria-labelledby="usage-heading" reveal={3}>
            <SectionHeader id="usage-heading" title="Usage" dense />

            <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
              Audits saved
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
              <Typography variant="h3" component="p" sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                {auditCount}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                of {limitLabel}
              </Typography>
            </Box>

            {profile.audit_limit > 0 && (
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                aria-label="Audits saved against your plan limit"
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    bgcolor: usagePercentage > 90 ? 'error.main' : 'primary.main',
                  },
                }}
              />
            )}

            {usagePercentage > 90 && profile.tier === 'basic' && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 3 }}>
                You're approaching your audit limit. Upgrade to Pro for unlimited audits.
              </Alert>
            )}
          </BezelCard>
        </Box>
      </Box>

      <BezelCard component="section" aria-labelledby="danger-heading" accent="error" reveal={4} sx={{ mt: 3 }}>
        <SectionHeader id="danger-heading" title="Danger Zone" dense />
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '60ch' }}>
          Once you delete your account, there is no going back. This action cannot be undone.
        </Typography>
        <Box sx={{ mt: 2.5 }}>
          <Button variant="outlined" color="error" sx={{ borderRadius: 999, minHeight: 48, px: 3 }}>
            Delete Account
          </Button>
        </Box>
      </BezelCard>
    </PageCanvas>
  );
}
