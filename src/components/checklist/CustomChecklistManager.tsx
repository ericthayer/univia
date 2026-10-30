import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import ChecklistBuilder from './ChecklistBuilder';
import ChecklistView from './ChecklistView';
import { dialogPaperSx } from './dialogPaperSx';
import Icon from '../ui/Icon';
import { ArrowButton } from '../ui/ArrowButton/ArrowButton';
import { BezelCard } from '../ui/BezelCard/BezelCard';
import { EmptyState } from '../ui/EmptyState/EmptyState';
import { ScoreBar } from '../ui/ScoreBar/ScoreBar';
import { SectionHeader } from '../ui/SectionHeader/SectionHeader';
import { TonePill } from '../ui/TonePill/TonePill';

export default function CustomChecklistManager() {
  const {
    checklists,
    loading,
    deleteChecklist,
    getChecklistStats,
    resetAllData,
  } = useLocalStorageChecklists();

  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleCreateNew = () => {
    setEditingChecklistId(null);
    setBuilderOpen(true);
  };

  const handleEdit = (checklistId: string) => {
    setEditingChecklistId(checklistId);
    setBuilderOpen(true);
  };

  const handleDelete = (checklistId: string) => {
    setChecklistToDelete(checklistId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (checklistToDelete) {
      deleteChecklist(checklistToDelete);
      if (selectedChecklistId === checklistToDelete) {
        setSelectedChecklistId(null);
      }
      setChecklistToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleResetAll = () => {
    resetAllData();
    setSelectedChecklistId(null);
    setResetDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress aria-label="Loading checklists" />
      </Box>
    );
  }

  if (selectedChecklistId) {
    return (
      <ChecklistView
        checklistId={selectedChecklistId}
        onBack={() => setSelectedChecklistId(null)}
        onEdit={() => handleEdit(selectedChecklistId)}
      />
    );
  }

  return (
    <>
      <Box>
        <SectionHeader
          title="Your Custom Checklists"
          meta={
            checklists.length === 0
              ? 'Create your first custom checklist to get started'
              : `${checklists.length} checklist${checklists.length === 1 ? '' : 's'} stored locally`
          }
          action={
            <>
              {checklists.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Icon name="delete_sweep" />}
                  onClick={() => setResetDialogOpen(true)}
                  sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}
                >
                  Reset All
                </Button>
              )}
              <ArrowButton startIcon={<Icon name="add" />} onClick={handleCreateNew}>
                Create Checklist
              </ArrowButton>
            </>
          }
        />

        {checklists.length === 0 ? (
          <BezelCard>
            <EmptyState
              icon="playlist_add_check"
              title="No Custom Checklists Yet"
              description="Create custom checklists tailored to your specific compliance needs"
              action={
                <ArrowButton startIcon={<Icon name="add" />} onClick={handleCreateNew}>
                  Create Your First Checklist
                </ArrowButton>
              }
            />
          </BezelCard>
        ) : (
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
              gap: 3,
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {checklists.map((checklist, index) => {
              const stats = getChecklistStats(checklist.id);
              return (
                <Box component="li" key={checklist.id} sx={{ minWidth: 0 }}>
                  <BezelCard
                    component="article"
                    aria-label={checklist.title}
                    interactive
                    reveal={index}
                    sx={{ height: '100%' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
                        {checklist.title}
                      </Typography>
                      <TonePill tone={stats.completionPercentage === 100 ? 'success' : 'neutral'}>
                        {stats.completionPercentage}%
                      </TonePill>
                    </Box>

                    {checklist.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {checklist.description}
                      </Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <ScoreBar
                        size="sm"
                        label={`Progress · ${stats.completedCount} / ${stats.totalCount}`}
                        value={stats.completionPercentage}
                        tone="neutral"
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontVariantNumeric: 'tabular-nums', mb: 1 }}
                    >
                      Updated {new Date(checklist.updated_at).toLocaleDateString()}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<Icon name="open_in_new" />}
                        onClick={() => setSelectedChecklistId(checklist.id)}
                        sx={{ minHeight: 44 }}
                      >
                        Open
                      </Button>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton
                          onClick={() => handleEdit(checklist.id)}
                          aria-label={`Edit ${checklist.title}`}
                          sx={{ width: 44, height: 44, color: 'text.secondary' }}
                        >
                          <Icon name="edit" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(checklist.id)}
                          aria-label={`Delete ${checklist.title}`}
                          sx={{ width: 44, height: 44, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        >
                          <Icon name="delete" />
                        </IconButton>
                      </Box>
                    </Box>
                  </BezelCard>
                </Box>
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            mt: 4,
            color: 'text.secondary',
          }}
        >
          <Icon name="info" style={{ fontSize: 16, marginTop: 3, flexShrink: 0 }} aria-hidden />
          <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
            Custom checklists are stored locally in your browser. They will be cleared if you clear your browser data or click "Reset All".
          </Typography>
        </Box>
      </Box>

      <ChecklistBuilder
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingChecklistId(null);
        }}
        checklistId={editingChecklistId}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle>Delete Checklist?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this checklist? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle>Reset All Custom Checklists?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all custom checklists and their data. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setResetDialogOpen(false)} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            onClick={handleResetAll}
            color="error"
            variant="contained"
            sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}
          >
            Reset All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
