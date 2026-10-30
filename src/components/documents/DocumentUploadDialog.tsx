import { useState, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Icon from '../ui/Icon';
import LegalDisclaimer from '../ui/LegalDisclaimer';
import { ArrowButton } from '../ui/ArrowButton/ArrowButton';
import { SegmentedToggleGroup } from '../ui/SegmentedToggleGroup/SegmentedToggleGroup';
import { srOnly } from '../ui/srOnly';
import { ensureSession } from '../../services/session';
import { getSupabaseFunctionHeaders, getSupabaseFunctionUrl } from '../../services/supabaseFunctions';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (analysis: DocumentAnalysis) => void;
}

export interface LegalAnalysis {
  claimType: string;
  jurisdiction?: string;
  statuteOfLimitations?: string;
  potentialDefenses: string[];
  riskAssessment: string;
}

export interface DocumentAnalysis {
  success: boolean;
  letter_id?: string;
  analysis: {
    documentSummary: string;
    documentType: string;
    keyPoints: string[];
    recommendedActions: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    additionalResources: string[];
    extractedData: {
      plaintiffName?: string;
      attorneyName?: string;
      attorneyFirm?: string;
      responseDeadline?: string;
      settlementAmount?: number;
      violationsCited?: string[];
      caseNumber?: string;
      courtName?: string;
      filingDate?: string;
    };
    confidenceScores?: Record<string, number>;
    extractedEntities?: {
      persons: string[];
      organizations: string[];
      dates: string[];
      amounts: string[];
      legalCitations?: string[];
    };
    legalAnalysis?: LegalAnalysis;
  };
  debug?: {
    analysisMethod: string;
    aiModel: string;
    hasGeminiKey: boolean;
    fileType: string;
    modelPreference?: string;
    analysisDepth?: string;
    timestamp: string;
  };
}

type AnalysisStage = 'idle' | 'uploading' | 'processing' | 'extracting' | 'analyzing' | 'complete' | 'error';

const STAGE_MESSAGES: Record<AnalysisStage, string> = {
  idle: '',
  uploading: 'Uploading document...',
  processing: 'Processing document format...',
  extracting: 'Extracting text and data...',
  analyzing: 'Analyzing with AI...',
  complete: 'Analysis complete!',
  error: 'Analysis failed',
};

const STAGE_PROGRESS: Record<AnalysisStage, number> = {
  idle: 0,
  uploading: 15,
  processing: 35,
  extracting: 55,
  analyzing: 80,
  complete: 100,
  error: 0,
};

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export default function DocumentUploadDialog({
  open,
  onClose,
  onUploadComplete,
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [modelPreference, setModelPreference] = useState<'flash' | 'pro'>('flash');
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'detailed'>('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>('idle');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && ACCEPTED_TYPES.includes(droppedFile.type as (typeof ACCEPTED_TYPES)[number])) {
      setFile(droppedFile);
    } else {
      setError('Please upload a PDF or image file (PNG, JPG, WebP)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile && ACCEPTED_TYPES.includes(selectedFile.type as (typeof ACCEPTED_TYPES)[number])) {
      setFile(selectedFile);
    } else if (selectedFile) {
      setError('Please upload a PDF or image file (PNG, JPG, WebP)');
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setUploading(false);
    setFile(null);
    setError(null);
    setStage('idle');
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
    const currentSession = await ensureSession();
    if (!currentSession?.access_token) {
      setError('Unable to establish a secure session. Please try again.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setUploading(true);
    setError(null);
    setStage('uploading');

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

      setStage('processing');

      const apiUrl = getSupabaseFunctionUrl('analyze-document');

      setStage('extracting');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getSupabaseFunctionHeaders(currentSession.access_token),
        body: JSON.stringify({
          fileContent: base64Content,
          fileName: file.name,
          fileType: file.type,
          modelPreference,
          analysisDepth,
        }),
        signal: controller.signal,
      });

      setStage('analyzing');

      const resultData = await response.json();

      if (!response.ok) {
        const errorMsg = resultData.error || 'Failed to analyze document';
        const hint = resultData.hint ? `\n\n${resultData.hint}` : '';
        const details = resultData.errorDetails ? `\n\nDetails: ${resultData.errorDetails}` : '';
        throw new Error(errorMsg + hint + details);
      }

      setStage('complete');
      onUploadComplete(resultData);
      handleClose();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStage('idle');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      console.error('[Upload Error]', errorMessage);
      setError(errorMessage);
      setStage('error');
    } finally {
      setUploading(false);
      setAbortController(null);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setError(null);
      setStage('idle');
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: (theme) => `${theme.surfaces?.shellRadius ?? 20}px`,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <Typography variant="h6" component="span" sx={{ letterSpacing: '-0.01em' }}>
            Upload Document for Analysis
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={uploading}
            aria-label="Close upload dialog"
            sx={{ width: 44, height: 44, mr: -1 }}
          >
            <Icon name="close" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          </Alert>
        )}

        <Box
          component="label"
          htmlFor="file-upload"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            display: 'block',
            border: '1.5px dashed',
            borderColor: dragActive ? 'text.primary' : 'divider',
            borderRadius: (theme) => `${theme.surfaces?.coreRadius ?? 14}px`,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive ? 'action.hover' : 'background.default',
            transition: (theme) =>
              `border-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}, background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'text.secondary',
              bgcolor: 'action.hover',
            },
            '&:focus-within': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            style={srOnly}
          />

          {file ? (
            <Box>
              <Box
                aria-hidden="true"
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '2rem',
                }}
              >
                <Icon name={file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, overflowWrap: 'anywhere' }}>
                {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatFileSize(file.size)}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFile(null);
                }}
                sx={{ mt: 1, minHeight: 44, borderRadius: 999 }}
              >
                Remove
              </Button>
            </Box>
          ) : (
            <Box>
              <Box
                aria-hidden="true"
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '2rem',
                }}
              >
                <Icon name="cloud_upload" />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Drag and drop your document here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: PDF, PNG, JPG, WebP (max 10MB)
              </Typography>
            </Box>
          )}
        </Box>

        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }} role="status" aria-live="polite">
              <Typography variant="body2" color="text.secondary">
                {STAGE_MESSAGES[stage]}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {STAGE_PROGRESS[stage]}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={STAGE_PROGRESS[stage]}
              aria-label="Analysis progress"
              sx={{ height: 6, borderRadius: 999, '& .MuiLinearProgress-bar': { borderRadius: 999 } }}
            />
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            aria-controls="upload-advanced-options"
            endIcon={<Icon name={showAdvanced ? 'expand_less' : 'expand_more'} />}
            sx={{ mb: 1, minHeight: 44, borderRadius: 999, px: 2, ml: -2 }}
          >
            Advanced Options
          </Button>
          <Collapse in={showAdvanced} id="upload-advanced-options">
            <Box sx={{ display: 'grid', gap: 2.5, pt: 1 }}>
              <Box>
                <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
                  AI Model
                </Typography>
                <SegmentedToggleGroup
                  value={modelPreference}
                  exclusive
                  onChange={(_, value) => value && setModelPreference(value)}
                  size="small"
                  fullWidth
                  aria-label="AI model"
                >
                  <ToggleButton value="flash">
                    <Tooltip title="Faster analysis, good for most documents">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="flash_on" style={{ fontSize: 16 }} aria-hidden />
                        <span>Fast (Flash)</span>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="pro">
                    <Tooltip title="More thorough analysis, better for complex legal documents">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="psychology" style={{ fontSize: 16 }} aria-hidden />
                        <span>Pro</span>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </SegmentedToggleGroup>
              </Box>

              <Box>
                <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
                  Analysis Depth
                </Typography>
                <SegmentedToggleGroup
                  value={analysisDepth}
                  exclusive
                  onChange={(_, value) => value && setAnalysisDepth(value)}
                  size="small"
                  fullWidth
                  aria-label="Analysis depth"
                >
                  <ToggleButton value="standard">
                    <Tooltip title="Extract key information and provide recommendations">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="speed" style={{ fontSize: 16 }} aria-hidden />
                        <span>Standard</span>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="detailed">
                    <Tooltip title="In-depth legal analysis with risk assessment">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="search" style={{ fontSize: 16 }} aria-hidden />
                        <span>Detailed</span>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </SegmentedToggleGroup>
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="eyebrow" component="h3" sx={{ mb: 1 }}>
            What happens next?
          </Typography>
          <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2, m: 0 }}>
            <li>Your document will be analyzed for key information</li>
            <li>AI extracts dates, names, amounts, and violations</li>
            <li>Legal analysis with risk assessment and defenses</li>
            <li>Confidence scores show reliability of extracted data</li>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <LegalDisclaimer variant="compact" />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={uploading ? handleCancel : handleClose}
          sx={{ borderRadius: 999, minHeight: 48, px: 3 }}
        >
          Cancel
        </Button>
        <ArrowButton
          onClick={handleUpload}
          disabled={!file || uploading}
          startIcon={<Icon name={uploading ? 'hourglass_empty' : 'analytics'} />}
        >
          {uploading ? 'Analyzing...' : 'Analyze Document'}
        </ArrowButton>
      </DialogActions>
    </Dialog>
  );
}
