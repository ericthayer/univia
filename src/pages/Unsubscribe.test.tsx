import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/notifications.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/notifications.service')>()),
  unsubscribeWithToken: vi.fn(),
}));

import { unsubscribeWithToken } from '../services/notifications.service';
import { renderWithTheme } from '../test/renderWithTheme';
import Unsubscribe from './Unsubscribe';

const unsubscribe = vi.mocked(unsubscribeWithToken);
const token = '0b7c6f2e-9a1d-4c3b-8e5f-1a2b3c4d5e6f';

const renderAt = (search: string) =>
  renderWithTheme(
    <MemoryRouter initialEntries={[`/unsubscribe${search}`]}>
      <Unsubscribe />
    </MemoryRouter>,
  );

describe('Unsubscribe', () => {
  beforeEach(() => unsubscribe.mockReset());

  it('asks before turning alerts off, then confirms', async () => {
    unsubscribe.mockResolvedValueOnce({ ok: true, value: null });
    const user = userEvent.setup();
    renderAt(`?token=${token}`);
    expect(unsubscribe).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Turn off alerts' }));
    expect(unsubscribe).toHaveBeenCalledWith(token);
    expect(screen.getByRole('status')).toHaveTextContent('Scan alerts are off.');
    expect(screen.queryByRole('button', { name: 'Turn off alerts' })).not.toBeInTheDocument();
  });

  it('shows the error and keeps the button when it fails', async () => {
    unsubscribe.mockResolvedValueOnce({ ok: false, message: 'We could not update your alerts. Try again in a minute.' });
    const user = userEvent.setup();
    renderAt(`?token=${token}`);
    await user.click(screen.getByRole('button', { name: 'Turn off alerts' }));
    expect(screen.getByRole('status')).toHaveTextContent('Try again in a minute.');
    expect(screen.getByRole('button', { name: 'Turn off alerts' })).toBeEnabled();
  });

  it('explains a missing or malformed token without a button', () => {
    renderAt('?token=nope');
    expect(screen.getByRole('heading', { name: 'This link is not valid' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
