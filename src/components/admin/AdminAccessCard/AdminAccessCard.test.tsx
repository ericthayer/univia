import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AdminAccessCard } from './AdminAccessCard';

const ADMINS = [
  { id: 'me', email: 'eric@example.com', full_name: 'Eric' },
  { id: 'u2', email: 'ada@example.com', full_name: 'Ada Lovelace' },
];

function setup(overrides: Partial<Parameters<typeof AdminAccessCard>[0]> = {}) {
  const onGrant = vi.fn().mockResolvedValue({ kind: 'success', message: 'new@example.com is now an administrator.' });
  const onRevoke = vi.fn().mockResolvedValue({ kind: 'success', message: 'Removed admin access for ada@example.com.' });
  renderWithTheme(
    <AdminAccessCard
      admins={ADMINS}
      currentUserId="me"
      loading={false}
      loadError={null}
      onGrant={onGrant}
      onRevoke={onRevoke}
      {...overrides}
    />
  );
  return { onGrant, onRevoke, user: userEvent.setup() };
}

describe('AdminAccessCard', () => {
  it('lists admins and hides revoke on the signed-in admin', () => {
    setup();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revoke admin access for ada@example.com' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eric@example.com/ })).not.toBeInTheDocument();
  });

  it('blocks an invalid email and focuses the field', async () => {
    const { onGrant, user } = setup();
    const field = screen.getByLabelText('Email address');
    await user.type(field, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Grant access' }));
    expect(onGrant).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(field).toHaveFocus();
  });

  it('grants access and announces the result', async () => {
    const { onGrant, user } = setup();
    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Grant access' }));
    expect(onGrant).toHaveBeenCalledWith('new@example.com');
    expect(await screen.findByText('new@example.com is now an administrator.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveValue('');
  });

  it('confirms before revoking', async () => {
    const { onRevoke, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Revoke admin access for ada@example.com' }));
    expect(onRevoke).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Revoke access' }));
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith(ADMINS[1]));
    expect(await screen.findByText('Removed admin access for ada@example.com.')).toBeInTheDocument();
  });
});
