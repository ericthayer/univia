import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { DocumentAnalysis } from './DocumentUploadDialog';
import Icon from '../ui/Icon';
import LegalDisclaimer from '../ui/LegalDisclaimer';

interface AnalysisResultsDialogProps {
  open: boolean;
  onClose: () => void;
  analysis: DocumentAnalysis | null;
}

export default function AnalysisResultsDialog({
  open,
  onClose,
  analysis,
}: AnalysisResultsDialogProps) {
  if (!analysis?.analysis) return null;

  const { analysis: result } = analysis;

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'check_circle';
      default:
        return 'help';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
              Document Analysis Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={result.documentType}
                color="primary"
                size="small"
              />
              <Chip
                icon={<Icon name={getUrgencyIcon(result.urgencyLevel)} style={{ fontSize: 16 }} />}
                label={`${result.urgencyLevel.toUpperCase()} URGENCY`}
                color={getUrgencyColor(result.urgencyLevel) as 'error' | 'warning' | 'info' | 'success' | 'default'}
                size="small"
              />
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Icon name="close" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <LegalDisclaimer variant="compact" sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Summary
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
            {result.documentSummary}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Key Information
          </Typography>
          <Grid container spacing={2}>
            {result.keyPoints.map((point, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Icon name="check_circle" style={{ color: '#2563EB', fontSize: 20 }} />
                    <Typography variant="body2">{point}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {result.extractedData && Object.values(result.extractedData).some(v => v) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Extracted Details
              </Typography>
              <Grid container spacing={2}>
                {result.extractedData.plaintiffName && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">Plaintiff</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {result.extractedData.plaintiffName}
                    </Typography>
                  </Grid>
                )}
                {result.extractedData.attorneyName && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">Attorney</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {result.extractedData.attorneyName}
                    </Typography>
                  </Grid>
                )}
                {result.extractedData.attorneyFirm && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">Law Firm</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {result.extractedData.attorneyFirm}
                    </Typography>
                  </Grid>
                )}
                {result.extractedData.responseDeadline && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">Response Deadline</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
                      {result.extractedData.responseDeadline}
                    </Typography>
                  </Grid>
                )}
                {result.extractedData.settlementAmount && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">Settlement Amount</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      ${result.extractedData.settlementAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {result.extractedData.violationsCited && result.extractedData.violationsCited.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Violations Cited</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      {result.extractedData.violationsCited.map((violation, index) => (
                        <Chip key={index} label={violation} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Recommended Actions
          </Typography>
          <List disablePadding>
            {result.recommendedActions.map((action, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Additional Resources
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {result.additionalResources.map((resource, index) => (
              <Chip
                key={index}
                label={resource}
                variant="outlined"
                icon={<Icon name="link" style={{ fontSize: 16 }} />}
                onClick={() => {}}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<Icon name="gavel" />}
          onClick={onClose}
        >
          View in Demand Letters
        </Button>
      </DialogActions>
    </Dialog>
  );
}
