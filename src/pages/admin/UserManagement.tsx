import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Avatar,
  IconButton,
  Checkbox,
  Toolbar,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { LineChart, Line } from '@mui/x-charts';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  tier: string;
  status: string;
  last_login: string;
  audit_count: number;
  created_at: string;
  activity_trend: number[];
}

interface UserMetrics {
  new_users: number;
  new_users_change: number;
  active_users: number;
  active_users_change: number;
  churned_users: number;
  total_revenue: number;
  revenue_change: number;
}

export default function UserManagement() {
  const [view, setView] = useState<'card' | 'grid'>('card');
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    new_users: 0,
    new_users_change: 0,
    active_users: 0,
    active_users_change: 0,
    churned_users: 0,
    total_revenue: 0,
    revenue_change: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.is_admin) {
      loadUsers();
      loadMetrics();
    }
  }, [profile]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, statusFilter, tierFilter]);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    const usersWithTrend = (data || []).map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || 'Unknown',
      tier: user.tier || 'basic',
      status: user.status || 'active',
      last_login: user.last_login || user.created_at,
      audit_count: user.audit_count || 0,
      created_at: user.created_at,
      activity_trend: generateMockTrend(),
    }));

    setUsers(usersWithTrend);
  };

  const loadMetrics = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: newUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: activeUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: churnedUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'churned');

    setMetrics({
      new_users: newUsers || 0,
      new_users_change: 24,
      active_users: activeUsers || 0,
      active_users_change: 12,
      churned_users: churnedUsers || 0,
      total_revenue: 1287500,
      revenue_change: 3,
    });
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter((user) => user.tier === tierFilter);
    }

    setFilteredUsers(filtered);
  };

  const generateMockTrend = () => {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 100));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'churned':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'primary';
      case 'pro':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'USER',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {params.row.full_name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {params.row.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'tier',
      headerName: 'TIER',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getTierColor(params.value)}
          size="small"
          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'STATUS',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getStatusColor(params.value)}
          size="small"
          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
        />
      ),
    },
    {
      field: 'audit_count',
      headerName: 'AUDITS',
      width: 100,
      type: 'number',
    },
    {
      field: 'activity_trend',
      headerName: 'ACTIVITY',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: 40 }}>
          <svg width="120" height="40" viewBox="0 0 120 40">
            <polyline
              points={params.value
                .map((val: number, idx: number) => `${idx * 20},${40 - (val / 100) * 35}`)
                .join(' ')}
              fill="none"
              stroke={params.value[params.value.length - 1] > params.value[0] ? '#4caf50' : '#f44336'}
              strokeWidth="2"
            />
          </svg>
        </Box>
      ),
    },
    {
      field: 'last_login',
      headerName: 'LAST ACTIVE',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: () => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" aria-label="Edit user">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </IconButton>
          <IconButton size="small" aria-label="Delete user">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </IconButton>
        </Box>
      ),
    },
  ];

  if (!profile?.is_admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Access Denied</Typography>
        <Typography color="text.secondary">
          You do not have permission to view this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        User Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                New Users
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {metrics.new_users}
                </Typography>
                <Chip
                  label={`+${metrics.new_users_change}%`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 500, height: 24 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Users
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {metrics.active_users}
                </Typography>
                <Chip
                  label={`+${metrics.active_users_change}%`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 500, height: 24 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Churned Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {metrics.churned_users}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Revenue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  ${metrics.total_revenue.toLocaleString()}
                </Typography>
                <Chip
                  label={`+${metrics.revenue_change}%`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 500, height: 24 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, newView) => newView && setView(newView)}
              size="small"
            >
              <ToggleButton value="card" aria-label="Card view">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                  <line x1="3" x2="3.01" y1="6" y2="6" />
                  <line x1="3" x2="3.01" y1="12" y2="12" />
                  <line x1="3" x2="3.01" y1="18" y2="18" />
                </svg>
                <Typography sx={{ ml: 1, fontSize: '0.875rem' }}>List</Typography>
              </ToggleButton>
              <ToggleButton value="grid" aria-label="Grid view">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                <Typography sx={{ ml: 1, fontSize: '0.875rem' }}>Board</Typography>
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="churned">Churned</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={tierFilter}
                  label="Tier"
                  onChange={(e) => setTierFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>

              <TextField
                placeholder="Search users..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
            </Box>
          </Box>

          {view === 'grid' ? (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredUsers}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={setSelectedRows}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'action.hover',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  },
                }}
              />
              {selectedRows.length > 0 && (
                <Toolbar
                  sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    boxShadow: 3,
                    minWidth: 400,
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedRows.length} selected users
                  </Typography>
                  <Button size="small" variant="outlined">
                    Engage
                  </Button>
                  <Button size="small" variant="outlined">
                    Export
                  </Button>
                  <Button size="small" variant="outlined" color="error">
                    Delete
                  </Button>
                </Toolbar>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredUsers.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48 }}>
                          {user.full_name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {user.full_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={user.tier.toUpperCase()}
                          color={getTierColor(user.tier)}
                          size="small"
                        />
                        <Chip
                          label={user.status.toUpperCase()}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Audits
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.audit_count}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Last Active
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(user.last_login).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
