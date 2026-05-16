import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
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
      if (error) setError(error.message);
    } catch {
      setError(`Failed to sign up with ${provider}`);
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
            right: '5%',
            opacity: 0.1,
            transform: 'rotate(15deg)',
          }}
        >
          <Icon name="verified" style={{ fontSize: '20rem' }} />
        </Box>

        <Box sx={{ maxWidth: 480, position: 'relative', zIndex: 1 }}>
          <Typography variant="h1" gutterBottom fontWeight={800} sx={{ color: 'inherit' }}>
            Start Your Journey
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 4, color: 'inherit' }}>
            Join thousands of developers and legal teams ensuring the web is accessible for everyone.
          </Typography>

          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: 'none', color: 'inherit' }}>
            <CardContent sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Free Forever plan includes:
              </Typography>
              <Stack spacing={1.5}>
                {[
                  'Automated WCAG 2.2 Audits',
                  'Basic Demand Letter Analysis',
                  'Remediation Task Manager',
                  'Community Access',
                ].map((feature, i) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                    <Icon name="check_circle" style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <Typography variant="body2">{feature}</Typography>
                  </Stack>
                ))}
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
              Get started
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account to start auditing, or go back to the{' '}
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
              Join with GitHub
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Icon name="google" />}
              onClick={() => handleSocialSignIn('google')}
              sx={{ py: 1.5 }}
            >
              Join with Google
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
                label="Full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Email address"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <Typography variant="body2" align="center" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/signin"
                  color="primary"
                  sx={{ fontWeight: 600, textDecoration: 'none' }}
                >
                  Sign in
                </Link>
              </Typography>
            </Stack>
          </form>

          <Box sx={{ mt: 8 }}>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              By creating an account, you agree to Univia's{' '}
              <Link href="#" color="inherit">Terms of Service</Link> and{' '}
              <Link href="#" color="inherit">Privacy Policy</Link>.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
