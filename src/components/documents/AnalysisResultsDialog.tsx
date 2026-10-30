import { ReactNode, useId } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { DocumentAnalysis } from './DocumentUploadDialog';
import { urgencyIcon, urgencyTone } from './urgency';
import Icon from '../ui/Icon';
import LegalDisclaimer from '../ui/LegalDisclaimer';
import { ArrowButton } from '../ui/ArrowButton/ArrowButton';
import { TonePill } from '../ui/TonePill/TonePill';

interface AnalysisResultsDialogProps {
  open: boolean;
  onClose: () => void;
  analysis: DocumentAnalysis | null;
}

function DialogSection({ id, title, first = false, children }: { id: string; title: string; first?: boolean; children: ReactNode }) {
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={first ? undefined : { pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Typography id={id} variant="eyebrow" component="h3" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box component="dd" sx={{ m: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export default function AnalysisResultsDialog({
  open,
  onClose,
  analysis,
}: AnalysisResultsDialogProps) {
  const uid = useId();

  if (!analysis?.analysis) return null;

  const { analysis: result } = analysis;
  const data = result.extractedData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="span" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              Document Analysis Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <TonePill variant="solid">{result.documentType}</TonePill>
              <TonePill tone={urgencyTone(result.urgencyLevel)} dot>
                <Icon name={urgencyIcon(result.urgencyLevel)} style={{ fontSize: 14 }} aria-hidden />
                {result.urgencyLevel} urgency
              </TonePill>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Close results" sx={{ width: 44, height: 44, mr: -1, flexShrink: 0 }}>
            <Icon name="close" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <LegalDisclaimer variant="compact" sx={{ mb: 3 }} />

        <DialogSection id={`${uid}-summary`} title="Summary" first>
          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
            {result.documentSummary}
          </Typography>
        </DialogSection>

        <DialogSection id={`${uid}-key`} title="Key Information">
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {result.keyPoints.map((point, index) => (
              <Box
                component="li"
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                  py: 1.25,
                  '&:first-of-type': { pt: 0 },
                  '&:last-of-type': { pb: 0 },
                  '& + &': { borderTop: '1px solid', borderColor: 'divider' },
                }}
              >
                <Icon
                  name="check_circle"
                  aria-hidden
                  style={{ fontSize: 18, marginTop: 2, flexShrink: 0, color: 'var(--mui-palette-text-secondary)' }}
                />
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                  {point}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogSection>

        {data && Object.values(data).some((v) => v) && (
          <DialogSection id={`${uid}-details`} title="Extracted Details">
            <Box
              component="dl"
              sx={{ display: 'grid', gap: 2.5, m: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}
            >
              {data.plaintiffName && (
                <Detail label="Plaintiff">
                  <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {data.plaintiffName}
                  </Typography>
                </Detail>
              )}
              {data.attorneyName && (
                <Detail label="Attorney">
                  <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {data.attorneyName}
                  </Typography>
                </Detail>
              )}
              {data.attorneyFirm && (
                <Detail label="Law Firm">
                  <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {data.attorneyFirm}
                  </Typography>
                </Detail>
              )}
              {data.responseDeadline && (
                <Detail label="Response Deadline">
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main', fontVariantNumeric: 'tabular-nums' }}>
                    {data.responseDeadline}
                  </Typography>
                </Detail>
              )}
              {data.settlementAmount && (
                <Detail label="Settlement Amount">
                  <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    ${data.settlementAmount.toLocaleString()}
                  </Typography>
                </Detail>
              )}
              {data.violationsCited && data.violationsCited.length > 0 && (
                <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
                  <Typography component="dt" variant="caption" color="text.secondary">
                    Violations Cited
                  </Typography>
                  <Box component="dd" sx={{ m: 0, mt: 0.75, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {data.violationsCited.map((violation, index) => (
                      <Chip
                        key={index}
                        label={violation}
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{
                          borderRadius: 999,
                          maxWidth: '100%',
                          height: 'auto',
                          py: 0.5,
                          '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere' },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogSection>
        )}

        <DialogSection id={`${uid}-actions`} title="Recommended Actions">
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
            {result.recommendedActions.map((action, index) => (
              <Box component="li" key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="body2" sx={{ pt: 0.5, overflowWrap: 'anywhere' }}>
                  {action}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogSection>

        <DialogSection id={`${uid}-resources`} title="Additional Resources">
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {result.additionalResources.map((resource, index) => (
              <Box component="li" key={index} sx={{ maxWidth: '100%' }}>
                <Chip
                  label={resource}
                  variant="outlined"
                  size="small"
                  icon={<Icon name="link" style={{ fontSize: 14 }} />}
                  sx={{
                    borderRadius: 999,
                    maxWidth: '100%',
                    height: 'auto',
                    py: 0.5,
                    '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere' },
                  }}
                />
              </Box>
            ))}
          </Box>
        </DialogSection>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 999, minHeight: 48, px: 3 }}>
          Close
        </Button>
        <ArrowButton onClick={onClose}>View in Demand Letters</ArrowButton>
      </DialogActions>
    </Dialog>
  );
}
