import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MonitorSite, SiteDetail } from '../../../services/monitor.service';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { StatementGenerator } from './StatementGenerator';

const site: MonitorSite = { id: 's1', name: 'Corner Bakery', origin: 'https://bakery.example.com', paused: false, created_at: '2026-11-01T00:00:00Z' };

const detail = (completed: boolean): SiteDetail => ({
  pages: [
    { id: 'p1', url: 'https://bakery.example.com/', created_at: '2026-11-01T00:00:00Z' },
    { id: 'p2', url: 'https://bakery.example.com/menu', created_at: '2026-11-01T00:00:00Z' },
  ],
  runs: completed
    ? [{
        id: 'r1', trigger: 'scheduled', status: 'completed', pages_total: 2, pages_succeeded: 2, pages_failed: 0,
        new_issues: 1, resolved_issues: 0, open_issues: 1, created_at: '2026-11-20T14:00:00Z', started_at: '2026-11-20T14:00:00Z', completed_at: '2026-11-20T15:00:00Z',
      }]
    : [],
  latestResults: [],
  issues: [{
    id: 'i1', page_id: 'p2', rule_id: 'image-alt', title: 'Image elements do not have [alt] attributes', severity: 'critical',
    element_count: 2, sample_items: [], state: 'open', first_seen_at: '2026-11-20T15:00:00Z', last_seen_at: '2026-11-20T15:00:00Z',
  }],
});

describe('StatementGenerator', () => {
  afterEach(() => vi.restoreAllMocks());

  it('previews the draft from site data and lists open issues', () => {
    renderWithTheme(<StatementGenerator site={site} detail={detail(true)} today="2026-11-25" />);
    const preview = screen.getByRole('article', { name: /accessibility statement for corner bakery/i });
    expect(within(preview).getByText(/on 2 pages of this site every week/)).toBeInTheDocument();
    expect(within(preview).getByText('Image elements do not have [alt] attributes (1 page)')).toBeInTheDocument();
    expect(within(preview).getByText(/last reviewed on November 25, 2026/)).toBeInTheDocument();
  });

  it('turns off known issues until a scan completes', () => {
    renderWithTheme(<StatementGenerator site={site} detail={detail(false)} today="2026-11-25" />);
    expect(screen.getByRole('checkbox', { name: /known issues appear after the first scan/i })).toBeDisabled();
    expect(screen.queryByRole('heading', { name: 'Known limitations' })).not.toBeInTheDocument();
  });

  it('focuses the email field and does not copy when it is missing', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithTheme(<StatementGenerator site={site} detail={detail(true)} today="2026-11-25" />);

    await user.click(screen.getByRole('button', { name: 'Copy HTML' }));
    expect(screen.getByLabelText(/contact email/i)).toHaveFocus();
    expect(screen.getByText('Enter an email address people can write to.')).toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/contact email/i), 'help@bakery.example.com');
    await user.click(screen.getByRole('button', { name: 'Copy HTML' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('<a href="mailto:help@bakery.example.com">'));
    expect(screen.getByRole('status')).toHaveTextContent('HTML copied to the clipboard.');
  });
});
