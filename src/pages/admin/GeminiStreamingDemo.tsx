import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useGemini } from '../../hooks/useGemini';
import { ArrowButton } from '../../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../../components/ui/BezelCard/BezelCard';
import { PageCanvas } from '../../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader';
import { TonePill } from '../../components/ui/TonePill/TonePill';
import { srOnly } from '../../components/ui/srOnly';

/**
 * GeminiStreamingDemo
 * A demonstration page for authenticated accessibility analysis
 * using the server-backed useGemini hook.
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
  } = useGemini();

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

  const busy = isLoading || isStreaming;

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Admin"
        title="Accessibility Analysis Demo"
        description="Submit accessibility observations through the authenticated server analysis boundary. Your prompt is sent to Google Gemini."
      />

      {!isReady && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
          Sign in with an active session to use the protected analysis service.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, maxWidth: 880 }}>
        <BezelCard component="section" aria-labelledby="demo-prompt-heading">
          <SectionHeader id="demo-prompt-heading" title="Prompt" dense />
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Prompt"
              placeholder="e.g., Explain the importance of web accessibility in 3 paragraphs…"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              disabled={busy}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'action.hover' } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {attribution && (
                <Typography variant="caption" color="text.secondary">
                  {attribution}
                </Typography>
              )}
              <ArrowButton
                type="submit"
                disabled={busy || !promptInput.trim() || !isReady}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ minWidth: 180 }}
              >
                {isLoading ? 'Analyzing…' : 'Run Analysis'}
              </ArrowButton>
            </Box>
          </Box>
        </BezelCard>

        <Fade in={hasStarted} timeout={{ enter: 300 }}>
          <Box>
            <BezelCard component="section" aria-labelledby="demo-response-heading" sx={{ minHeight: 200 }}>
              <SectionHeader
                id="demo-response-heading"
                title="Response"
                dense
                action={isStreaming ? <TonePill tone="info" dot>Receiving</TonePill> : undefined}
              />

              <Box role="status" aria-live="polite" sx={srOnly}>
                {isLoading ? 'Waiting for Gemini' : isStreaming ? 'Receiving response' : ''}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                  {error.message}
                </Alert>
              )}

              <Typography
                variant="body1"
                aria-live="polite"
                aria-busy={isStreaming}
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.75,
                  maxWidth: '72ch',
                  color: response ? 'text.primary' : 'text.secondary',
                  fontFamily: 'inherit'
                }}
              >
                {response || (isLoading ? 'Waiting for Gemini…' : '')}
              </Typography>

              {isStreaming && (
                <Box
                  aria-hidden="true"
                  sx={{
                    display: 'inline-block',
                    width: 3,
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
            </BezelCard>
          </Box>
        </Fade>
      </Box>
    </PageCanvas>
  );
};

export default GeminiStreamingDemo;
