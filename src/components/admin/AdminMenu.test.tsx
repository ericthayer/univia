import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: {
      is_admin: true,
    },
  }),
}));

import AdminMenu from './AdminMenu';

describe('AdminMenu interactions', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Outside action</button>
        <AdminMenu />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /admin/i }));
    expect(screen.getByText('User Management')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /outside action/i, hidden: true }));

    await waitFor(() => {
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });
  });

  it('navigates and closes when a menu item is selected', async () => {
    const user = userEvent.setup();

    render(<AdminMenu />);

    await user.click(screen.getByRole('button', { name: /admin/i }));
    await user.click(screen.getByText('Billing Management'));

    await waitFor(() => {
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/billing');
  });
});
