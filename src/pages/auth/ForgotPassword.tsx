import { useState } from 'react';
import Stack from '@mui/material/Stack';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import { ArrowButton } from '../../components/ui/ArrowButton/ArrowButton';
import { AuthAlert, AuthCenterLayout, AuthField, AuthLink } from '../../components/auth/AuthShell/AuthShell';

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
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCenterLayout
      title="Forgot password?"
      description="Enter your email and we'll send you a link to reset your password."
      footer={
        <AuthLink to="/signin" block>
          <Icon name="arrow_back" style={{ fontSize: '1rem' }} aria-hidden />
          Back to sign in
        </AuthLink>
      }
    >
      {error && <AuthAlert severity="error">{error}</AuthAlert>}

      {success && <AuthAlert severity="success">Check your email for the password reset link.</AuthAlert>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <AuthField
              id="forgot-email"
              label="Email address"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <ArrowButton fullWidth type="submit" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </ArrowButton>
          </Stack>
        </form>
      )}
    </AuthCenterLayout>
  );
}
