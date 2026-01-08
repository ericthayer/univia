import { Box, Card, CardContent, Typography, Stack, Chip, Alert } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

export default function ThemeSystemDemo() {
  const { mode } = useColorScheme();

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Dynamic Theme System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This application automatically responds to your system color preferences in real-time.
            </Typography>
          </Box>

          <Alert severity="info" variant="outlined">
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Current Mode: <Chip label={mode} size="small" sx={{ ml: 1 }} />
            </Typography>
            <Typography variant="body2">
              Try changing your system theme settings to see the app update automatically!
            </Typography>
          </Alert>

          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              How It Works
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  1. Initial Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  On first load, the app detects your system preference using the{' '}
                  <code>prefers-color-scheme</code> media query and applies the matching theme.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  2. Real-Time Listening
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A JavaScript event listener monitors for changes to your system color mode.
                  When you switch between light and dark mode in your OS settings, the app
                  automatically updates without requiring a page refresh.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  3. Manual Override
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the theme toggle button in the header to manually switch between light and dark modes.
                  Your preference is saved to localStorage and will persist across sessions.
                  Manual overrides take precedence over system preferences.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  4. Smooth Transitions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All theme changes include smooth CSS transitions for a polished user experience.
                  The transitions are automatically disabled if you have reduced motion preferences enabled.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Technical Implementation
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  CSS Custom Properties
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  MUI CSS variables enable dynamic theme switching with proper color scheme tokens
                  for both light and dark modes.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Media Query Listener
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  <code style={{ fontSize: '0.875rem', padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    window.matchMedia('(prefers-color-scheme: dark)')
                  </code>
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Accessibility Features
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High contrast ratios, semantic HTML, ARIA labels, and support for prefers-reduced-motion
                  ensure the theme system works for all users.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Browser Support
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Works across all modern browsers including Chrome, Firefox, Safari, and Edge.
                  Falls back gracefully for older browsers that don't support color scheme preferences.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
