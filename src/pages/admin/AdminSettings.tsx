import Box from '@mui/material/Box';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAccounts } from '../../hooks/useAdminAccounts';
import { normalizeAppVersion } from '../../config/appVersion';
import { ANALYSIS_ENGINE } from '../../config/platformConfig';
import packageJson from '../../../package.json';
import { PageCanvas } from '../../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { AdminAccessCard } from '../../components/admin/AdminAccessCard/AdminAccessCard';
import { PlanLimitsCard } from '../../components/admin/PlanLimitsCard/PlanLimitsCard';
import { SystemInfoCard, SystemInfoItem } from '../../components/admin/SystemInfoCard/SystemInfoCard';

const WIDE = '@container (min-width: 900px)';

function backendHost(): string {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).host;
  } catch {
    return 'Not configured';
  }
}

const ENGINE_ITEMS: SystemInfoItem[] = [
  { label: 'Primary model', value: ANALYSIS_ENGINE.primaryModel },
  { label: 'Deep analysis model', value: ANALYSIS_ENGINE.deepModel },
  { label: 'Anonymous letter limit', value: `${ANALYSIS_ENGINE.anonymousLetterLimit} per visitor` },
];

const ENVIRONMENT_ITEMS: SystemInfoItem[] = [
  { label: 'App version', value: normalizeAppVersion(import.meta.env.VITE_APP_VERSION, packageJson.version) },
  { label: 'Backend', value: backendHost() },
  { label: 'Build', value: import.meta.env.MODE },
];

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const { admins, loading, loadError, grant, revoke } = useAdminAccounts(Boolean(profile?.is_admin));

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Admin"
        title="Admin Settings"
        description="Manage who administers Univia and review the limits and services the platform runs on."
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: 'minmax(0, 1fr)',
          alignItems: 'stretch',
          [WIDE]: { gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)' },
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3, minWidth: 0 }}>
          <AdminAccessCard
            admins={admins}
            currentUserId={user?.id}
            loading={loading}
            loadError={loadError}
            onGrant={grant}
            onRevoke={revoke}
            reveal={0}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', alignContent: 'start', gap: 3, minWidth: 0 }}>
          <SystemInfoCard
            id="engine"
            title="Analysis engine"
            description="Set in the analyze-document Edge Function. Changes need a function deploy."
            items={ENGINE_ITEMS}
            reveal={1}
          />
          <SystemInfoCard id="environment" title="Environment" items={ENVIRONMENT_ITEMS} reveal={2} />
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <PlanLimitsCard reveal={3} />
      </Box>
    </PageCanvas>
  );
}
