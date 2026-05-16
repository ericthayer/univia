import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTE_PATHS } from '../../config/navigation';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import AuthCallback from './AuthCallback';
import { supabase } from '../../services/supabaseClient';

type GetSessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;

describe('AuthCallback', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(supabase.auth.getSession).mockReset();
    window.history.replaceState({}, '', '/auth/callback');
  });

  it('keeps callback route path stable', () => {
    expect(ROUTE_PATHS.AUTH_CALLBACK).toBe('/auth/callback');
  });

  it('redirects to home when session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    } as GetSessionResult);

    render(<AuthCallback />);

    expect(screen.getByText('Completing sign in...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to sign in with error when callback session fetch fails', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: { message: 'oauth failed' },
    } as GetSessionResult);

    window.history.replaceState({}, '', '/auth/callback?error_description=Provider%20denied');

    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin?error=Provider%20denied');
    });
  });

  it('redirects to sign in when no session is established', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as GetSessionResult);

    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/signin?error=Could%20not%20establish%20session.%20Please%20try%20signing%20in%20again.'
      );
    });
  });
});
