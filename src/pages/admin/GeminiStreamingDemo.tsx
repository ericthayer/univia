import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fade,
  Alert,
  Chip,
} from '@mui/material';
import { useGemini } from '../../hooks/useGemini';
import Icon from '../../components/ui/Icon';

/**
 * GeminiStreamingDemo
 * A premium demonstration page for real-time streaming AI interactions
 * using the useGemini hook.
 */
const GeminiStreamingDemo: React.FC = () => {
  const [promptInput, setPromptInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const {
    generate,
    response,
    isLoading,
    isStreaming,
    error,
    attribution,
    isReady,
  } = useGemini({
    modelName: 'gemini-1.5-pro',
    useThinking: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setHasStarted(true);
    try {
      await generate(promptInput);
    } catch (err) {
      console.error("Failed to generate content:", err);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 2,
            color: 'text.primary'
          }}
        >
          Gemini Streaming Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 660 }}>
          Experience the power of real-time AI generation. This demo uses the <code>useGemini</code> hook
          with streaming enabled for a smoother, ultra-responsive experience.
        </Typography>
      </Box>

      {!isReady && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 4 }}>
          Gemini API is not configured. Please add <code>VITE_GEMINI_API_KEY</code> to your <code>.env</code> file.
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          borderRadius: 'var(--mui-shape-borderRadius)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 4
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ENTER A PROMPT
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="e.g., Explain the importance of web accessibility in 3 paragraphs..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              disabled={isLoading || isStreaming}
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'action.hover'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {attribution}
              </Typography>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || isStreaming || !promptInput.trim() || !isReady}
                startIcon={isLoading || isStreaming ? <CircularProgress size={20} color="inherit" /> : <Icon name="bolt" />}
                sx={{
                  px: 4,
                  py: 1,
                  minWidth: 160,
                }}
              >
                {isLoading ? 'Connecting...' : isStreaming ? 'Streaming...' : 'Generate Stream'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Fade in={hasStarted}>
        <Box>
          <Card
            elevation={2}
            sx={{
              borderRadius: 'var(--mui-shape-borderRadius)',
              minHeight: 200,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon name="auto_awesome" style={{ color: 'var(--mui-palette-primary-main)' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Response
                  </Typography>
                </Box>
                {isStreaming && (
                  <Chip
                    label="Receiving..."
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error.message}
                </Alert>
              )}

              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  color: response ? 'text.primary' : 'text.secondary',
                  fontFamily: 'inherit'
                }}
              >
                {response || (isLoading ? 'Waiting for Gemini...' : '')}
              </Typography>

              {isStreaming && (
                <Box
                  sx={{
                    display: 'inline-block',
                    width: 4,
                    height: 18,
                    bgcolor: 'primary.main',
                    ml: 0.5,
                    animation: 'blink 1s step-end infinite',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0 }
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Container>
  );
};

export default GeminiStreamingDemo;
