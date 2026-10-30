import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import type { CustomChecklistItem } from '../../types';
import Icon from '../ui/Icon';
import { TonePill } from '../ui/TonePill/TonePill';
import type { Tone } from '../ui/tone';

interface ChecklistItemCardProps {
  checklistItem: CustomChecklistItem;
  checklistId: string;
  onUpdate: () => void;
}

const PRIORITY_TONE: Record<string, Tone> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
};

/**
 * One custom checklist item as a flush list row. Render inside a `<ul>` that
 * lives in a `BezelCard padding="none"`; rows separate with a hairline.
 */
export default function ChecklistItemCard({ checklistItem, checklistId, onUpdate }: ChecklistItemCardProps) {
  const { toggleItemComplete, updateItem } = useLocalStorageChecklists();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(checklistItem.notes || '');
  const detailsId = `checklist-item-${checklistItem.id}-details`;

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

  const isOverdue = checklistItem.due_date && !checklistItem.completed && new Date(checklistItem.due_date) < new Date();

  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        py: 2.5,
        pl: { xs: 1.5, sm: 2 },
        pr: { xs: 1.5, sm: 2 },
        bgcolor: checklistItem.completed ? 'action.hover' : 'transparent',
        transition: (theme) =>
          `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
        '& + &': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Checkbox
          checked={checklistItem.completed}
          onChange={handleToggle}
          slotProps={{ input: { 'aria-label': `Mark "${checklistItem.title}" as complete` } }}
          sx={{ p: 1.25, mt: -0.5 }}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="subtitle1"
              component="h3"
              sx={{
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
                textDecoration: checklistItem.completed ? 'line-through' : 'none',
                opacity: checklistItem.completed ? 0.6 : 1,
              }}
            >
              {checklistItem.title}
            </Typography>

            <TonePill tone={PRIORITY_TONE[checklistItem.priority] ?? 'neutral'}>{checklistItem.priority}</TonePill>

            {isOverdue && (
              <TonePill tone="error" dot>
                Overdue
              </TonePill>
            )}
          </Box>

          {checklistItem.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {checklistItem.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, columnGap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
            {checklistItem.due_date && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontVariantNumeric: 'tabular-nums' }}
              >
                <Icon name="event" style={{ fontSize: 14 }} aria-hidden />
                Due {new Date(checklistItem.due_date).toLocaleDateString()}
              </Typography>
            )}
            {checklistItem.assigned_to && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <Icon name="person" style={{ fontSize: 14 }} aria-hidden />
                {checklistItem.assigned_to}
              </Typography>
            )}
            {checklistItem.compliance_standards &&
              checklistItem.compliance_standards.length > 0 &&
              checklistItem.compliance_standards.map((standard) => (
                <TonePill key={standard} variant="outline">
                  {standard}
                </TonePill>
              ))}
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
                    placeholder="Add notes…"
                    size="small"
                    slotProps={{ htmlInput: { 'aria-label': `Notes for ${checklistItem.title}` } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      onClick={handleSaveNotes}
                      variant="contained"
                      sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}
                    >
                      Save
                    </Button>
                    <Button size="small" onClick={handleCancelEdit} sx={{ minHeight: 44 }}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label={`Edit notes for ${checklistItem.title}`}
                  sx={{
                    display: 'block',
                    width: '100%',
                    p: 1.5,
                    border: 0,
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: (theme) =>
                      `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <Typography variant="eyebrow" component="span" sx={{ display: 'block', mb: 0.5 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2">{checklistItem.notes || 'Click to add notes…'}</Typography>
                </Box>
              )}
            </Box>
          )}

          {!checklistItem.notes && !editing && (
            <Button
              size="small"
              startIcon={<Icon name="note_add" />}
              onClick={() => setEditing(true)}
              sx={{ mt: 1, minHeight: 44 }}
            >
              Add Notes
            </Button>
          )}
        </Box>

        <IconButton
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? `Collapse details for ${checklistItem.title}` : `Expand details for ${checklistItem.title}`}
          aria-expanded={expanded}
          aria-controls={detailsId}
          sx={{ width: 44, height: 44 }}
        >
          <Icon name={expanded ? 'expand_less' : 'expand_more'} />
        </IconButton>
      </Box>

      <Collapse in={expanded} id={detailsId}>
        <Box sx={{ pl: 7, pt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
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
