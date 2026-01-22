import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../services/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthCallback: Error establishing session:', error.message);
          // Check for specific error types or parameters
          const params = new URLSearchParams(window.location.search);
          const errorCode = params.get('error');
          const errorDescription = params.get('error_description');

          if (errorCode || errorDescription) {
            console.error('AuthCallback: URL error params found:', { errorCode, errorDescription });
          }

          navigate('/signin?error=' + encodeURIComponent(errorDescription || error.message || 'Authentication failed. Please try again.'));
        } else {
          console.log('AuthCallback: Session established successfully');
          navigate('/');
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error during auth callback:', err);
        navigate('/signin?error=' + encodeURIComponent('An unexpected error occurred during authentication.'));
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        Completing sign in...
      </Typography>
    </Box>
  );
}
