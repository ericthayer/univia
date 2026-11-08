import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../test/renderWithTheme';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isRegistered: false }),
}));

import Dashboard from './Dashboard';

function renderGuestHome() {
  return renderWithTheme(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard guest homepage copy', () => {
  it('does not claim ADA compliance in the hero', () => {
    renderGuestHome();

    const hero = screen.getByRole('heading', { level: 1 }).closest('section');
    expect(hero).not.toBeNull();
    expect(hero?.textContent).not.toMatch(/compliance/i);
    expect(hero?.textContent).toMatch(/use the web on equal terms/i);
  });

  it('describes the metrics action without compliance or expired dates', () => {
    renderGuestHome();

    expect(screen.getByText('Track your audit scores over time')).toBeInTheDocument();
    expect(screen.getByText('Sign in to view')).toBeInTheDocument();
    expect(screen.queryByText(/Track performance and compliance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Q2 2026/)).not.toBeInTheDocument();
  });
});
