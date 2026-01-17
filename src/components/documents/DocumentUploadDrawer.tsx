import { Drawer, Box, Typography, IconButton, Stack, Divider } from '@mui/material';
import Icon from '../ui/Icon';
import InlineDocumentUpload from './InlineDocumentUpload';
import InlineAnalysisResults from './InlineAnalysisResults';
import { DocumentAnalysis } from './DocumentUploadDialog';
import { useState } from 'react';

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
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500, md: 600 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="gavel" style={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" component="h2">
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
              color: 'text.secondary',
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
