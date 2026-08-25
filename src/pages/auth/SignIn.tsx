import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import logoUniviaUrl from '../../assets/images/logo-univia.svg';
import { getAuthErrorMessage } from '../../utils/authError';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clean up the URL
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github' | 'apple') => {
    setError(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) setError(getAuthErrorMessage(error, `Failed to sign in with ${provider}`));
    } catch {
      setError(`Failed to sign in with ${provider}`);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: 'background.default',
      }}
    >
      {/* Left Side - Brand/Content (Hidden on mobile) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 8,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            opacity: 0.1,
            transform: 'rotate(-15deg)',
          }}
        >
          <Icon name="verified_user" style={{ fontSize: '20rem' }} />
        </Box>

        <Box sx={{ maxWidth: 480, position: 'relative', zIndex: 1 }}>
          <Typography variant="h1" gutterBottom fontWeight={800} sx={{ color: 'inherit' }}>
            Elevate Your Accessibility
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 4, color: 'inherit' }}>
            The all-in-one platform for automated audits, remediation planning, and legal compliance.
          </Typography>

          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: 'none', color: 'inherit' }}>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                "Univia has transformed how we handle digital compliance. What used to take weeks now takes hours."
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="person" />
                </Box>
                <Box textAlign="left">
                  <Typography variant="subtitle2" fontWeight={700}>Sarah Jenkins</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Head of Product, TechCorp</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Right Side - Auth Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, md: 8 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                mb: 2,
                textDecoration: 'none',
                cursor: 'pointer',
                '[data-color-scheme="dark"] &': {
                  '> img': { filter: 'invert(1)' },
                },
              }}
            >
              <img src={logoUniviaUrl} alt="Univia Logo" style={{ width: 120, height: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account to continue, or go back to the{' '}
              <Link component={RouterLink} to="/" color="primary" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                app
              </Link>
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mb: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Icon name="github" />}
              onClick={() => handleSocialSignIn('github')}
              sx={{ py: 1.5 }}
            >
              Continue with GitHub
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Icon name="google" />}
              onClick={() => handleSocialSignIn('google')}
              sx={{ py: 1.5 }}
            >
              Continue with Google
            </Button>
          </Stack>

          <Divider sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              OR
            </Typography>
          </Divider>

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
              />
              <Box>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                <Box sx={{ textAlign: 'right', mt: 1 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="caption"
                    color="primary"
                    sx={{ fontWeight: 600, textDecoration: 'none' }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              </Box>

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Typography variant="body2" align="center" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/signup"
                  color="primary"
                  sx={{ fontWeight: 600, textDecoration: 'none' }}
                >
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </form>

          <Box sx={{ mt: 8 }}>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              By continuing, you agree to Univia's{' '}
              <Link href="#" color="inherit">Terms of Service</Link> and{' '}
              <Link href="#" color="inherit">Privacy Policy</Link>.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
