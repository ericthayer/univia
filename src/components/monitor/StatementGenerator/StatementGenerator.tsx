import { useCallback, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import type { MonitorSite, ScanRun, SiteDetail } from '../../../services/monitor.service';
import {
  buildStatement,
  statementToHtmlDocument,
  statementToHtmlFragment,
  statementToText,
} from './buildStatement';
import { knownLimitations } from './knownLimitations';
import { StatementActions } from './StatementActions';
import { StatementForm, type StatementFormHandle } from './StatementForm';
import { validateStatementFields, type StatementErrors, type StatementFields } from './statementFields';
import { StatementPreview } from './StatementPreview';

export interface StatementGeneratorProps {
  site: MonitorSite;
  detail: SiteDetail;
  /**
   * The latest completed full scan, loaded outside the capped run history.
   * When omitted, it is looked up in `detail.runs`.
   */
  latestFullScan?: ScanRun | null;
  /** Injected for tests; defaults to today's local date. */
  today?: string;
}

const localToday = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const slug = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';

/**
 * Drafts an accessibility statement from the site's Monitor data. The owner
 * reviews it and publishes it on their own site; Univia does not host it.
 */
export function StatementGenerator({ site, detail, latestFullScan, today = localToday() }: StatementGeneratorProps) {
  const [fields, setFields] = useState<StatementFields>({
    organization: site.name,
    contactEmail: '',
    contactPhone: '',
    responseDays: 5,
    standard: '2.2',
    measures: '',
    includeLimitations: true,
  });
  const [errors, setErrors] = useState<StatementErrors>({});
  const formRef = useRef<StatementFormHandle>(null);

  const lastScan = useMemo(() => {
    // A one-page re-check is not a site-wide check, so coverage comes from the latest full scan.
    const run = latestFullScan !== undefined
      ? latestFullScan
      : detail.runs.find((entry) => entry.status === 'completed' && entry.completed_at && entry.trigger !== 'recheck');
    return run?.completed_at
      ? { completedAt: run.completed_at, pagesChecked: run.pages_succeeded, pagesTotal: run.pages_total }
      : null;
  }, [detail.runs, latestFullScan]);
  const limitations = useMemo(() => knownLimitations(detail.issues), [detail.issues]);

  const statement = useMemo(
    () =>
      buildStatement({
        ...fields,
        organization: fields.organization || site.name,
        siteName: site.name,
        origin: site.origin,
        pagesMonitored: detail.pages.length,
        weeklyScans: !site.paused,
        lastScan,
        limitations,
        reviewedOn: today,
      }),
    [fields, site.name, site.origin, site.paused, detail.pages.length, lastScan, limitations, today],
  );

  const handleChange = (next: StatementFields) => {
    setFields(next);
    if (errors.organization || errors.contactEmail) setErrors(validateStatementFields(next));
  };

  const validate = useCallback(() => {
    const next = validateStatementFields(fields);
    setErrors(next);
    if (next.organization || next.contactEmail) {
      formRef.current?.focusFirstError(next);
      return false;
    }
    return true;
  }, [fields]);

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'start' }}>
      <BezelCard component="section" aria-labelledby="statement-details-title">
        <SectionHeader id="statement-details-title" title="Your details" dense />
        <StatementForm
          ref={formRef}
          fields={fields}
          errors={errors}
          onChange={handleChange}
          limitationsAvailable={Boolean(lastScan)}
        />
      </BezelCard>

      <BezelCard component="section" aria-labelledby="statement-preview-heading">
        <SectionHeader id="statement-preview-heading" title="Preview" dense />
        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          This is a draft for you to review. It is not a legal or compliance determination. Publish it on your own site, usually linked from the footer.
        </Alert>
        <StatementPreview statement={statement} />
        <Box sx={{ mt: 3 }}>
          <StatementActions
            validate={validate}
            getHtmlFragment={() => statementToHtmlFragment(statement)}
            getHtmlDocument={() => statementToHtmlDocument(statement)}
            getText={() => statementToText(statement)}
            fileName={`accessibility-statement-${slug(site.name)}.html`}
            draftKey={JSON.stringify(fields)}
          />
        </Box>
      </BezelCard>
    </Box>
  );
}
