import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/renderWithTheme';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { is_admin: true } }),
}));

const ACCOUNTS = vi.hoisted(() => [
  { id: 'u1', email: 'ada@example.com', full_name: 'Ada Lovelace', tier: 'pro', status: 'active', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'u2', email: 'grace@example.com', full_name: 'Grace Hopper', tier: 'basic', status: 'active', created_at: '2025-11-01T00:00:00.000Z' },
  { id: 'u3', email: 'alan@example.com', full_name: 'Alan Turing', tier: 'pro', status: 'churned', created_at: '2025-10-01T00:00:00.000Z' },
]);

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: ACCOUNTS, error: null })),
      })),
    })),
  },
}));

import BillingManagement from './BillingManagement';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="search">{location.search}</output>;
}

function renderPage(initialEntry = '/admin/billing') {
  return renderWithTheme(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin/billing"
          element={
            <>
              <BillingManagement />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('BillingManagement', () => {
  it('summarizes billing from account plans', async () => {
    renderPage();

    expect(await screen.findByText('$9')).toBeInTheDocument();
    expect(screen.getByText('50% of active accounts')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Billing Management' })).toBeInTheDocument();
    expect(screen.getByText('No invoices yet')).toBeInTheDocument();
  });

  it('shows paid accounts by default and all accounts after switching the plan filter', async () => {
    const user = userEvent.setup();
    renderPage();

    const table = await screen.findByRole('table', { name: 'Accounts and their billing plan' });
    expect(within(table).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(table).getByText('Alan Turing')).toBeInTheDocument();
    expect(within(table).queryByText('Grace Hopper')).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Plan' }));
    await user.click(await screen.findByRole('option', { name: 'All' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?plan=all'));
    expect(within(screen.getByRole('table')).getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('links each account to User Management filtered by email', async () => {
    renderPage();

    const link = await screen.findByRole('link', { name: 'Manage Ada Lovelace in User Management' });
    expect(link).toHaveAttribute('href', '/admin/users?q=ada%40example.com');
  });
});
