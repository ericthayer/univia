import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { BezelCard } from './BezelCard';

describe('BezelCard', () => {
  it('renders children inside the core', () => {
    renderWithTheme(
      <BezelCard>
        <p>Plate content</p>
      </BezelCard>
    );
    expect(screen.getByText('Plate content')).toBeInTheDocument();
  });

  it('forwards semantic props to the shell', () => {
    renderWithTheme(
      <BezelCard component="section" aria-label="Metrics">
        <span>inner</span>
      </BezelCard>
    );
    const section = screen.getByRole('region', { name: 'Metrics' });
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveClass('BezelCard-shell');
  });

  it('renders the accent line as decoration only', () => {
    const { container } = renderWithTheme(
      <BezelCard accent="success">
        <span>inner</span>
      </BezelCard>
    );
    const accent = container.querySelector('span[aria-hidden="true"]');
    expect(accent).not.toBeNull();
  });
});
