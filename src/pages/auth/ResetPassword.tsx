import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import logoUniviaUrl from '../../assets/images/logo-univia.svg';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/signin'), 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 400, width: '100%' }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              mb: 2,
              '[data-color-scheme="dark"] &': {
                '> img': { filter: 'invert(1)' },
              },
            }}
          >
            <img src={logoUniviaUrl} alt="Univia Logo" style={{ width: 120, height: 40 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Reset password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your new password below.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Password successfully reset! Redirecting to sign in...
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="New password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        <Icon name={showPassword ? 'expand_less' : 'expand_more'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </Stack>
          </form>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Link
            component={RouterLink}
            to="/signin"
            color="primary"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              fontWeight: 600,
              textDecoration: 'none',
              gap: 1,
            }}
          >
            <Icon name="arrow_back" style={{ fontSize: '1rem' }} />
            Back to sign in
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
