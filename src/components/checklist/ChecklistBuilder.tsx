import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
} from '@mui/material';
import { useLocalStorageChecklists } from '../../hooks/useLocalStorageChecklists';
import type { CustomChecklistItem } from '../../types';
import Icon from '../ui/Icon';

interface ChecklistBuilderProps {
  open: boolean;
  onClose: () => void;
  checklistId?: string | null;
}

interface ItemFormData extends Omit<CustomChecklistItem, 'id' | 'checklist_id'> {}

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

  const handleItemChange = (index: number, field: keyof ItemFormData, value: any) => {
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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

          <Divider />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Checklist Items</Typography>
              <Button
                startIcon={<Icon name="add" />}
                onClick={handleAddItem}
                size="small"
              >
                Add Item
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 600,
                        minWidth: 24,
                        textAlign: 'center',
                      }}
                    >
                      {index + 1}
                    </Typography>
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
                      size="small"
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      aria-label="remove item"
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
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {checklistId ? 'Save Changes' : 'Create Checklist'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
