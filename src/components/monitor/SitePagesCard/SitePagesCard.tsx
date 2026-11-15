import { FormEvent, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { srOnly } from '../../ui/srOnly';
import { MonitorTable } from '../MonitorTable/MonitorTable';
import { PageRow } from './PageRow';
import { monitorFieldSx } from '../monitorFieldSx';
import { MONITOR_PAGE_LIMIT, parsePageList } from '../../../utils/monitorUrls';
import { addSitePages, removeSitePage, type MonitorIssue, type MonitorSite, type SiteDetail } from '../../../services/monitor.service';
import { controlRadius } from '../../../theme/tokens';

export interface SitePagesCardProps {
  site: MonitorSite;
  detail: SiteDetail;
  onChanged: () => void;
}

function countOpenByPage(issues: readonly MonitorIssue[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    if (issue.state === 'open') counts.set(issue.page_id, (counts.get(issue.page_id) ?? 0) + 1);
  }
  return counts;
}

/** Monitored pages with their latest result, plus adding and removing pages. */
export function SitePagesCard({ site, detail, onChanged }: SitePagesCardProps) {
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const results = new Map(detail.latestResults.map((result) => [result.page_id, result]));
  const openByPage = countOpenByPage(detail.issues);
  const remaining = MONITOR_PAGE_LIMIT - detail.pages.length;

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    const list = parsePageList(site.origin, text, detail.pages.map((page) => page.url));
    const problem = list.errors.join(' ') || (list.urls.length ? '' : 'Enter at least one new page.');
    if (problem) {
      setFieldError(problem);
      fieldRef.current?.focus();
      return;
    }
    setFieldError('');
    setBusy(true);
    const result = await addSitePages(site.id, list.urls);
    setBusy(false);
    if (!result.ok) return setStatus({ tone: 'error', text: result.message });
    setText('');
    setStatus({
      tone: 'success',
      text: result.value === 1 ? '1 page added. It is included from the next scan.' : `${result.value} pages added. They are included from the next scan.`,
    });
    onChanged();
  };

  const handleRemove = async (pageId: string) => {
    setStatus(null);
    setBusy(true);
    const result = await removeSitePage(pageId);
    setBusy(false);
    setStatus(result.ok ? { tone: 'success', text: 'Page removed.' } : { tone: 'error', text: result.message });
    if (result.ok) {
      // The removed row unmounts; keep keyboard users in the page list.
      tableRef.current?.focus();
      onChanged();
    }
  };

  return (
    <BezelCard component="section" aria-labelledby="site-pages-title">
      <SectionHeader id="site-pages-title" title="Pages" meta={`${detail.pages.length} of ${MONITOR_PAGE_LIMIT}`} dense />
      <MonitorTable ref={tableRef} caption={`Pages monitored on ${site.origin}`}>
        <thead>
          <tr>
            <th scope="col">Page</th>
            <th scope="col">Last scan</th>
            <th scope="col">Score</th>
            <th scope="col">Open issues</th>
            <th scope="col">
              <Box component="span" sx={srOnly}>
                Actions
              </Box>
            </th>
          </tr>
        </thead>
        <tbody>
          {detail.pages.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              result={results.get(page.id)}
              openIssues={openByPage.get(page.id) ?? 0}
              canRemove={detail.pages.length > 1}
              disabled={busy}
              onRemove={handleRemove}
            />
          ))}
        </tbody>
      </MonitorTable>
      <Box aria-live="polite" sx={{ mt: status ? 2 : 0 }}>
        {status && (
          <Alert severity={status.tone} onClose={() => setStatus(null)}>
            {status.text}
          </Alert>
        )}
      </Box>
      {remaining > 0 && (
        <Box component="form" noValidate onSubmit={handleAdd} sx={{ display: 'grid', gap: 1.5, mt: 3 }}>
          <TextField
            label="Add pages"
            placeholder={'/pricing\n/contact'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            inputRef={fieldRef}
            error={Boolean(fieldError)}
            helperText={fieldError || `One per line. ${remaining} more ${remaining === 1 ? 'page' : 'pages'} allowed.`}
            multiline
            minRows={2}
            disabled={busy}
            sx={monitorFieldSx}
          />
          <Box>
            <Button type="submit" variant="outlined" disabled={busy} sx={{ borderRadius: controlRadius, minHeight: 44 }}>
              Add pages
            </Button>
          </Box>
        </Box>
      )}
    </BezelCard>
  );
}

export default SitePagesCard;
