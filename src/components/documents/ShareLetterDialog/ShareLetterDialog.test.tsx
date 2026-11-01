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

  it('asks before revoking a link from the active list', async () => {
    const user = userEvent.setup();
    service.listShareLinks.mockResolvedValue({ ok: true, value: [ACTIVE] });
    service.revokeShareLink.mockResolvedValue({ ok: true, value: true });
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} letterId="letter-1" />);

    await user.click(await screen.findByRole('button', { name: /^revoke link created/i }));
    expect(service.revokeShareLink).not.toHaveBeenCalled();
    expect(screen.getByText(/Anyone using it loses access/)).toBeInTheDocument();

    service.listShareLinks.mockResolvedValue({ ok: true, value: [] });
    await user.click(screen.getByRole('button', { name: /confirm revoke link created/i }));

    expect(service.revokeShareLink).toHaveBeenCalledWith('link-1');
    await waitFor(() => expect(screen.getByText(/No active links/)).toBeInTheDocument());
  });

  it('does not claim privacy when the link list fails to load', async () => {
    service.listShareLinks.mockResolvedValue({ ok: false, message: 'Something went wrong. Please try again.' });
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} letterId="letter-1" />);
    expect(await screen.findByText(/could not load your active links/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nobody else can see/)).not.toBeInTheDocument();
  });

  it('keeps the new link visible when revoking it fails', async () => {
    const user = userEvent.setup();
    service.createShareLink.mockResolvedValue({
      ok: true,
      value: { id: 'link-1', url: 'https://univia.app/shared/letter#tok', expiresAt: ACTIVE.expiresAt },
    });
    service.revokeShareLink.mockResolvedValue({ ok: false, message: 'Something went wrong. Please try again.' });
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} letterId="letter-1" />);

    await screen.findByText(/No active links/);
    service.listShareLinks.mockResolvedValue({ ok: true, value: [ACTIVE] });
    await user.click(screen.getByRole('button', { name: /create link/i }));
    await user.click(await screen.findByRole('button', { name: /^revoke link created/i }));
    await user.click(screen.getByRole('button', { name: /confirm revoke link created/i }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('Share link')).toHaveValue('https://univia.app/shared/letter#tok');
  });

  it('blocks sharing when the analysis was not saved', () => {
    renderWithTheme(<ShareLetterDialog open onClose={vi.fn()} />);
    expect(screen.getByText(/was not saved to your account/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create link/i })).not.toBeInTheDocument();
  });
});
