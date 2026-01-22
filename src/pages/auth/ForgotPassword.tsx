import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Stack,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import logoUniviaUrl from '../../assets/images/logo-univia.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
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
            Forgot password?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and we'll send you a link to reset your password.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Check your email for the password reset link.
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email address"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
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
