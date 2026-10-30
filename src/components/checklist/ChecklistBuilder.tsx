import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import type { CustomChecklistItem } from '../../types';
import { dialogPaperSx } from './dialogPaperSx';
import Icon from '../ui/Icon';

interface ChecklistBuilderProps {
  open: boolean;
  onClose: () => void;
  checklistId?: string | null;
}

type ItemFormData = Omit<CustomChecklistItem, 'id' | 'checklist_id'>;

export default function ChecklistBuilder({ open, onClose, checklistId }: ChecklistBuilderProps) {
  const { createChecklist, updateChecklist, getChecklist } = useLocalStorageChecklists();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ItemFormData[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (checklistId) {
        const checklist = getChecklist(checklistId);
        if (checklist) {
          setTitle(checklist.checklist.title);
          setDescription(checklist.checklist.description || '');
          setItems(checklist.items);
        }
      } else {
        setTitle('');
        setDescription('');
        setItems([
          {
            title: '',
            description: '',
            priority: 'medium',
            completed: false,
            order_index: 0,
          },
        ]);
      }
      setError('');
    }
  }, [open, checklistId, getChecklist]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        title: '',
        description: '',
        priority: 'medium',
        completed: false,
        order_index: items.length,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof ItemFormData,
    value: ItemFormData[keyof ItemFormData]
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setItems(updatedItems);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Checklist title is required');
      return;
    }

    const validItems = items.filter((item) => item.title.trim());
    if (validItems.length === 0) {
      setError('At least one checklist item is required');
      return;
    }

    const itemsWithOrderIndex = validItems.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    try {
      if (checklistId) {
        const existingChecklist = getChecklist(checklistId);
        if (existingChecklist) {
          const updatedItems: CustomChecklistItem[] = itemsWithOrderIndex.map((item) => {
            const existingItem = existingChecklist.items.find(
              (ei) => ei.title === item.title && ei.order_index === item.order_index
            );
            return {
              ...item,
              id: existingItem?.id || crypto.randomUUID(),
              checklist_id: checklistId,
            };
          });
          updateChecklist(checklistId, { title, description }, updatedItems);
        }
      } else {
        createChecklist(title, description, itemsWithOrderIndex);
      }
      onClose();
    } catch (err) {
      setError('Failed to save checklist');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogTitle>
        {checklistId ? 'Edit Checklist' : 'Create New Checklist'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            label="Checklist Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Pre-Launch Accessibility Audit"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Optional description of this checklist"
          />

          <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="h3">Checklist Items</Typography>
              <Button
                startIcon={<Icon name="add" />}
                onClick={handleAddItem}
                size="small"
                sx={{ minHeight: 44 }}
              >
                Add Item
              </Button>
            </Box>

            <Box component="ol" sx={{ display: 'flex', flexDirection: 'column', listStyle: 'none', m: 0, p: 0 }}>
              {items.map((item, index) => (
                <Box
                  component="li"
                  key={index}
                  sx={{
                    py: 2.5,
                    '& + &': { borderTop: '1px solid', borderColor: 'divider' },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 28,
                        height: 28,
                        mt: 0.75,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        bgcolor: 'action.hover',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {index + 1}
                    </Box>
                    <TextField
                      label="Item Title"
                      value={item.title}
                      onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                      fullWidth
                      required
                      size="small"
                      placeholder="e.g., Test keyboard navigation"
                    />
                    <IconButton
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      aria-label={`Remove item ${index + 1}`}
                      sx={{ width: 44, height: 44, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                    >
                      <Icon name="delete" />
                    </IconButton>
                  </Box>

                  <TextField
                    label="Description"
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Optional details about this item"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={item.priority}
                        label="Priority"
                        onChange={(e) => handleItemChange(index, 'priority', e.target.value)}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Due Date"
                      type="date"
                      value={item.due_date || ''}
                      onChange={(e) => handleItemChange(index, 'due_date', e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 160 }}
                    />

                    <TextField
                      label="Assigned To"
                      value={item.assigned_to || ''}
                      onChange={(e) => handleItemChange(index, 'assigned_to', e.target.value)}
                      size="small"
                      placeholder="Name or team"
                      sx={{ flex: 1, minWidth: 150 }}
                    />
                  </Box>

                  <TextField
                    label="Notes"
                    value={item.notes || ''}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Additional notes or context"
                    sx={{ mt: 2 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}>
          {checklistId ? 'Save Changes' : 'Create Checklist'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
