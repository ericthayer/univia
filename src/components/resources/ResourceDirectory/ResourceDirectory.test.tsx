import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import type { ProfessionalResource } from '../../../types';

let mockRows: ProfessionalResource[] = [];

vi.mock('../../../services/supabaseClient', () => {
  const query = {
    select: () => query,
    order: () => query,
    then: (resolve: (value: { data: ProfessionalResource[]; error: null }) => void) =>
      resolve({ data: mockRows, error: null }),
  };
  return { supabase: { from: () => query } };
});

import { ResourceDirectory } from './ResourceDirectory';

const renderDirectory = () =>
  renderWithTheme(
    <MemoryRouter>
      <ResourceDirectory />
    </MemoryRouter>
  );

describe('ResourceDirectory', () => {
  it('shows the in-review state, not a no-match state, when the directory is empty', async () => {
    mockRows = [];
    renderDirectory();
    expect(await screen.findByText('Vetted listings are on the way')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('renders listings with working contact links', async () => {
    mockRows = [
      {
        id: 'r1',
        name: 'Example Counsel',
        type: 'lawyer',
        contact_email: 'intake@example.com',
        website: 'https://example.com',
        created_at: '2026-11-01',
      },
    ];
    renderDirectory();
    expect(await screen.findByRole('heading', { name: 'Example Counsel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact Example Counsel/ })).toHaveAttribute(
      'href',
      'mailto:intake@example.com'
    );
    expect(screen.getByRole('link', { name: /Website for Example Counsel/ })).toHaveAttribute('target', '_blank');
  });
});
