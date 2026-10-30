import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import { ArrowButton } from '../../components/ui/ArrowButton/ArrowButton';
import {
  AuthAlert,
  AuthDivider,
  AuthField,
  AuthSplitLayout,
  OAuthButton,
  PasswordField,
  AuthLink,
} from '../../components/auth/AuthShell/AuthShell';
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
    <AuthSplitLayout
      headline="Accessibility work, in one place."
      description="Automated audits, remediation planning, and demand letter analysis for the sites you are responsible for."
      points={[
        'Lighthouse audits in under a minute',
        'AI analysis of demand letters',
        'Remediation checklists and plans',
      ]}
      title="Welcome back"
      subtitle={
        <>
          Sign in to your account to continue, or go back to the{' '}
          <AuthLink to="/">app</AuthLink>
        </>
      }
    >
      {error && <AuthAlert severity="error">{error}</AuthAlert>}

      <Stack spacing={1.5}>
        <OAuthButton startIcon={<Icon name="github" />} onClick={() => handleSocialSignIn('github')}>
          Continue with GitHub
        </OAuthButton>
        <OAuthButton startIcon={<Icon name="google" />} onClick={() => handleSocialSignIn('google')}>
          Continue with Google
        </OAuthButton>
      </Stack>

      <AuthDivider />

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <AuthField
            id="signin-email"
            label="Email address"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Box>
            <PasswordField
              id="signin-password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              visible={showPassword}
              onToggleVisible={() => setShowPassword(!showPassword)}
            />
            <Box sx={{ textAlign: 'right' }}>
              <AuthLink to="/forgot-password" variant="caption" block>
                Forgot password?
              </AuthLink>
            </Box>
          </Box>

          <ArrowButton fullWidth type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </ArrowButton>

          <Typography variant="body2" align="center" color="text.secondary">
            Don't have an account?{' '}
            <AuthLink to="/signup">Sign up</AuthLink>
          </Typography>
        </Stack>
      </form>

      <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 6 }}>
        By continuing, you agree to Univia's{' '}
        <Link href="#" color="inherit">Terms of Service</Link> and{' '}
        <Link href="#" color="inherit">Privacy Policy</Link>.
      </Typography>
    </AuthSplitLayout>
  );
}
