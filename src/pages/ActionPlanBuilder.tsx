import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { dialogPaperSx } from '../components/checklist/dialogPaperSx';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import Icon from '../components/ui/Icon';
import { MetricTile } from '../components/ui/MetricTile/MetricTile';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { TonePill } from '../components/ui/TonePill/TonePill';
import type { Tone } from '../components/ui/tone';

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

const eyebrowHeaderSx = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
} as const;

const SEVERITY_TONE: Record<string, Tone> = {
  critical: 'error',
  serious: 'warning',
  moderate: 'neutral',
};

/** Priority by tone: critical and high carry color, medium is neutral, low is quiet. */
function PriorityPill({ priority }: { priority: string }) {
  if (priority === 'critical') return <TonePill tone="error" dot>{priority}</TonePill>;
  if (priority === 'high') return <TonePill tone="warning" dot>{priority}</TonePill>;
  if (priority === 'medium') return <TonePill>{priority}</TonePill>;
  return <TonePill variant="outline">{priority}</TonePill>;
}

/** Status keeps the palette monochrome except for the two states that need attention. */
function PlanStatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  if (status === 'completed') return <TonePill tone="success" dot>{label}</TonePill>;
  if (status === 'blocked') return <TonePill tone="error" dot>{label}</TonePill>;
  if (status === 'in_progress') return <TonePill dot>{label}</TonePill>;
  return <TonePill variant="outline">{label}</TonePill>;
}

const pillButtonSx = { borderRadius: 999, minHeight: 44, px: 2.5, flexShrink: 0 } as const;

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

  const loadData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

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

  const cellCenter = { display: 'flex', alignItems: 'center', height: '100%' } as const;

  const columns: GridColDef<ActionPlan>[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 130,
      renderCell: (params) => (
        <Box sx={cellCenter}>
          <PriorityPill priority={String(params.value)} />
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Box sx={cellCenter}>
          <PlanStatusPill status={String(params.value)} />
        </Box>
      ),
    },
    {
      field: 'estimated_effort',
      headerName: 'Effort',
      width: 110,
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 130,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString() : ''),
      cellClassName: 'ActionPlans-tabular',
    },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ ...cellCenter, gap: 0.5 }}>
          <IconButton
            aria-label={`Edit ${params.row.title}`}
            onClick={() => handleEdit(params.row)}
            sx={{ width: 44, height: 44, color: 'text.secondary' }}
          >
            <Icon name="edit" style={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            aria-label={`Delete ${params.row.title}`}
            onClick={() => handleDelete(params.row.id)}
            sx={{ width: 44, height: 44, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
          >
            <Icon name="delete" style={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filteredPlans = actionPlans.filter((plan) => {
    if (currentTab === 0) return true;
    if (currentTab === 1) return plan.status === 'not_started';
    if (currentTab === 2) return plan.status === 'in_progress';
    if (currentTab === 3) return plan.status === 'completed';
    return true;
  });

  const countByStatus = (status: ActionPlan['status']) => actionPlans.filter((p) => p.status === status).length;
  const notStarted = countByStatus('not_started');
  const inProgress = countByStatus('in_progress');
  const completed = countByStatus('completed');
  const blocked = countByStatus('blocked');

  if (!user) {
    return (
      <PageCanvas>
        <EmptyState
          icon="person"
          title="Sign in to continue"
          description="Please sign in to create and manage action plans."
          action={
            <ArrowButton component={RouterLink} to="/signin">
              Sign in
            </ArrowButton>
          }
        />
      </PageCanvas>
    );
  }

  const emptyCopy = actionPlans.length === 0
    ? { title: 'No action plans yet', description: 'Create a plan from a recent violation, or start one from scratch.' }
    : { title: 'No plans in this view', description: 'Switch tabs to see plans with a different status.' };

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Remediation"
        title="Action Plan Builder"
        description="Create and track remediation plans for accessibility issues"
        actions={<ArrowButton onClick={() => setDialogOpen(true)}>New Action Plan</ArrowButton>}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
          gap: 3,
          mb: { xs: 4, md: 6 },
        }}
      >
        <MetricTile label="Not Started" value={notStarted} icon={<Icon name="schedule" />} loading={loading} reveal={0} />
        <MetricTile label="In Progress" value={inProgress} icon={<Icon name="hourglass_empty" />} loading={loading} reveal={1} />
        <MetricTile
          label="Completed"
          value={completed}
          tone={completed > 0 ? 'success' : 'neutral'}
          icon={<Icon name="check_circle" />}
          loading={loading}
          reveal={2}
        />
        <MetricTile
          label="Blocked"
          value={blocked}
          tone={blocked > 0 ? 'error' : 'neutral'}
          icon={<Icon name="error" />}
          loading={loading}
          reveal={3}
        />
      </Box>

      {violations.length > 0 && (
        <BezelCard
          component="section"
          aria-labelledby="violations-title"
          padding="none"
          reveal={4}
          sx={{ mb: { xs: 4, md: 6 }, overflow: 'hidden' }}
        >
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: 2 }}>
            <SectionHeader id="violations-title" title="Create from Recent Violations" dense />
          </Box>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
            {violations.slice(0, 5).map((violation) => (
              <Box
                component="li"
                key={violation.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  '& + &': { borderTop: '1px solid', borderColor: 'divider' },
                }}
              >
                <Box sx={{ flex: '1 1 16rem', minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {violation.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <TonePill tone={SEVERITY_TONE[violation.severity] ?? 'neutral'} variant={SEVERITY_TONE[violation.severity] ? 'tonal' : 'outline'}>
                      {violation.severity}
                    </TonePill>
                    <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {violation.wcag_guideline}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Icon name="add" />}
                  onClick={() => handleCreateFromViolation(violation)}
                  aria-label={`Create plan from ${violation.title}`}
                  sx={pillButtonSx}
                >
                  Create Plan
                </Button>
              </Box>
            ))}
          </Box>
        </BezelCard>
      )}

      <BezelCard component="section" aria-label="Action plans" padding="none" reveal={5} sx={{ overflow: 'hidden' }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Filter action plans by status"
          sx={{ px: { xs: 1, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label={`All (${actionPlans.length})`} />
          <Tab label={`Not Started (${notStarted})`} />
          <Tab label={`In Progress (${inProgress})`} />
          <Tab label={`Completed (${completed})`} />
        </Tabs>

        {!loading && filteredPlans.length === 0 ? (
          <EmptyState
            compact
            icon="assignment"
            title={emptyCopy.title}
            description={emptyCopy.description}
            action={
              actionPlans.length === 0 ? (
                <Button variant="outlined" startIcon={<Icon name="add" />} onClick={() => setDialogOpen(true)} sx={pillButtonSx}>
                  New Action Plan
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataGrid
            rows={filteredPlans}
            columns={columns}
            loading={loading}
            autoHeight
            rowHeight={64}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{
              '--DataGrid-containerBackground': 'var(--mui-palette-action-hover)',
              border: 0,
              borderRadius: 0,
              '& .MuiDataGrid-columnHeaders': { borderBottom: '1px solid', borderColor: 'divider' },
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
              '& .MuiDataGrid-columnHeaderTitle': eyebrowHeaderSx,
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', borderColor: 'divider' },
              '& .MuiDataGrid-row': {
                transition: (theme: Theme) =>
                  `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
              },
              '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
              '& .ActionPlans-tabular': { fontVariantNumeric: 'tabular-nums' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
            }}
          />
        )}
      </BezelCard>

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          slotProps={{ paper: { sx: dialogPaperSx } }}
        >
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
                    <InputLabel id="plan-priority-label">Priority</InputLabel>
                    <Select
                      labelId="plan-priority-label"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as ActionPlan['priority'] })}
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
                    <InputLabel id="plan-status-label">Status</InputLabel>
                    <Select
                      labelId="plan-status-label"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ActionPlan['status'] })}
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
                    slotProps={{ inputLabel: { shrink: true } }}
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
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseDialog} sx={{ minHeight: 44 }}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={!formData.title.trim()} sx={pillButtonSx}>
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
    </PageCanvas>
  );
}
