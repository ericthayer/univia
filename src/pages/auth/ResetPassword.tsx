import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import { ArrowButton } from '../../components/ui/ArrowButton/ArrowButton';
import {
  AuthAlert,
  AuthCenterLayout,
  AuthField,
  PasswordField,
  AuthLink,
} from '../../components/auth/AuthShell/AuthShell';
import { validatePasswordChange } from '../../utils/validation';

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

    const validationError = validatePasswordChange(password, confirmPassword);
    if (validationError) {
      setError(validationError);
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
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCenterLayout
      title="Reset password"
      description="Enter your new password below."
      footer={
        <AuthLink to="/signin" block>
          <Icon name="arrow_back" style={{ fontSize: '1rem' }} aria-hidden />
          Back to sign in
        </AuthLink>
      }
    >
      {error && <AuthAlert severity="error">{error}</AuthAlert>}

      {success && <AuthAlert severity="success">Password successfully reset! Redirecting to sign in...</AuthAlert>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <PasswordField
              id="reset-password"
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              visible={showPassword}
              onToggleVisible={() => setShowPassword(!showPassword)}
            />

            <AuthField
              id="reset-confirm-password"
              label="Confirm new password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <ArrowButton fullWidth type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </ArrowButton>
          </Stack>
        </form>
      )}
    </AuthCenterLayout>
  );
}
