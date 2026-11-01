import { useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Icon from '../ui/Icon';
import InlineDocumentUpload from './InlineDocumentUpload';
import InlineAnalysisResults from './InlineAnalysisResults';
import { DocumentAnalysis } from './DocumentUploadDialog';

interface DocumentUploadDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function DocumentUploadDrawer({ open, onClose }: DocumentUploadDrawerProps) {
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(null);

  const handleUploadComplete = (analysis: DocumentAnalysis) => {
    setAnalysisResult(analysis);
  };

  const handleNewUpload = () => {
    setAnalysisResult(null);
  };

  const handleClose = () => {
    setAnalysisResult(null);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.3)',
          },
        },
      }}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 2,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500, md: 600 },
          maxWidth: '100vw',
          // Flat panel: hairline edge instead of the default elevation shadow.
          boxShadow: 'none',
          backgroundImage: 'none',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                color: 'text.primary',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontSize: '1.25rem',
              }}
            >
              <Icon name="gavel" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" component="h2" sx={{ letterSpacing: '-0.01em' }}>
                Analyze Demand Letter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload and analyze ADA violation letters
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            aria-label="Close drawer"
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              color: 'text.secondary',
              transition: (theme) =>
                `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Icon name="close" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
          }}
        >
          {!analysisResult ? (
            <InlineDocumentUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <InlineAnalysisResults
              analysis={analysisResult}
              onNewUpload={handleNewUpload}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
