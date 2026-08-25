import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mockUseAuth = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import { AdminRoute, ProtectedRoute, RegisteredRoute } from './RouteGuards';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderGuard(element: React.ReactNode, auth: Record<string, unknown>) {
  mockUseAuth.mockReturnValue(auth);

  return render(
    <MemoryRouter
      initialEntries={["/protected"]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/" element={<LocationProbe />} />
        <Route path="/signin" element={<LocationProbe />} />
        <Route path="/forbidden" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('does not render protected content while authentication is loading', () => {
    renderGuard(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
      { loading: true, user: null },
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to the public home page', () => {
    renderGuard(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
      { loading: false, user: null },
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('renders content for an authenticated user', () => {
    renderGuard(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
      { loading: false, user: { id: 'user-1' } },
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('waits for the profile before deciding admin access', () => {
    renderGuard(
      <AdminRoute>
        <p>Admin content</p>
      </AdminRoute>,
      { loading: false, user: { id: 'user-1' }, profileLoading: true, profile: null },
    );

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a forbidden response for a non-admin user', () => {
    renderGuard(
      <AdminRoute>
        <p>Admin content</p>
      </AdminRoute>,
      {
        loading: false,
        user: { id: 'user-1' },
        profileLoading: false,
        profile: { is_admin: false },
      },
    );

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
  });

  it('renders content for an admin user', () => {
    renderGuard(
      <AdminRoute>
        <p>Admin content</p>
      </AdminRoute>,
      {
        loading: false,
        user: { id: 'admin-1' },
        profileLoading: false,
        profile: { is_admin: true },
      },
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});

describe('RegisteredRoute', () => {
  it('redirects an anonymous user to sign-in', () => {
    renderGuard(
      <RegisteredRoute>
        <p>Registered content</p>
      </RegisteredRoute>,
      { loading: false, user: { id: 'guest-1', is_anonymous: true } },
    );

    expect(screen.queryByText('Registered content')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/signin');
  });

  it('renders content for a registered user', () => {
    renderGuard(
      <RegisteredRoute>
        <p>Registered content</p>
      </RegisteredRoute>,
      { loading: false, user: { id: 'user-1', is_anonymous: false } },
    );

    expect(screen.getByText('Registered content')).toBeInTheDocument();
  });
});
