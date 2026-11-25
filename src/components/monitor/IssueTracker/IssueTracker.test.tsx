import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import type { IssueEvent, MonitorIssue, ScanRun, SiteDetail } from '../../../services/monitor.service';

const service = vi.hoisted(() => ({
  markIssueFixed: vi.fn(),
  undoMarkFixed: vi.fn(),
  requestPageRecheck: vi.fn(),
}));

vi.mock('../../../services/monitor.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../services/monitor.service')>()),
  ...service,
}));

const { IssueTracker } = await import('./IssueTracker');

const T = '2026-11-20T10:00:00Z';

function issue(id: string, state: MonitorIssue['state'], title: string): MonitorIssue {
  return {
    id,
    page_id: 'p1',
    rule_id: `rule-${id}`,
    title,
    severity: 'serious',
    element_count: 2,
    sample_items: [],
    state,
    first_seen_at: T,
    last_seen_at: T,
  };
}

function event(id: number, issueId: string, kind: IssueEvent['kind'], note: string | null = null): IssueEvent {
  return { id, issue_id: issueId, run_id: null, kind, note, created_at: T };
}

const RUN: ScanRun = {
  id: 'r1',
  trigger: 'initial',
  status: 'completed',
  pages_total: 1,
  pages_succeeded: 1,
  pages_failed: 0,
  new_issues: 3,
  resolved_issues: 0,
  open_issues: 3,
  created_at: T,
  started_at: T,
  completed_at: T,
};

const DETAIL: SiteDetail = {
  pages: [{ id: 'p1', url: 'https://shop.example.com/cart', created_at: T }],
  runs: [RUN],
  latestResults: [],
  issues: [
    issue('a', 'open', 'Images need text'),
    issue('b', 'open', 'Links need names'),
    issue('c', 'marked_fixed', 'Buttons need names'),
    issue('d', 'resolved', 'Contrast too low'),
  ],
  events: [
    event(1, 'a', 'detected'),
    event(2, 'b', 'detected'),
    event(3, 'b', 'resolved'),
    event(4, 'b', 'reopened'),
    event(5, 'c', 'detected'),
    event(6, 'c', 'marked_fixed', 'Added aria-label'),
    event(7, 'd', 'detected'),
    event(8, 'd', 'marked_fixed'),
    event(9, 'd', 'fix_confirmed'),
  ],
};

function setup(filter: 'open' | 'marked_fixed' | 'reopened' | 'fixed' = 'open', detail: SiteDetail = DETAIL) {
  const onChanged = vi.fn();
  const onFilterChange = vi.fn();
  renderWithTheme(<IssueTracker detail={detail} filter={filter} onFilterChange={onFilterChange} onChanged={onChanged} />);
  return { onChanged, onFilterChange, user: userEvent.setup() };
}

const rowTitles = () => screen.getAllByRole('rowheader').map((cell) => within(cell).getAllByText(/./)[0].textContent);

describe('IssueTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts each filter from history and shows reopened issues under Open', async () => {
    const { onFilterChange, user } = setup();
    expect(screen.getByRole('button', { name: 'Open (2)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Marked fixed (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reopened (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed (1)' })).toBeInTheDocument();
    expect(rowTitles()).toEqual(['Images need text', 'Links need names']);
    const reopenedRow = screen.getByRole('rowheader', { name: /Links need names/ }).closest('tr');
    expect(within(reopenedRow as HTMLElement).getByText('Reopened')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fixed (1)' }));
    expect(onFilterChange).toHaveBeenCalledWith('fixed');
  });

  it('marks an issue fixed with a note and reports the result', async () => {
    service.markIssueFixed.mockResolvedValue({ ok: true, value: null });
    const { onChanged, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Mark fixed: Images need text on /cart' }));
    const note = screen.getByRole('textbox', { name: /What did you change/ });
    expect(note).toHaveFocus();
    await user.type(note, 'Added alt text');
    await user.click(screen.getByRole('button', { name: 'Mark fixed' }));
    expect(service.markIssueFixed).toHaveBeenCalledWith('a', 'Added alt text');
    expect(await screen.findByText(/Marked fixed\. Re-check the page/)).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('Escape closes the form and returns focus to its button', async () => {
    const { user } = setup();
    const button = screen.getByRole('button', { name: 'Mark fixed: Images need text on /cart' });
    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('offers re-check and undo for a marked issue, and shows its note in history', async () => {
    service.requestPageRecheck.mockResolvedValue({ ok: false, message: 'You can re-check pages 10 times a day per site.' });
    const { onChanged, user } = setup('marked_fixed');
    await user.click(screen.getByRole('button', { name: 'History: Buttons need names on /cart' }));
    expect(screen.getByText('Note: Added aria-label')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Re-check /cart now' }));
    expect(service.requestPageRecheck).toHaveBeenCalledWith('p1');
    expect(await screen.findByText(/10 times a day/)).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Undo fixed mark: Buttons need names on /cart' })).toBeEnabled();
  });

  it('disables re-check while a scan is running', () => {
    setup('marked_fixed', { ...DETAIL, runs: [{ ...RUN, status: 'running' }] });
    expect(screen.getByRole('button', { name: 'Re-check /cart now' })).toBeDisabled();
  });

  it('shows an empty state for a filter with nothing in it', () => {
    setup('reopened', { ...DETAIL, issues: [DETAIL.issues[0]], events: [event(1, 'a', 'detected')] });
    expect(screen.getByText('No reopened issues')).toBeInTheDocument();
  });
});
