import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/renderWithTheme';

let mockIsRegistered = false;

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isRegistered: mockIsRegistered }),
}));

import Footer from './Footer';

const renderFooter = () =>
  renderWithTheme(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe('Footer', () => {
  beforeEach(() => {
    mockIsRegistered = false;
  });

  it('hides the Professional Resources link when signed out', () => {
    renderFooter();
    expect(screen.queryByRole('link', { name: 'Professional Resources' })).not.toBeInTheDocument();
  });

  it('links to Professional Resources when signed in', () => {
    mockIsRegistered = true;
    renderFooter();
    expect(screen.getByRole('link', { name: 'Professional Resources' })).toHaveAttribute('href', '/resources');
  });
});
