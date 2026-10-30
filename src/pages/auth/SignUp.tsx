import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const { error } = await signInWithOAuth(provider, { linkAnonymous: true });
      if (error) setError(getAuthErrorMessage(error, `Failed to sign up with ${provider}`));
    } catch {
      setError(`Failed to sign up with ${provider}`);
    }
  };

  return (
    <AuthSplitLayout
      headline="Start with a free account."
      description="Audit your sites and analyze demand letters. The Free plan includes:"
      points={[
        'Automated WCAG 2.2 audits',
        'Basic demand letter analysis',
        'Remediation task manager',
        'Community access',
      ]}
      title="Get started"
      subtitle={
        <>
          Create your account to start auditing, or go back to the{' '}
          <AuthLink to="/">app</AuthLink>
        </>
      }
    >
      {error && <AuthAlert severity="error">{error}</AuthAlert>}

      <Stack spacing={1.5}>
        <OAuthButton startIcon={<Icon name="github" />} onClick={() => handleSocialSignIn('github')}>
          Join with GitHub
        </OAuthButton>
        <OAuthButton startIcon={<Icon name="google" />} onClick={() => handleSocialSignIn('google')}>
          Join with Google
        </OAuthButton>
      </Stack>

      <AuthDivider />

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <AuthField
            id="signup-name"
            label="Full name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <AuthField
            id="signup-email"
            label="Email address"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordField
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            visible={showPassword}
            onToggleVisible={() => setShowPassword(!showPassword)}
          />

          <ArrowButton fullWidth type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </ArrowButton>

          <Typography variant="body2" align="center" color="text.secondary">
            Already have an account?{' '}
            <AuthLink to="/signin">Sign in</AuthLink>
          </Typography>
        </Stack>
      </form>

      <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 6 }}>
        By creating an account, you agree to Univia's{' '}
        <Link href="#" color="inherit">Terms of Service</Link> and{' '}
        <Link href="#" color="inherit">Privacy Policy</Link>.
      </Typography>
    </AuthSplitLayout>
  );
}
