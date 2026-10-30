import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Skeleton from '@mui/material/Skeleton';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import { PageCanvas } from '../../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { BezelCard } from '../../components/ui/BezelCard/BezelCard';
import { MetricTile } from '../../components/ui/MetricTile/MetricTile';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { UserCard, ChipTone, UserCardUser } from '../../components/admin/UserCard/UserCard';

type UserData = UserCardUser & { created_at: string };

interface UserMetrics {
  new_users: number;
  active_users: number;
  churned_users: number;
}

type DirectoryView = 'cards' | 'table';

const DEFAULT_VIEW: DirectoryView = 'cards';
const DEFAULT_FILTER = 'all';
const DIRECTORY_TITLE_ID = 'user-directory-title';

const eyebrowHeaderSx = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
} as const;

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    new_users: 0,
    active_users: 0,
    churned_users: 0,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const isAdmin = Boolean(profile?.is_admin);

  // URL-backed UI state (SPEC §4.5): defaults are omitted from the query string.
  const viewParam = searchParams.get('view');
  const view: DirectoryView = viewParam === 'table' ? 'table' : DEFAULT_VIEW;
  const statusFilter = searchParams.get('status') ?? DEFAULT_FILTER;
  const tierFilter = searchParams.get('tier') ?? DEFAULT_FILTER;
  const searchQuery = searchParams.get('q') ?? '';

  const updateParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value === defaultValue) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('status');
        next.delete('tier');
        next.delete('q');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(
      (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'Unknown',
        tier: user.tier || 'basic',
        status: user.status || 'active',
        last_login: user.last_login || user.created_at,
        audit_count: user.audit_count || 0,
        created_at: user.created_at,
      }))
    );
  }, []);

  const loadMetrics = useCallback(async () => {
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
      active_users: activeUsers || 0,
      churned_users: churnedUsers || 0,
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([loadUsers(), loadMetrics()]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, loadUsers, loadMetrics]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (query && !user.email.toLowerCase().includes(query) && !user.full_name.toLowerCase().includes(query)) {
        return false;
      }
      if (statusFilter !== DEFAULT_FILTER && user.status !== statusFilter) return false;
      if (tierFilter !== DEFAULT_FILTER && user.tier !== tierFilter) return false;
      return true;
    });
  }, [users, searchQuery, statusFilter, tierFilter]);

  const hasActiveFilters = statusFilter !== DEFAULT_FILTER || tierFilter !== DEFAULT_FILTER || searchQuery !== '';

  const getStatusColor = (status: string): ChipTone => {
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

  const getTierColor = (tier: string): ChipTone => {
    switch (tier) {
      case 'enterprise':
        return 'primary';
      case 'pro':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const columns: GridColDef<UserData>[] = [
    {
      field: 'full_name',
      headerName: 'User',
      flex: 1,
      minWidth: 260,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, height: '100%' }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: '0.875rem', fontWeight: 600 }}>
            {params.row.full_name.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, lineHeight: 1.3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {params.row.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'tier',
      headerName: 'Tier',
      width: 130,
      renderCell: (params) => (
        <Chip label={String(params.value).toUpperCase()} color={getTierColor(params.value)} size="small" />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip label={String(params.value).toUpperCase()} color={getStatusColor(params.value)} size="small" />
      ),
    },
    {
      field: 'audit_count',
      headerName: 'Audits',
      width: 110,
      type: 'number',
      cellClassName: 'UserDirectory-tabular',
    },
    {
      field: 'last_login',
      headerName: 'Last Active',
      width: 150,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            <time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time>
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" aria-label="Edit user" sx={{ width: 40, height: 40 }}>
            <Icon name="edit" style={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" aria-label="Delete user" sx={{ width: 40, height: 40 }}>
            <Icon name="delete" style={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <PageCanvas maxWidth="xl">
        <EmptyState
          icon="shield"
          title="Access denied"
          description="You do not have permission to view this page."
        />
      </PageCanvas>
    );
  }

  const churnTone = metrics.churned_users > 0 ? 'error' : 'neutral';

  return (
    <PageCanvas maxWidth="xl">
      <PageHeader
        eyebrow="Admin"
        title="User Management"
        description="Accounts, tiers, and activity across Univia."
        titleComponent="h1"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
          gap: 3,
          mb: { xs: 4, md: 6 },
        }}
      >
        <MetricTile
          label="New Users"
          value={metrics.new_users}
          support="Last 7 days"
          tone="neutral"
          icon={<Icon name="person" />}
          loading={loading}
          reveal={0}
        />
        <MetricTile
          label="Active Users"
          value={metrics.active_users}
          support="Currently active accounts"
          tone="success"
          icon={<Icon name="check_circle" />}
          loading={loading}
          reveal={1}
        />
        <MetricTile
          label="Churned Users"
          value={metrics.churned_users}
          support="Accounts marked churned"
          tone={churnTone}
          icon={<Icon name="logout" />}
          loading={loading}
          reveal={2}
        />
      </Box>

      <BezelCard component="section" aria-labelledby={DIRECTORY_TITLE_ID} reveal={3}>
        <Typography id={DIRECTORY_TITLE_ID} variant="h5" component="h2" sx={{ letterSpacing: '-0.01em', mb: 2.5 }}>
          Directory
        </Typography>

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
            onChange={(_, nextView: DirectoryView | null) => nextView && updateParam('view', nextView, DEFAULT_VIEW)}
            size="small"
            aria-label="Directory view"
            sx={{
              '& .MuiToggleButton-root': {
                minHeight: 44,
                px: 2,
                gap: 1,
                textTransform: 'none',
                fontWeight: 550,
              },
            }}
          >
            <ToggleButton value="cards" aria-label="Cards view">
              <Icon name="grid_view" style={{ fontSize: 18 }} aria-hidden />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <Icon name="view_list" style={{ fontSize: 18 }} aria-hidden />
              Table
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="user-status-filter-label">Status</InputLabel>
              <Select
                labelId="user-status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => updateParam('status', e.target.value, DEFAULT_FILTER)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="churned">Churned</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="user-tier-filter-label">Tier</InputLabel>
              <Select
                labelId="user-tier-filter-label"
                value={tierFilter}
                label="Tier"
                onChange={(e) => updateParam('tier', e.target.value, DEFAULT_FILTER)}
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
              type="search"
              value={searchQuery}
              onChange={(e) => updateParam('q', e.target.value, '')}
              slotProps={{
                input: {
                  'aria-label': 'Search users',
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon name="search" style={{ fontSize: 18 }} aria-hidden />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: 250,
                borderRadius: 999,
                '& .MuiOutlinedInput-root': { borderRadius: 999 },
              }}
            />
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
              gap: 2.5,
            }}
            aria-busy="true"
            aria-label="Loading users"
          >
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={196}
                sx={{ borderRadius: (theme) => `${theme.surfaces.shellRadius}px` }}
              />
            ))}
          </Box>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon="people"
            title={users.length === 0 ? 'No users yet' : 'No users match these filters'}
            description={
              users.length === 0
                ? 'Accounts appear here as people sign up.'
                : 'Try a different status, tier, or search term.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="text" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
            compact
          />
        ) : view === 'table' ? (
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              autoHeight
              rowHeight={64}
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
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaderTitle': eyebrowHeaderSx,
                '& .MuiDataGrid-cell': {
                  borderColor: 'divider',
                },
                '& .UserDirectory-tabular': {
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
            {selectedRows.length > 0 && (
              <Box
                role="toolbar"
                aria-label="Bulk actions"
                sx={{
                  position: 'fixed',
                  bottom: 24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: (theme) => theme.zIndex.snackbar,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 1,
                  py: 1,
                  pl: 3,
                  borderRadius: 999,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  maxWidth: 'calc(100vw - 32px)',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {selectedRows.length} selected
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" sx={{ borderRadius: 999 }}>
                    Engage
                  </Button>
                  <Button size="small" variant="outlined" sx={{ borderRadius: 999 }}>
                    Export
                  </Button>
                  <Button size="small" variant="outlined" color="error" sx={{ borderRadius: 999 }}>
                    Delete
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
              gap: 2.5,
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {filteredUsers.map((user, index) => (
              <Box component="li" key={user.id} sx={{ minWidth: 0 }}>
                <UserCard
                  user={user}
                  tierColor={getTierColor(user.tier)}
                  statusColor={getStatusColor(user.status)}
                  reveal={index}
                />
              </Box>
            ))}
          </Box>
        )}
      </BezelCard>
    </PageCanvas>
  );
}
