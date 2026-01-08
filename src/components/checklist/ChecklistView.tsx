import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import ChecklistItemCard from './ChecklistItemCard';
import type { CustomChecklist, CustomChecklistItem } from '../../types';
import Icon from '../ui/Icon';

interface ChecklistViewProps {
  checklistId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function ChecklistView({ checklistId, onBack, onEdit }: ChecklistViewProps) {
  const { getChecklist, getChecklistStats } = useLocalStorageChecklists();
  const [checklist, setChecklist] = useState<CustomChecklist | null>(null);
  const [items, setItems] = useState<CustomChecklistItem[]>([]);

  useEffect(() => {
    loadChecklist();
  }, [checklistId]);

  const loadChecklist = () => {
    const data = getChecklist(checklistId);
    if (data) {
      setChecklist(data.checklist);
      setItems(data.items.sort((a, b) => a.order_index - b.order_index));
    }
  };

  if (!checklist) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">
          Checklist not found
        </Alert>
        <Button onClick={onBack} sx={{ mt: 2 }}>
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
        sx={{ mb: 3 }}
      >
        Back to Checklists
      </Button>

      <Box
        sx={{
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
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
          >
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          {highPriorityItems.length > 0 && (
            <Chip
              icon={<Icon name="priority_high" style={{ fontSize: 16 }} />}
              label={`${highPriorityItems.length} High Priority`}
              color="error"
              size="small"
            />
          )}
          {overdueItems.length > 0 && (
            <Chip
              icon={<Icon name="schedule" style={{ fontSize: 16 }} />}
              label={`${overdueItems.length} Overdue`}
              color="warning"
              size="small"
            />
          )}
          {stats.completionPercentage === 100 && (
            <Chip
              icon={<Icon name="check_circle" style={{ fontSize: 16 }} />}
              label="Complete"
              color="success"
              size="small"
            />
          )}
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {stats.completedCount} / {stats.totalCount} ({stats.completionPercentage}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.completionPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Last updated: {new Date(checklist.updated_at).toLocaleString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.length === 0 ? (
          <Alert severity="info">
            No items in this checklist. Click "Edit" to add items.
          </Alert>
        ) : (
          items.map((item) => (
            <ChecklistItemCard
              key={item.id}
              item={item}
              checklistId={checklistId}
              onUpdate={loadChecklist}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
