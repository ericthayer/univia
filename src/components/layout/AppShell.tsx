import { Box } from '@mui/material';
import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import SkipToMain from '../accessibility/SkipToMain';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SkipToMain />
      <Header
        onMobileMenuToggle={handleMobileMenuToggle}
        mobileMenuOpen={mobileOpen}
      />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileMenuClose} />
      <Box
        component="main"
        id="main-content"
        role="main"
        aria-label="Main content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          backgroundColor: 'background.default',
          containerType: 'inline-size',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 500px',
          width: { xs: '100%', md: '100%', xxl: 'calc(100% - 240px)' },
          '&:focus': {
            outline: 'none',
          },
        }}
      >
        <Box sx={{ height: 66 }}></Box>
        <Box
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flexGrow: 1, '> *': { flexGrow: 1 },
            pr: 'env(safe-area-inset-right)',
            pl: 'env(safe-area-inset-left)',
          }}
        >
          {children}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}
