import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import Icon from '../components/ui/Icon';
import { useGemini } from '../hooks/useGemini';

/**
 * AnalyzeReport Page Component
 * Allows users to analyze audit reports or documents using Gemini AI.
 */
export default function AnalyzeReport() {
  const [prompt, setPrompt] = useState('');
  const {
    generate,
    response,
    isLoading,
    error,
    isStreaming
  } = useGemini();

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) return;

    await generate(prompt);
  }, [prompt, generate]);

  const handleClear = useCallback(() => {
    setPrompt('');
  }, []);

  return (
    <Box
      component="article"
      sx={{
        p: { xs: 2, md: 4, lg: 6 },
        maxWidth: 1200,
        mx: 'auto'
      }}
    >
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Analyze Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Leverage Google Gemini to extract insights and remediation steps from your audit data.
          </Typography>
        </Box>
        <Tooltip title="View Documentation">
          <IconButton color="primary">
            <Icon name="help_outline" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={4}>
        {/* Input Interface */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 'var(--mui-shape-borderRadius)',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Report Content or Observations
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Paste audit data, error logs, or accessibility observations here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading || isStreaming}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'action.hover',
                }
              }}
              aria-label="Audit report content"
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={isLoading || isStreaming || !prompt}
                startIcon={<Icon name="delete" />}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={isLoading || isStreaming || !prompt.trim()}
                startIcon={isLoading || isStreaming ? <LinearProgress sx={{ width: 20 }} color="inherit" /> : <Icon name="auto_awesome" />}
                sx={{ minWidth: 160 }}
              >
                {isLoading ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Status and Progress */}
        {(isLoading || isStreaming) && (
          <Paper
            variant="outlined"
            sx={{ p: 2, bgcolor: 'primary.50', borderColor: 'primary.200', borderRadius: 2 }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  Analyzing report securely...
                </Typography>
                <LinearProgress />
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error.message}
          </Alert>
        )}

        {/* Results Stream */}
        {response && (
          <Card
            elevation={2}
            sx={{
              borderRadius: 'var(--mui-shape-borderRadius)',
              bgcolor: 'background.paper',
              minHeight: 200
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Icon name="auto_graph" style={{ color: 'var(--mui-palette-primary-main)' }} />
                <Typography variant="h6">Analysis Results</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Chip label="AI Generated" size="small" variant="outlined" color="primary" />
              </Stack>

              <Box
                sx={{
                  typography: 'body1',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  color: 'text.primary'
                }}
              >
                {response}
              </Box>

              {!isLoading && !isStreaming && (
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="text" size="small" startIcon={<Icon name="content_copy" />}>
                    Copy to Clipboard
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
