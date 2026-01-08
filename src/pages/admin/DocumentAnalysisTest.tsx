import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import Icon from '../../components/ui/Icon';

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

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;

      console.log('[TEST] Sending request to:', apiUrl);
      console.log('[TEST] File type:', file.type);
      console.log('[TEST] File size:', file.size);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
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

  const getStatusColor = (status: boolean) => {
    return status ? 'success' : 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Document Analysis Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test the document analysis feature and view debug information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Upload Test Document
            </Typography>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.default',
                mb: 3,
              }}
            >
              <input
                id="test-file-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="test-file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<Icon name="upload_file" />}
                >
                  Choose File
                </Button>
              </label>

              {file && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {file.type} • {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleTest}
              disabled={!file || uploading}
              startIcon={<Icon name={uploading ? 'hourglass_empty' : 'bug_report'} />}
            >
              {uploading ? 'Testing...' : 'Run Test'}
            </Button>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Check browser console for detailed logs
                </Typography>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Instructions
            </Typography>
            <Box component="ol" sx={{ pl: 2.5 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Open browser DevTools (F12) and go to Console tab
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Upload an image (PNG/JPG) or PDF document
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Click "Run Test" and watch the console output
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Review the debug information on the right
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              PDFs are not currently supported. Please convert to image format for testing.
            </Alert>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Debug Information
                </Typography>

                {result.debug && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Analysis Method:
                      </Typography>
                      <Chip
                        label={result.debug.analysisMethod}
                        size="small"
                        color={result.debug.analysisMethod.includes('gemini') ? 'success' : 'default'}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        AI Model:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {result.debug.aiModel}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Gemini API Key:
                      </Typography>
                      <Chip
                        label={result.debug.hasGeminiKey ? 'Configured' : 'Not Configured'}
                        size="small"
                        color={getStatusColor(result.debug.hasGeminiKey)}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        File Type:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {result.debug.fileType}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Timestamp:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(result.debug.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {result.errorType && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="warning">
                      <Typography variant="caption">
                        Error Type: {result.errorType}
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Paper>

              {result.success && result.analysis && (
                <>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Analysis Results
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Document Type
                        </Typography>
                        <Chip label={result.analysis.documentType} color="primary" />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Urgency Level
                        </Typography>
                        <Chip
                          label={result.analysis.urgencyLevel}
                          color={
                            result.analysis.urgencyLevel === 'critical'
                              ? 'error'
                              : result.analysis.urgencyLevel === 'high'
                              ? 'warning'
                              : 'success'
                          }
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Summary
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {result.analysis.documentSummary}
                      </Typography>

                      {result.analysis.extractedData && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Extracted Data
                          </Typography>
                          {result.analysis.extractedData.plaintiffName && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Plaintiff:</strong> {result.analysis.extractedData.plaintiffName}
                            </Typography>
                          )}
                          {result.analysis.extractedData.attorneyName && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Attorney:</strong> {result.analysis.extractedData.attorneyName}
                            </Typography>
                          )}
                          {result.analysis.extractedData.attorneyFirm && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Law Firm:</strong> {result.analysis.extractedData.attorneyFirm}
                            </Typography>
                          )}
                          {result.analysis.extractedData.responseDeadline && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Deadline:</strong> {result.analysis.extractedData.responseDeadline}
                            </Typography>
                          )}
                          {result.analysis.extractedData.settlementAmount && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Settlement Amount:</strong> $
                              {result.analysis.extractedData.settlementAmount.toLocaleString()}
                            </Typography>
                          )}
                        </>
                      )}

                      {result.analysis.confidenceScores &&
                        Object.keys(result.analysis.confidenceScores).length > 0 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                              Confidence Scores
                            </Typography>
                            {Object.entries(result.analysis.confidenceScores).map(([key, value]) => (
                              <Box key={key} sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption">{key}</Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {(value * 100).toFixed(0)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={value * 100}
                                  sx={{ height: 6, borderRadius: 1 }}
                                />
                              </Box>
                            ))}
                          </>
                        )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}

          {!result && !error && (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: 'background.default',
                border: '2px dashed',
                borderColor: 'divider',
              }}
            >
              <Icon name="science" style={{ fontSize: 64, color: '#94A3B8', marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary">
                No Test Results Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a document and run a test to see results
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
