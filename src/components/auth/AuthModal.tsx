import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  Link,
  IconButton,
  Stack,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../ui/Icon';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onClose, initialMode = 'signin' }: AuthModalProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
    }
  }, [open, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    onClose();
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} maxWidth="xs">
      <DialogTitle sx={{ pr: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
          <IconButton onClick={handleClose} size="small">
            <Icon name="close" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          
          <Stack gap={3}>
            <Stack>
              {mode === 'signup' && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="fullName"
                  label="Full Name"
                  name="fullName"
                  autoComplete="name"
                  autoFocus={mode === 'signup'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}
    
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus={mode === 'signin'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
    
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Stack>

            <Stack gap={1}>
  
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
    
              <Typography variant="body2" align="center">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Link
                  component="button"
                  type="button"
                  onClick={toggleMode}
                  sx={{ cursor: 'pointer' }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Link>
              </Typography>
  
            </Stack>
          </Stack>

          {mode === 'signup' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                By signing up, you get access to the Basic plan (free forever) which includes:
              </Typography>
              <Typography variant="caption" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Save up to 20 audits</li>
                <li>Pin important audits</li>
                <li>Full audit history</li>
                <li>Violation tracking & comparison</li>
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
