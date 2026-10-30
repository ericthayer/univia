import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';

vi.mock('../../../services/session', () => ({
  ensureSession: vi.fn(),
}));

vi.mock('../../../services/lighthouseAudit.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/lighthouseAudit.service')>();
  return { ...actual, requestLighthouseAudit: vi.fn() };
});

import { ensureSession } from '../../../services/session';
import { requestLighthouseAudit } from '../../../services/lighthouseAudit.service';
import { QuickAuditBar } from './QuickAuditBar';

const completed = {
  success: true,
  session_id: 'session-1',
  mobile: { status: 'completed', audit_id: 'm' },
  desktop: { status: 'completed', audit_id: 'd' },
};

function renderBar() {
  return renderWithTheme(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<QuickAuditBar onAnalyzeDocs={vi.fn()} />} />
        <Route path="/audit/:id" element={<p>Report page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('QuickAuditBar', () => {
  beforeEach(() => {
    vi.mocked(ensureSession).mockReset();
    vi.mocked(requestLighthouseAudit).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('locks the submit while the audit runs and navigates on success', async () => {
    const user = userEvent.setup();
    let finish: (value: typeof completed) => void = () => {};
    vi.mocked(ensureSession).mockResolvedValue({ access_token: 'token' } as never);
    vi.mocked(requestLighthouseAudit).mockImplementation(
      () => new Promise((resolve) => { finish = resolve; }) as never
    );

    renderBar();
    await user.type(screen.getByLabelText('Website address to audit'), 'example.com');
    const submit = screen.getByRole('button', { name: 'Run audit' });
    await user.click(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    expect(submit).toHaveAttribute('aria-busy', 'true');
    expect(requestLighthouseAudit).toHaveBeenCalledTimes(1);

    finish(completed);
    expect(await screen.findByText('Report page')).toBeInTheDocument();
  });

  it('shows the failure near the form when the session cannot be established', async () => {
    const user = userEvent.setup();
    vi.mocked(ensureSession).mockRejectedValue(new Error('no session'));

    renderBar();
    await user.type(screen.getByLabelText('Website address to audit'), 'example.com');
    await user.click(screen.getByRole('button', { name: 'Run audit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to run audit. Please try again.');
    expect(requestLighthouseAudit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Run audit' })).toBeEnabled();
  });

  it('clears the error when the user edits the URL', async () => {
    const user = userEvent.setup();
    vi.mocked(ensureSession).mockResolvedValue({ access_token: 'token' } as never);
    vi.mocked(requestLighthouseAudit).mockRejectedValue(new Error('boom'));

    renderBar();
    const input = screen.getByLabelText('Website address to audit');
    await user.type(input, 'example.com');
    await user.click(screen.getByRole('button', { name: 'Run audit' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(input, '/');
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
