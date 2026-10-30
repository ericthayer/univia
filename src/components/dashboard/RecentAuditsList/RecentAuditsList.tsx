import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import { AccessibilityAudit } from '../../../types';
import AuditHistoryCard from '../../audit/AuditHistoryCard';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';

export interface RecentAuditsListProps {
  audits: AccessibilityAudit[];
  pinnedIds: Set<string>;
  onPinToggle: () => void;
  /** Rows to show after sorting pinned first, newest first. */
  max?: number;
  reveal?: number;
}

/**
 * Recent audits as flush rows inside one surface. Pinned audits float to the
 * top; the full history lives on the Site Audit page.
 */
export function RecentAuditsList({ audits, pinnedIds, onPinToggle, max = 10, reveal }: RecentAuditsListProps) {
  const headingId = 'recent-audits-heading';

  const rows = useMemo(
    () =>
      [...audits]
        .sort((a, b) => {
          const aPinned = pinnedIds.has(a.id);
          const bPinned = pinnedIds.has(b.id);
          if (aPinned !== bPinned) return aPinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, max),
    [audits, pinnedIds, max]
  );

  return (
    <BezelCard component="section" aria-labelledby={headingId} padding="none" reveal={reveal} sx={{ overflow: 'hidden', height: '100%' }}>
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <SectionHeader
          id={headingId}
          component="h3"
          title="Recent Audits"
          meta={`${audits.length} total`}
          dense
          action={
            <ArrowButton variant="text" size="small" component={RouterLink} to="/audit" sx={{ minHeight: 40, pl: 1.5 }}>
              View all
            </ArrowButton>
          }
        />
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
        {rows.map((audit) => (
          <AuditHistoryCard key={audit.id} audit={audit} isPinned={pinnedIds.has(audit.id)} onPinToggle={onPinToggle} />
        ))}
      </Box>
    </BezelCard>
  );
}

export default RecentAuditsList;
