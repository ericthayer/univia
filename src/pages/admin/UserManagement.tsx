import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import type { Theme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/ui/Icon';
import { PageCanvas } from '../../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { BezelCard } from '../../components/ui/BezelCard/BezelCard';
import { MetricTile } from '../../components/ui/MetricTile/MetricTile';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader';
import { SegmentedToggleGroup } from '../../components/ui/SegmentedToggleGroup/SegmentedToggleGroup';
import { UserCard, UserCardUser } from '../../components/admin/UserCard/UserCard';
import { FilterSelect } from '../../components/admin/FilterSelect/FilterSelect';
import { StatusPill, TierPill } from '../../components/admin/UserBadges/UserBadges';

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

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
] as const;

const TIER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
] as const;

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
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <TierPill tier={String(params.value)} />
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <StatusPill status={String(params.value)} />
        </Box>
      ),
    },
    {
      field: 'audit_count',
      headerName: 'Audits',
      width: 110,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'UserDirectory-tabular',
    },
    {
      field: 'last_login',
      headerName: 'Last Active',
      width: 150,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              <time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time>
            </Typography>
          </Box>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: '100%' }}>
          <IconButton size="small" aria-label="Edit user" sx={{ width: 40, height: 40, color: 'text.secondary' }}>
            <Icon name="edit" style={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Delete user"
            sx={{ width: 40, height: 40, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
          >
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
        <SectionHeader
          id={DIRECTORY_TITLE_ID}
          title="Directory"
          meta={
            hasActiveFilters
              ? `${filteredUsers.length} of ${users.length} users`
              : `${users.length} ${users.length === 1 ? 'user' : 'users'}`
          }
        />

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
          <SegmentedToggleGroup
            value={view}
            exclusive
            onChange={(_, nextView: DirectoryView | null) => nextView && updateParam('view', nextView, DEFAULT_VIEW)}
            size="small"
            aria-label="Directory view"
          >
            <ToggleButton value="cards" aria-label="Cards view">
              <Icon name="grid_view" style={{ fontSize: 16 }} aria-hidden />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <Icon name="view_list" style={{ fontSize: 16 }} aria-hidden />
              Table
            </ToggleButton>
          </SegmentedToggleGroup>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: { md: 'flex-end' } }}>
            <FilterSelect
              id="user-status-filter"
              label="Status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(next) => updateParam('status', next, DEFAULT_FILTER)}
            />
            <FilterSelect
              id="user-tier-filter"
              label="Tier"
              value={tierFilter}
              options={TIER_OPTIONS}
              onChange={(next) => updateParam('tier', next, DEFAULT_FILTER)}
            />
            <TextField
              placeholder="Search users…"
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
                flex: { xs: '1 1 100%', sm: '0 1 260px' },
                // The theme paints the field root with a square background; round it to match the pill outline.
                borderRadius: 999,
                '& .MuiOutlinedInput-root': { borderRadius: 999, minHeight: 44, pl: 1.75 },
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
                '--DataGrid-containerBackground': 'var(--mui-palette-action-hover)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
                overflow: 'hidden',
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
                '& .MuiDataGrid-columnHeaderTitle': eyebrowHeaderSx,
                '& .MuiDataGrid-cell': {
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-row': {
                  transition: (theme: Theme) =>
                    `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
                },
                '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
                '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover': { bgcolor: 'action.selected' },
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
                <UserCard user={user} reveal={index} />
              </Box>
            ))}
          </Box>
        )}
      </BezelCard>
    </PageCanvas>
  );
}
