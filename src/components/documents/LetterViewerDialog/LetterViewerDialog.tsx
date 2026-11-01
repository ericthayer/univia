import { useEffect, useId, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { DemandLetter } from '../../../types';
import { getLetterFileKind, getLetterFileUrl } from '../../../services/letterFiles.service';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import Icon from '../../ui/Icon';
import { controlRadius } from '../../../theme/tokens';

export interface LetterViewerDialogProps {
  /** The letter to show; null keeps the dialog closed. */
  letter: DemandLetter | null;
  onClose: () => void;
}

type ViewerState =
  | { status: 'missing' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error' };

/**
 * Reopens the original uploaded demand letter (PDF or image) from private
 * storage through a short-lived signed URL. Letters analyzed before uploads
 * were kept have no stored file and get an explanatory empty state.
 */
export function LetterViewerDialog({ letter, onClose }: LetterViewerDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const path = letter?.file_storage_path || null;
  const [state, setState] = useState<ViewerState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!letter) return;
    if (!path) {
      setState({ status: 'missing' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    getLetterFileUrl(path)
      .then((url) => {
        if (!cancelled) setState({ status: 'ready', url });
      })
      .catch((error: unknown) => {
        console.error('[LetterViewer] Unable to sign document URL', error);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [letter, path, attempt]);

  const kind = path ? getLetterFileKind(path) : 'other';
  const fileName = letter?.file_name ?? 'Document';

  return (
    <Dialog
      open={Boolean(letter)}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullScreen ? 0 : `${theme.surfaces?.shellRadius ?? 20}px`,
            border: fullScreen ? 'none' : '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            backgroundImage: 'none',
            // Only stored files need the tall frame; the empty states size to content.
            height: fullScreen ? '100%' : path ? 'min(90dvh, 1100px)' : 'auto',
          },
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="eyebrow" component="p" sx={{ display: 'block', mb: 0.5 }}>
              Original document
            </Typography>
            <Typography
              id={titleId}
              variant="h6"
              component="h2"
              sx={{ fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}
            >
              {fileName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close document" sx={{ width: 44, height: 44, mr: -1, flexShrink: 0 }}>
            <Icon name="close" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ borderColor: 'divider', p: 0, display: 'flex', flexDirection: 'column', bgcolor: 'action.hover' }}
      >
        {state.status === 'loading' && (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 240 }} role="status">
            <CircularProgress size={32} aria-label="Loading document" />
          </Box>
        )}

        {state.status === 'missing' && (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 3 }}>
            <EmptyState
              icon="description"
              title="Original file not available"
              description="This letter was analyzed before Univia kept uploaded files. Letters you upload from now on can be reopened here."
              compact
            />
          </Box>
        )}

        {state.status === 'error' && (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 3 }}>
            <EmptyState
              icon="error_outline"
              title="Couldn’t open this document"
              description="The file could not be loaded. Check your connection and try again."
              compact
              action={
                <Button variant="outlined" onClick={() => setAttempt((n) => n + 1)} sx={{ borderRadius: controlRadius }}>
                  Try again
                </Button>
              }
            />
          </Box>
        )}

        {state.status === 'ready' && kind === 'pdf' && (
          <Box
            component="iframe"
            src={state.url}
            title={`${fileName} (PDF)`}
            sx={{ flex: 1, width: '100%', minHeight: 480, border: 0, bgcolor: 'background.paper' }}
          />
        )}

        {state.status === 'ready' && kind === 'image' && (
          <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              src={state.url}
              alt={`Uploaded demand letter: ${fileName}`}
              sx={{ maxWidth: '100%', height: 'auto', alignSelf: 'flex-start', borderRadius: 1, bgcolor: 'background.paper' }}
            />
          </Box>
        )}

        {state.status === 'ready' && kind === 'other' && (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 3 }}>
            <EmptyState
              icon="description"
              title="Preview not available"
              description="This file type can’t be previewed here. Open it in a new tab instead."
              compact
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: controlRadius, minHeight: 48, px: 3 }}>
          Close
        </Button>
        {state.status === 'ready' && (
          <Button
            variant="outlined"
            component="a"
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<Icon name="open_in_new" />}
            sx={{ borderRadius: controlRadius, minHeight: 48, px: 3 }}
          >
            Open in new tab
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default LetterViewerDialog;
