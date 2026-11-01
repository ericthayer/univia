import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';

const service = vi.hoisted(() => ({
  createShareLink: vi.fn(),
  listShareLinks: vi.fn(),
  revokeShareLink: vi.fn(),
}));

vi.mock('../../../services/letterShare.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../services/letterShare.service')>()),
  ...service,
}));

import { ShareLetterDialog } from './ShareLetterDialog';

const ACTIVE = {
  id: 'link-1',
  createdAt: '2026-11-01T12:00:00Z',
  expiresAt: '2026-11-08T12:00:00Z',
  accessCount: 2,
  lastAccessedAt: null,
};

describe('ShareLetterDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.listShareLinks.mockResolvedValue({ ok: true, value: [] });
  });

  it('explains that nobody can see the analysis until a link exists', async () => {
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} letterId="letter-1" letterName="letter.pdf" />);
    expect(screen.getByRole('dialog', { name: 'Share analysis' })).toBeInTheDocument();
    expect(await screen.findByText(/No active links/)).toBeInTheDocument();
  });

  it('creates a link with the chosen expiry and shows it once', async () => {
    const user = userEvent.setup();
    service.createShareLink.mockResolvedValue({
      ok: true,
      value: { id: 'link-1', url: 'https://univia.app/shared/letter#tok', expiresAt: ACTIVE.expiresAt },
    });
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} letterId="letter-1" />);

    await user.click(screen.getByRole('button', { name: '30 days' }));
    service.listShareLinks.mockResolvedValue({ ok: true, value: [ACTIVE] });
    await user.click(screen.getByRole('button', { name: /create link/i }));

    expect(service.createShareLink).toHaveBeenCalledWith('letter-1', 30);
    expect(await screen.findByLabelText('Share link')).toHaveValue('https://univia.app/shared/letter#tok');
    expect(screen.getByText(/2 views/)).toBeInTheDocument();
  });

  it('revokes a link from the active list', async () => {
    const user = userEvent.setup();
    service.listShareLinks.mockResolvedValue({ ok: true, value: [ACTIVE] });
    service.revokeShareLink.mockResolvedValue({ ok: true, value: true });
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} letterId="letter-1" />);

    const revoke = await screen.findByRole('button', { name: /revoke link created/i });
    service.listShareLinks.mockResolvedValue({ ok: true, value: [] });
    await user.click(revoke);

    expect(service.revokeShareLink).toHaveBeenCalledWith('link-1');
    await waitFor(() => expect(screen.getByText(/No active links/)).toBeInTheDocument());
  });

  it('blocks sharing when the analysis was not saved', () => {
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} />);
    expect(screen.getByText(/was not saved to your account/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create link/i })).not.toBeInTheDocument();
  });
});
