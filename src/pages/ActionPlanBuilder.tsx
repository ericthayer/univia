import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import Icon from '../components/ui/Icon';

interface ActionPlan {
  id: string;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  estimated_effort?: string;
  assigned_to?: string;
  due_date?: string;
  wcag_criteria?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AuditViolation {
  id: string;
  title: string;
  severity: string;
  wcag_guideline: string;
}

export default function ActionPlanBuilder() {
  const { user } = useAuth();
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [violations, setViolations] = useState<AuditViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    estimated_effort: string;
    assigned_to: string;
    due_date: string;
    wcag_criteria: string[];
    notes: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'not_started',
    estimated_effort: '',
    assigned_to: '',
    due_date: '',
    wcag_criteria: [],
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [plansResponse, violationsResponse] = await Promise.all([
        supabase
          .from('action_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('violations')
          .select('id, title, severity, wcag_guideline')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setActionPlans(plansResponse.data || []);
      setViolations(violationsResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromViolation = (violation: AuditViolation) => {
    setFormData({
      title: violation.title,
      description: `Address accessibility violation: ${violation.title}`,
      priority: violation.severity === 'critical' ? 'critical' : violation.severity === 'serious' ? 'high' : 'medium',
      status: 'not_started',
      estimated_effort: '',
      assigned_to: '',
      due_date: '',
      wcag_criteria: [violation.wcag_guideline],
      notes: '',
    });
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = (plan: ActionPlan) => {
    setFormData({
      title: plan.title,
      description: plan.description || '',
      priority: plan.priority,
      status: plan.status,
      estimated_effort: plan.estimated_effort || '',
      assigned_to: plan.assigned_to || '',
      due_date: plan.due_date || '',
      wcag_criteria: plan.wcag_criteria || [],
      notes: plan.notes || '',
    });
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this action plan?')) return;

    try {
      await supabase.from('action_plans').delete().eq('id', id);
      setActionPlans(actionPlans.filter((plan) => plan.id !== id));
    } catch (error) {
      console.error('Error deleting action plan:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !formData.title.trim()) return;

    try {
      const planData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (editingPlan) {
        const { data } = await supabase
          .from('action_plans')
          .update(planData)
          .eq('id', editingPlan.id)
          .select()
          .single();

        if (data) {
          setActionPlans(
            actionPlans.map((plan) => (plan.id === editingPlan.id ? data : plan))
          );
        }
      } else {
        const { data } = await supabase
          .from('action_plans')
          .insert(planData)
          .select()
          .single();

        if (data) {
          setActionPlans([data, ...actionPlans]);
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving action plan:', error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'not_started',
      estimated_effort: '',
      assigned_to: '',
      due_date: '',
      wcag_criteria: [],
      notes: '',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getPriorityColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'estimated_effort',
      headerName: 'Effort',
      width: 100,
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 120,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Icon name="edit" />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={<Icon name="delete" />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

  const filteredPlans = actionPlans.filter((plan) => {
    if (currentTab === 0) return true;
    if (currentTab === 1) return plan.status === 'not_started';
    if (currentTab === 2) return plan.status === 'in_progress';
    if (currentTab === 3) return plan.status === 'completed';
    return true;
  });

  if (!user) {
    return (
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <Alert severity="info">
            Please sign in to create and manage action plans.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box>
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
              Action Plan Builder
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and track remediation plans for accessibility issues
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Icon name="add" />}
            onClick={() => setDialogOpen(true)}
          >
            New Action Plan
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {actionPlans.filter((p) => p.status === 'not_started').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Not Started
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {actionPlans.filter((p) => p.status === 'in_progress').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {actionPlans.filter((p) => p.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {actionPlans.filter((p) => p.status === 'blocked').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blocked
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {violations.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Create from Recent Violations
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {violations.slice(0, 5).map((violation) => (
                  <Box
                    key={violation.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {violation.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {violation.wcag_guideline}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCreateFromViolation(violation)}
                    >
                      Create Plan
                    </Button>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        <Card>
          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
            <Tab label={`All (${actionPlans.length})`} />
            <Tab label={`Not Started (${actionPlans.filter((p) => p.status === 'not_started').length})`} />
            <Tab label={`In Progress (${actionPlans.filter((p) => p.status === 'in_progress').length})`} />
            <Tab label={`Completed (${actionPlans.filter((p) => p.status === 'completed').length})`} />
          </Tabs>
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={filteredPlans}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          </Box>
        </Card>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPlan ? 'Edit Action Plan' : 'New Action Plan'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      label="Status"
                    >
                      <MenuItem value="not_started">Not Started</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Estimated Effort"
                    value={formData.estimated_effort}
                    onChange={(e) => setFormData({ ...formData, estimated_effort: e.target.value })}
                    placeholder="e.g., 4 hours, 2 days"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Due Date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <TextField
                label="Assigned To"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                fullWidth
              />
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={!formData.title.trim()}>
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
