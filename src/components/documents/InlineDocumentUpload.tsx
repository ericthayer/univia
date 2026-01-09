import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider as MuiDivider,
} from '@mui/material';
import Icon from '../ui/Icon';
import LegalDisclaimer from '../ui/LegalDisclaimer';
import { DocumentAnalysis } from './DocumentUploadDialog';

interface InlineDocumentUploadProps {
  onUploadComplete: (analysis: DocumentAnalysis) => void;
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

export default function InlineDocumentUpload({ onUploadComplete }: InlineDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [modelPreference, setModelPreference] = useState<'flash' | 'pro'>('flash');
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'detailed'>('standard');
  // Changed from showAdvanced boolean to anchorEl for Menu popover pattern
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [stage, setStage] = useState<AnalysisStage>('idle');

  // Menu open/close state derived from anchorEl
  const menuOpen = Boolean(anchorEl);

  const acceptedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  // Handler to open the advanced options menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handler to close the advanced options menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

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
    setShowInfo(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && acceptedTypes.includes(droppedFile.type)) {
      setFile(droppedFile);
    } else {
      setError('Please upload a PDF or image file (PNG, JPG, WebP)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setShowInfo(false);
    const selectedFile = e.target.files?.[0];
    if (selectedFile && acceptedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else if (selectedFile) {
      setError('Please upload a PDF or image file (PNG, JPG, WebP)');
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setUploading(false);
      setStage('idle');
      setError('Analysis cancelled');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setShowInfo(true);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setUploading(true);
    setError(null);
    setShowInfo(false);
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

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;

      setStage('extracting');

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
      setFile(null);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </Typography>
        </Alert>
      )}

      <Box sx={{ position: 'relative' }}>
        
        {/* Upload Dropzone */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 3,
            pt: 3,
            px: 4,
            pb: 4,
            textAlign: 'center',
            bgcolor: dragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            mb: 3,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => document.getElementById('file-upload-inline')?.click()}
        >
            <input
              id="file-upload-inline"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
    
            {file ? (
              <Box>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Icon name={file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'} style={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {formatFileSize(file.size)}
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Remove File
                </Button>
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Icon name="cloud_upload" style={{ fontSize: 48, color: '#94A3B8' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Drag and drop your document here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  or click to browse your files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: PDF, PNG, JPG, WebP (max 10MB)
                </Typography>
              </Box>
            )}
        </Box>
  
        
      </Box>

      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {STAGE_MESSAGES[stage]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {STAGE_PROGRESS[stage]}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={STAGE_PROGRESS[stage]} />
        </Box>
      )}

      {/* Info Alert */}
      {showInfo && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setShowInfo(false)}>
          Please select a document to analyze first
        </Alert>
      )}

      {/* Advanced Options - Refactored to IconButton + Menu pattern */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {/* IconButton trigger for advanced options menu */}
        <Tooltip title="Advanced Options">
          <IconButton
            onClick={handleOpenMenu}
            aria-label="advanced options"
            aria-controls={menuOpen ? 'advanced-options-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : undefined}
            sx={{
              bgcolor: menuOpen ? 'action.selected' : 'transparent',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Icon name="settings" />
          </IconButton>
        </Tooltip>

        {/* Display current settings next to the icon */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Icon name={modelPreference === 'flash' ? 'flash_on' : 'psychology'} style={{ fontSize: 14 }} />
            {modelPreference === 'flash' ? 'Flash' : 'Pro'}
          </Typography>
          <Typography variant="caption" color="text.secondary">•</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Icon name={analysisDepth === 'standard' ? 'speed' : 'search'} style={{ fontSize: 14 }} />
            {analysisDepth === 'standard' ? 'Standard' : 'Detailed'}
          </Typography>
        </Box>

        {/* Menu popover with advanced options */}
        <Menu
          id="advanced-options-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleCloseMenu}
          MenuListProps={{
            'aria-labelledby': 'advanced-options-button',
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 320,
                maxWidth: 400,
              }
            }
          }}
        >
          {/* Menu header */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Advanced Options
            </Typography>
          </Box>

          <MuiDivider />

          {/* AI Model Selection */}
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              AI Model
            </Typography>
            <ToggleButtonGroup
              value={modelPreference}
              exclusive
              onChange={(_, value) => value && setModelPreference(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="flash">
                <Tooltip title="Faster analysis, good for most documents">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon name="flash_on" style={{ fontSize: 18 }} />
                    <span>Fast (Flash)</span>
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="pro">
                <Tooltip title="More thorough analysis, better for complex legal documents">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon name="psychology" style={{ fontSize: 18 }} />
                    <span>Pro</span>
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <MuiDivider />

          {/* Analysis Depth Selection */}
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Analysis Depth
            </Typography>
            <ToggleButtonGroup
              value={analysisDepth}
              exclusive
              onChange={(_, value) => value && setAnalysisDepth(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="standard">
                <Tooltip title="Extract key information and provide recommendations">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon name="speed" style={{ fontSize: 18 }} />
                    <span>Standard</span>
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="detailed">
                <Tooltip title="In-depth legal analysis with risk assessment">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon name="search" style={{ fontSize: 18 }} />
                    <span>Detailed</span>
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <MuiDivider />

          {/* Close button in menu footer */}
          <MenuItem onClick={handleCloseMenu}>
            <ListItemIcon>
              <Icon name="check_circle" style={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Done" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Submit Button  */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {uploading ? (
          <>
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled
              startIcon={<Icon name="hourglass_empty" />}
            >
              Analyzing...
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleCancel}
              startIcon={<Icon name="close" />}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleUpload}
            startIcon={<Icon name="analytics" />}
          >
            Analyze Document
          </Button>
        )}
      </Box>

      {/* Disclaimer */}
      <LegalDisclaimer variant="compact" />

                <Typography variant="body2" sx={{ mb: 2, display: 'none' }}>
            Our document analysis feature, powered by Google Gemini AI, provides intelligent analysis of accessibility-related demand letters and legal notices. The system automatically extracts key information such as plaintiff details, attorney contact information, settlement amounts, and response deadlines. More importantly, it identifies specific web accessibility violations mentioned in the letter and provides actionable recommendations to resolve them. By understanding the exact accessibility issues cited, you can prioritize remediation efforts, allocate resources effectively, and develop a strategic response plan. This AI-assisted approach helps organizations transform compliance challenges into opportunities for creating a more accessible web experience for all users.
          </Typography>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          What happens next?
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Your document will be analyzed for key information
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            AI extracts dates, names, amounts, and violations
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Legal analysis with risk assessment and potential defenses
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Results are saved and can be shared with others
          </Typography>
        </Box>
      </Box>
    </>
  );
}
