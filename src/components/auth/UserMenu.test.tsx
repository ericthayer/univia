import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();
let mockPathname = '/';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: mockPathname,
      search: '',
      hash: '',
      state: null,
      key: 'test-key',
    }),
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    profile: {
      id: 'u1',
      email: 'test@example.com',
      full_name: 'Test User',
      tier: 'basic',
      is_admin: false,
    },
    signOut: mockSignOut,
  }),
}));

import UserMenu from './UserMenu';

describe('UserMenu interactions', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSignOut.mockReset();
    mockPathname = '/';
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Outside action</button>
        <UserMenu />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /outside action/i, hidden: true }));

    await waitFor(() => {
      expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    });
  });

  it('closes when the trigger is clicked again', async () => {
    const user = userEvent.setup();

    render(<UserMenu />);

    const trigger = screen.getByRole('button', { name: /user menu/i });

    await user.click(trigger);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    });
  });

  it('closes after selecting a menu item', async () => {
    const user = userEvent.setup();

    render(<UserMenu />);

    await user.click(screen.getByRole('button', { name: /user menu/i }));
    await user.click(screen.getByText('Account Settings'));

    await waitFor(() => {
      expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  it('closes when the anchor element becomes detached from the document', async () => {
    const user = userEvent.setup();

    const { rerender } = render(<UserMenu />);
    const trigger = screen.getByRole('button', { name: /user menu/i });

    await user.click(trigger);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();

    Object.defineProperty(trigger, 'isConnected', {
      configurable: true,
      get: () => false,
    });

    rerender(<UserMenu />);

    await waitFor(() => {
      expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    });
  });

  it('closes when the route changes while the menu is open', async () => {
    const user = userEvent.setup();

    const { rerender } = render(<UserMenu />);

    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();

    mockPathname = '/pricing';
    rerender(<UserMenu />);

    await waitFor(() => {
      expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    });
  });
});
