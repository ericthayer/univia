import { useState, useCallback, useEffect, useRef, FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Icon from '../components/ui/Icon';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { TonePill } from '../components/ui/TonePill/TonePill';
import { srOnly } from '../components/ui/srOnly';
import { useGemini } from '../hooks/useGemini';

const WIDE = '@container (min-width: 960px)';

/**
 * AnalyzeReport Page Component
 * Allows users to analyze audit reports or documents using Gemini AI.
 */
export default function AnalyzeReport() {
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    generate,
    response,
    isLoading,
    error,
    isStreaming
  } = useGemini();

  const busy = isLoading || isStreaming;

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) return;

    await generate(prompt);
  }, [prompt, generate]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    handleAnalyze();
  };

  const handleClear = useCallback(() => {
    setPrompt('');
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [response]);

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Gemini"
        title="Analyze Report"
        description="Extract insights and remediation steps from your audit data. What you paste is sent to Google Gemini for analysis. AI output can be wrong, so review it before relying on it."
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: '1fr',
          alignItems: 'start',
          [WIDE]: { gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)' },
        }}
      >
        <BezelCard component="section" aria-labelledby="report-input-heading" reveal={0}>
          <SectionHeader id="report-input-heading" title="Report content" dense />
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              fullWidth
              multiline
              minRows={8}
              maxRows={20}
              label="Audit data, error logs, or observations"
              placeholder="Paste audit data, error logs, or accessibility observations here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={busy}
              helperText={`${prompt.length.toLocaleString()} characters`}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'action.hover' },
                '& .MuiFormHelperText-root': { fontVariantNumeric: 'tabular-nums', mx: 0.5 },
              }}
            />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={busy || !prompt}
                startIcon={<Icon name="delete" />}
                sx={{ borderRadius: 999, minHeight: 48, px: 3 }}
              >
                Clear
              </Button>
              <ArrowButton
                type="submit"
                disabled={busy || !prompt.trim()}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ minWidth: 180 }}
              >
                {isLoading ? 'Analyzing…' : 'Run Analysis'}
              </ArrowButton>
            </Box>
          </Box>
        </BezelCard>

        <BezelCard component="section" aria-labelledby="report-results-heading" reveal={1} sx={{ minHeight: 320 }}>
          <SectionHeader
            id="report-results-heading"
            title="Analysis Results"
            dense
            action={response ? <TonePill variant="outline">AI generated</TonePill> : undefined}
          />

          <Box role="status" aria-live="polite" sx={srOnly}>
            {busy ? 'Analyzing report securely' : response ? 'Analysis complete' : ''}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
              {error.message}
            </Alert>
          )}

          {isLoading && !response ? (
            <Box aria-hidden="true" sx={{ display: 'grid', gap: 1.25, pt: 1 }}>
              <Skeleton variant="text" width="92%" />
              <Skeleton variant="text" width="84%" />
              <Skeleton variant="text" width="88%" />
              <Skeleton variant="text" width="52%" />
            </Box>
          ) : response ? (
            <>
              <Box
                aria-live="polite"
                aria-busy={isStreaming}
                sx={{
                  typography: 'body1',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.75,
                  maxWidth: '72ch',
                  color: 'text.primary',
                }}
              >
                {response}
              </Box>

              {!busy && (
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button variant="text" size="small" onClick={handleCopy} sx={{ minHeight: 44, borderRadius: 999 }}>
                    {copied ? 'Copied' : 'Copy to clipboard'}
                  </Button>
                </Box>
              )}
            </>
          ) : !error ? (
            <EmptyState
              compact
              icon="analytics"
              title="No analysis yet"
              description="Paste a report on the left and run the analysis. Results appear here."
            />
          ) : null}
        </BezelCard>
      </Box>
    </PageCanvas>
  );
}
