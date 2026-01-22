import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../services/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Processing callback...', { hash: window.location.hash ? 'present' : 'absent' });

      try {
        // Give the listener in AuthContext a moment to potentially pick it up first, 
        // or just try to get it here. 
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthCallback: Error getting session:', error.message);
          const params = new URLSearchParams(window.location.search);
          const errorDescription = params.get('error_description');
          navigate('/signin?error=' + encodeURIComponent(errorDescription || error.message || 'Authentication failed.'));
          return;
        }

        if (session) {
          console.log('AuthCallback: Session found, redirecting...');
          navigate('/');
        } else {
          // If no session yet but we have a hash, wait a tiny bit and retry once
          if (window.location.hash.includes('access_token')) {
            console.log('AuthCallback: Access token found in hash but session not ready, retrying in 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              console.log('AuthCallback: Session found on retry');
              navigate('/');
              return;
            }
          }

          console.error('AuthCallback: No session established after callback');
          navigate('/signin?error=' + encodeURIComponent('Could not establish session. Please try signing in again.'));
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error:', err);
        navigate('/signin?error=' + encodeURIComponent('An unexpected error occurred.'));
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
