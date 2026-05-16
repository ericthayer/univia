import { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Chip,
  IconButton,
  Collapse,
  TextField,
  Button,
} from '@mui/material';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import type { CustomChecklistItem } from '../../types';
import Icon from '../ui/Icon';

interface ChecklistItemCardProps {
  checklistItem: CustomChecklistItem;
  checklistId: string;
  onUpdate: () => void;
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export default function ChecklistItemCard({ checklistItem, checklistId, onUpdate }: ChecklistItemCardProps) {
  const { toggleItemComplete, updateItem } = useLocalStorageChecklists();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(checklistItem.notes || '');

  const handleToggle = () => {
    toggleItemComplete(checklistId, checklistItem.id);
    onUpdate();
  };

  const handleSaveNotes = () => {
    updateItem(checklistId, checklistItem.id, { notes: editedNotes });
    setEditing(false);
    onUpdate();
  };

  const handleCancelEdit = () => {
    setEditedNotes(checklistItem.notes || '');
    setEditing(false);
  };

  const getPriorityColor = (priority: string): ChipColor => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const isOverdue = checklistItem.due_date && !checklistItem.completed && new Date(checklistItem.due_date) < new Date();

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: checklistItem.completed ? 'success.50' : 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: checklistItem.completed ? 'success.main' : isOverdue ? 'error.main' : 'divider',
        transition: 'all 0.2s ease',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Checkbox
          checked={checklistItem.completed}
          onChange={handleToggle}
          sx={{ mt: -0.5 }}
        />

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                flex: 1,
                textDecoration: checklistItem.completed ? 'line-through' : 'none',
                opacity: checklistItem.completed ? 0.6 : 1,
              }}
            >
              {checklistItem.title}
            </Typography>

            <Chip
              label={checklistItem.priority}
              color={getPriorityColor(checklistItem.priority)}
              size="small"
            />

            {isOverdue && (
              <Chip
                icon={<Icon name="schedule" style={{ fontSize: 14 }} />}
                label="Overdue"
                color="error"
                size="small"
              />
            )}
          </Box>

          {checklistItem.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {checklistItem.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {checklistItem.due_date && (
              <Chip
                icon={<Icon name="event" style={{ fontSize: 14 }} />}
                label={`Due: ${new Date(checklistItem.due_date).toLocaleDateString()}`}
                size="small"
                variant="outlined"
              />
            )}
            {checklistItem.assigned_to && (
              <Chip
                icon={<Icon name="person" style={{ fontSize: 14 }} />}
                label={checklistItem.assigned_to}
                size="small"
                variant="outlined"
              />
            )}
            {checklistItem.compliance_standards && checklistItem.compliance_standards.length > 0 && (
              checklistItem.compliance_standards.map((standard) => (
                <Chip
                  key={standard}
                  label={standard}
                  size="small"
                  variant="outlined"
                />
              ))
            )}
          </Box>

          {(checklistItem.notes || editing) && (
            <Box sx={{ mt: 2 }}>
              {editing ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes..."
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" onClick={handleSaveNotes} variant="contained">
                      Save
                    </Button>
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditing(true)}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {checklistItem.notes || 'Click to add notes...'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {!checklistItem.notes && !editing && (
            <Button
              size="small"
              startIcon={<Icon name="note_add" />}
              onClick={() => setEditing(true)}
              sx={{ mt: 1 }}
            >
              Add Notes
            </Button>
          )}
        </Box>

        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'collapse' : 'expand'}
        >
          <Icon name={expanded ? 'expand_less' : 'expand_more'} />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ pl: 7, pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Order:</strong> #{checklistItem.order_index + 1}
          </Typography>
          {checklistItem.compliance_standards && checklistItem.compliance_standards.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              <strong>Standards:</strong> {checklistItem.compliance_standards.join(', ')}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
