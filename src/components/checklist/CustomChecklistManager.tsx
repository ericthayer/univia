import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  LinearProgress,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import ChecklistBuilder from './ChecklistBuilder';
import ChecklistView from './ChecklistView';
import Icon from '../ui/Icon';

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
        <LinearProgress />
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Your Custom Checklists
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {checklists.length === 0
                ? 'Create your first custom checklist to get started'
                : `${checklists.length} checklist${checklists.length === 1 ? '' : 's'} stored locally`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {checklists.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Icon name="delete_sweep" />}
                onClick={() => setResetDialogOpen(true)}
              >
                Reset All
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Icon name="add" />}
              onClick={handleCreateNew}
            >
              Create Checklist
            </Button>
          </Box>
        </Box>

        {checklists.length === 0 ? (
          <Box
            sx={{
              p: 8,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Icon name="playlist_add_check" style={{ fontSize: 64, opacity: 0.3 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              No Custom Checklists Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create custom checklists tailored to your specific compliance needs
            </Typography>
            <Button
              variant="contained"
              startIcon={<Icon name="add" />}
              onClick={handleCreateNew}
            >
              Create Your First Checklist
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {checklists.map((checklist) => {
              const stats = getChecklistStats(checklist.id);
              return (
                <Grid key={checklist.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                          {checklist.title}
                        </Typography>
                        <Chip
                          label={`${stats.completionPercentage}%`}
                          color={stats.completionPercentage === 100 ? 'success' : 'default'}
                          size="small"
                        />
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {stats.completedCount} / {stats.totalCount}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={stats.completionPercentage}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Updated {new Date(checklist.updated_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        startIcon={<Icon name="open_in_new" />}
                        onClick={() => setSelectedChecklistId(checklist.id)}
                      >
                        Open
                      </Button>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(checklist.id)}
                          aria-label="edit checklist"
                        >
                          <Icon name="edit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(checklist.id)}
                          aria-label="delete checklist"
                        >
                          <Icon name="delete" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Alert severity="info" sx={{ mt: 4 }}>
          <strong>Note:</strong> Custom checklists are stored locally in your browser. They will be cleared if you clear your browser data or click "Reset All".
        </Alert>
      </Box>

      <ChecklistBuilder
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingChecklistId(null);
        }}
        checklistId={editingChecklistId}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Checklist?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this checklist? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset All Custom Checklists?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all custom checklists and their data. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetAll} color="error" variant="contained">
            Reset All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
