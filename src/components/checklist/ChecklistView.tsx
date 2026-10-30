import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import ChecklistItemCard from './ChecklistItemCard';
import type { CustomChecklist, CustomChecklistItem } from '../../types';
import Icon from '../ui/Icon';
import { BezelCard } from '../ui/BezelCard/BezelCard';
import { EmptyState } from '../ui/EmptyState/EmptyState';
import { ScoreBar } from '../ui/ScoreBar/ScoreBar';
import { TonePill } from '../ui/TonePill/TonePill';

interface ChecklistViewProps {
  checklistId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function ChecklistView({ checklistId, onBack, onEdit }: ChecklistViewProps) {
  const { getChecklist, getChecklistStats } = useLocalStorageChecklists();
  const [checklist, setChecklist] = useState<CustomChecklist | null>(null);
  const [items, setItems] = useState<CustomChecklistItem[]>([]);

  const loadChecklist = useCallback(() => {
    const data = getChecklist(checklistId);
    if (data) {
      setChecklist(data.checklist);
      setItems(data.items.sort((a, b) => a.order_index - b.order_index));
    }
  }, [checklistId, getChecklist]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  if (!checklist) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">
          Checklist not found
        </Alert>
        <Button onClick={onBack} sx={{ mt: 2, minHeight: 44 }}>
          Back to Checklists
        </Button>
      </Box>
    );
  }

  const stats = getChecklistStats(checklistId);
  const highPriorityItems = items.filter((item) => item.priority === 'high' && !item.completed);
  const overdueItems = items.filter((item) => {
    if (!item.due_date || item.completed) return false;
    return new Date(item.due_date) < new Date();
  });

  return (
    <Box>
      <Button
        startIcon={<Icon name="arrow_back" />}
        onClick={onBack}
        sx={{ mb: 3, minHeight: 44 }}
      >
        Back to Checklists
      </Button>

      <BezelCard component="section" aria-labelledby="custom-checklist-title" sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ flex: '1 1 16rem', minWidth: 0 }}>
            <Typography id="custom-checklist-title" variant="h4" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
              {checklist.title}
            </Typography>
            {checklist.description && (
              <Typography variant="body1" color="text.secondary">
                {checklist.description}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<Icon name="edit" />}
            onClick={onEdit}
            sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}
          >
            Edit
          </Button>
        </Box>

        {(highPriorityItems.length > 0 || overdueItems.length > 0 || stats.completionPercentage === 100) && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {highPriorityItems.length > 0 && (
              <TonePill tone="error" dot>
                {highPriorityItems.length} High Priority
              </TonePill>
            )}
            {overdueItems.length > 0 && (
              <TonePill tone="warning" dot>
                {overdueItems.length} Overdue
              </TonePill>
            )}
            {stats.completionPercentage === 100 && (
              <TonePill tone="success" dot>
                Complete
              </TonePill>
            )}
          </Box>
        )}

        <ScoreBar label={`Progress · ${stats.completedCount} / ${stats.totalCount}`} value={stats.completionPercentage} tone="neutral" />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, fontVariantNumeric: 'tabular-nums' }}
        >
          Last updated: {new Date(checklist.updated_at).toLocaleString()}
        </Typography>
      </BezelCard>

      <BezelCard component="section" aria-label="Checklist items" padding="none" sx={{ overflow: 'hidden' }}>
        {items.length === 0 ? (
          <EmptyState
            compact
            icon="playlist_add_check"
            title="No items yet"
            description='Click "Edit" to add items to this checklist.'
          />
        ) : (
          <Box component="ul" sx={{ m: 0, p: 0 }}>
            {items.map((item) => (
              <ChecklistItemCard
                key={item.id}
                checklistItem={item}
                checklistId={checklistId}
                onUpdate={loadChecklist}
              />
            ))}
          </Box>
        )}
      </BezelCard>
    </Box>
  );
}
