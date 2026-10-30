import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/renderWithTheme';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { is_admin: true },
  }),
}));

const USERS = vi.hoisted(() => [
  {
    id: 'u1',
    email: 'ada@example.com',
    full_name: 'Ada Lovelace',
    tier: 'pro',
    status: 'active',
    last_login: '2026-01-17T00:00:00.000Z',
    audit_count: 4,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u2',
    email: 'grace@example.com',
    full_name: 'Grace Hopper',
    tier: 'basic',
    status: 'churned',
    last_login: '2025-12-01T00:00:00.000Z',
    audit_count: 0,
    created_at: '2025-11-01T00:00:00.000Z',
  },
]);

vi.mock('../../services/supabaseClient', () => {
  const listQuery = {
    order: vi.fn().mockResolvedValue({ data: USERS, error: null }),
  };
  const countQuery = {
    gte: vi.fn().mockResolvedValue({ count: 1 }),
    eq: vi.fn().mockResolvedValue({ count: 1 }),
  };
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn((_columns?: string, options?: { head?: boolean }) =>
          options?.head ? countQuery : listQuery
        ),
      })),
    },
  };
});

import UserManagement from './UserManagement';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="search">{location.search}</output>;
}

function renderPage(initialEntry = '/admin/users') {
  return renderWithTheme(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin/users"
          element={
            <>
              <UserManagement />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders real metrics without fabricated revenue or deltas', async () => {
    renderPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('New Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Churned Users')).toBeInTheDocument();
    expect(screen.queryByText(/revenue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+\d+%/)).not.toBeInTheDocument();
  });

  it('writes the status filter to the URL and filters the directory', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Status'));
    await user.click(await screen.findByRole('option', { name: 'Churned' }));

    await waitFor(() => {
      expect(screen.getByTestId('search')).toHaveTextContent('status=churned');
    });
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('reads filters from the URL on load and can clear them', async () => {
    const user = userEvent.setup();
    renderPage('/admin/users?tier=enterprise');

    expect(await screen.findByText('No users match these filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toHaveTextContent('');
  });
});
