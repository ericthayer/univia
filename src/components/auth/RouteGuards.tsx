import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ROUTE_PATHS } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
}

function RouteLoadingFallback() {
  return (
    <Box
      component="main"
      aria-label="Loading secure area"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60svh',
      }}
    >
      <CircularProgress aria-label="Loading" />
    </Box>
  );
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.SIGN_IN} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: RouteGuardProps) {
  const { loading, profileLoading, user, profile } = useAuth();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return <RouteLoadingFallback />;
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.SIGN_IN} replace state={{ from: location }} />;
  }

  if (!profile?.is_admin) {
    return (
      <Box component="main" role="alert" sx={{ p: 3 }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Access denied
        </Typography>
        <Typography color="text.secondary">
          You do not have permission to view this area.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
