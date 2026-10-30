import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Icon from '../../components/ui/Icon';
import { BezelCard } from '../../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { ScoreBar } from '../../components/ui/ScoreBar/ScoreBar';
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader';
import { TonePill } from '../../components/ui/TonePill/TonePill';
import type { Tone } from '../../components/ui/tone';
import { srOnly } from '../../components/ui/srOnly';
import { ensureSession } from '../../services/session';
import { getSupabaseFunctionHeaders, getSupabaseFunctionUrl } from '../../services/supabaseFunctions';

const WIDE = '@container (min-width: 900px)';

interface AnalysisDebugInfo {
  analysisMethod: string;
  aiModel: string;
  hasGeminiKey: boolean;
  fileType: string;
  timestamp: string;
}

interface AnalysisResult {
  success: boolean;
  letter_id?: string;
  analysis: {
    documentSummary: string;
    documentType: string;
    keyPoints: string[];
    recommendedActions: string[];
    urgencyLevel: string;
    extractedData: {
      plaintiffName?: string;
      attorneyName?: string;
      attorneyFirm?: string;
      responseDeadline?: string;
      settlementAmount?: number;
      violationsCited?: string[];
    };
    confidenceScores?: Record<string, number>;
  };
  debug?: AnalysisDebugInfo;
  error?: string;
  errorType?: string;
}

export default function DocumentAnalysisTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleTest = async () => {
    if (!file) return;
    const currentSession = await ensureSession({ allowAnonymous: false });
    if (!currentSession?.access_token) {
      setError('Authentication required');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const apiUrl = getSupabaseFunctionUrl('analyze-document');

      console.log('[TEST] Sending request to:', apiUrl);
      console.log('[TEST] File type:', file.type);
      console.log('[TEST] File size:', file.size);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getSupabaseFunctionHeaders(currentSession.access_token),
        body: JSON.stringify({
          fileContent: base64Content,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      console.log('[TEST] Response status:', response.status);

      const resultData = await response.json();
      console.log('[TEST] Response data:', resultData);

      if (!response.ok) {
        const errorMsg = resultData.error || 'Failed to analyze document';
        const hint = resultData.hint ? `\n${resultData.hint}` : '';
        const details = resultData.errorDetails ? `\nDetails: ${resultData.errorDetails}` : '';
        const fullError = errorMsg + hint + details;

        console.error('[TEST] Error message:', fullError);
        setError(fullError);
        setResult({ ...resultData, success: false });
      } else {
        setResult(resultData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[TEST] Error:', err);
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const urgencyTone = (level: string): Tone =>
    level === 'critical' ? 'error' : level === 'high' ? 'warning' : 'success';

  const extracted = result?.analysis?.extractedData;
  const extractedRows: Array<[string, string]> = extracted
    ? ([
        ['Plaintiff', extracted.plaintiffName],
        ['Attorney', extracted.attorneyName],
        ['Law Firm', extracted.attorneyFirm],
        ['Deadline', extracted.responseDeadline],
        [
          'Settlement Amount',
          extracted.settlementAmount ? `$${extracted.settlementAmount.toLocaleString()}` : undefined,
        ],
      ] as Array<[string, string | undefined]>).filter((row): row is [string, string] => Boolean(row[1]))
    : [];

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Admin"
        title="Document Analysis Test"
        description="Test the document analysis feature and view debug information. Uploaded files are sent to Google Gemini."
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: '1fr',
          alignItems: 'start',
          [WIDE]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <BezelCard component="section" aria-labelledby="test-upload-heading">
            <SectionHeader id="test-upload-heading" title="Upload Test Document" dense />

            <Box
              component="label"
              htmlFor="test-file-upload"
              sx={{
                display: 'block',
                border: '1.5px dashed',
                borderColor: 'divider',
                borderRadius: (theme) => `${theme.surfaces.coreRadius}px`,
                p: 3,
                textAlign: 'center',
                bgcolor: 'action.hover',
                cursor: 'pointer',
                mb: 2.5,
                transition: (theme) =>
                  `border-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
                '&:hover': { borderColor: 'text.secondary' },
                '&:focus-within': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              <Box
                component="input"
                id="test-file-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                sx={srOnly}
              />
              <Box
                aria-hidden="true"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  fontSize: '1.5rem',
                }}
              >
                <Icon name="upload_file" />
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {file ? file.name : 'Choose a file'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {file ? `${file.type} • ${(file.size / 1024).toFixed(1)} KB` : 'PNG, JPG, WebP or PDF'}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleTest}
              disabled={!file || uploading}
              startIcon={<Icon name={uploading ? 'hourglass_empty' : 'tools'} />}
              sx={{
                borderRadius: 999,
                minHeight: 48,
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' },
              }}
            >
              {uploading ? 'Testing…' : 'Run Test'}
            </Button>

            <Box role="status" aria-live="polite">
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress aria-label="Running document analysis test" sx={{ borderRadius: 999 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Check browser console for detailed logs
                  </Typography>
                </Box>
              )}
            </Box>
          </BezelCard>

          <BezelCard component="section" aria-labelledby="test-instructions-heading">
            <SectionHeader id="test-instructions-heading" title="Instructions" dense />
            <Box component="ol" sx={{ pl: 2.5, m: 0, display: 'grid', gap: 1 }}>
              <Typography component="li" variant="body2">
                Open browser DevTools (F12) and go to Console tab
              </Typography>
              <Typography component="li" variant="body2">
                Upload an image (PNG/JPG) or PDF document
              </Typography>
              <Typography component="li" variant="body2">
                Click "Run Test" and watch the console output
              </Typography>
              <Typography component="li" variant="body2">
                Review the debug information on the right
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2.5, borderRadius: 3 }}>
              PDFs are not currently supported. Please convert to image format for testing.
            </Alert>
          </BezelCard>
        </Box>

        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Error
              </Typography>
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {error}
              </Typography>
            </Alert>
          )}

          {result && (
            <>
              <BezelCard component="section" aria-labelledby="test-debug-heading">
                <SectionHeader id="test-debug-heading" title="Debug Information" dense />

                {result.debug && (
                  <Box
                    component="dl"
                    sx={{
                      m: 0,
                      display: 'grid',
                      gap: 1.5,
                      '& dt': { color: 'text.secondary', typography: 'body2' },
                      '& dd': { m: 0, fontWeight: 600, typography: 'body2', textAlign: 'right' },
                      '& .row': { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 },
                    }}
                  >
                    <Box className="row">
                      <dt>Analysis Method</dt>
                      <dd>
                        <TonePill tone={result.debug.analysisMethod.includes('gemini') ? 'success' : 'neutral'}>
                          {result.debug.analysisMethod}
                        </TonePill>
                      </dd>
                    </Box>
                    <Box className="row">
                      <dt>AI Model</dt>
                      <dd>{result.debug.aiModel}</dd>
                    </Box>
                    <Box className="row">
                      <dt>Gemini API Key</dt>
                      <dd>
                        <TonePill tone={result.debug.hasGeminiKey ? 'success' : 'error'} dot>
                          {result.debug.hasGeminiKey ? 'Configured' : 'Not Configured'}
                        </TonePill>
                      </dd>
                    </Box>
                    <Box className="row">
                      <dt>File Type</dt>
                      <dd>{result.debug.fileType}</dd>
                    </Box>
                    <Box className="row">
                      <dt>Timestamp</dt>
                      <dd style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(result.debug.timestamp).toLocaleTimeString()}
                      </dd>
                    </Box>
                  </Box>
                )}

                {result.errorType && (
                  <Alert severity="warning" sx={{ mt: 2, borderRadius: 3 }}>
                    <Typography variant="caption">Error Type: {result.errorType}</Typography>
                  </Alert>
                )}
              </BezelCard>

              {result.success && result.analysis && (
                <BezelCard component="section" aria-labelledby="test-results-heading">
                  <SectionHeader id="test-results-heading" title="Analysis Results" dense />

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                    <TonePill>{result.analysis.documentType}</TonePill>
                    <TonePill tone={urgencyTone(result.analysis.urgencyLevel)} dot>
                      {result.analysis.urgencyLevel} urgency
                    </TonePill>
                  </Box>

                  <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
                    Summary
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2.5 }}>
                    {result.analysis.documentSummary}
                  </Typography>

                  {extractedRows.length > 0 && (
                    <>
                      <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
                        Extracted Data
                      </Typography>
                      <Box component="dl" sx={{ m: 0, mb: 2.5, display: 'grid', gap: 0.75 }}>
                        {extractedRows.map(([label, value]) => (
                          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                            <Typography component="dt" variant="body2" color="text.secondary">
                              {label}
                            </Typography>
                            <Typography
                              component="dd"
                              variant="body2"
                              sx={{ m: 0, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                            >
                              {value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                  {result.analysis.confidenceScores &&
                    Object.keys(result.analysis.confidenceScores).length > 0 && (
                      <>
                        <Typography variant="eyebrow" component="p" sx={{ mb: 1.5 }}>
                          Confidence Scores
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                          {Object.entries(result.analysis.confidenceScores).map(([key, value]) => (
                            <ScoreBar key={key} label={key} value={value * 100} size="sm" />
                          ))}
                        </Box>
                      </>
                    )}
                </BezelCard>
              )}
            </>
          )}

          {!result && !error && (
            <BezelCard>
              <EmptyState
                icon="analytics"
                title="No Test Results Yet"
                description="Upload a document and run a test to see results"
              />
            </BezelCard>
          )}
        </Box>
      </Box>
    </PageCanvas>
  );
}
