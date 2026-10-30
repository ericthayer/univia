import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';

export interface PageCanvasProps {
  children: ReactNode;
  maxWidth?: 'lg' | 'xl';
}

/**
 * Page root for the refreshed screens: a faint top-centered glow, the shared
 * container width, and consistent vertical rhythm. The container is a CSS
 * size container so children can use `@container` queries.
 */
export function PageCanvas({ children, maxWidth = 'lg' }: PageCanvasProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        isolation: 'isolate',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        py: { xs: 4, md: 6 },
        '&::before': {
          content: '""',
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: 480,
          zIndex: -1,
          pointerEvents: 'none',
          background: 'radial-gradient(60% 40% at 50% 0%, rgba(0, 0, 0, 0.03), transparent 70%)',
          ...theme.applyStyles('dark', {
            background: 'radial-gradient(60% 40% at 50% 0%, rgba(255, 255, 255, 0.05), transparent 70%)',
          }),
        },
      }}
    >
      <Container
        maxWidth={maxWidth}
        sx={{
          px: { xs: 2, sm: 4 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          containerType: 'inline-size',
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default PageCanvas;
