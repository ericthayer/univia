import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { ScoreStrip } from './ScoreStrip';

describe('ScoreStrip', () => {
  it('renders four definition pairs with full names for assistive tech', () => {
    renderWithTheme(
      <ScoreStrip scores={{ performance: 87, accessibility: 96, bestPractices: 100, seo: 59 }} />
    );
    const terms = screen.getAllByRole('term');
    expect(terms).toHaveLength(4);
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Best Practices')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('59')).toBeInTheDocument();
  });

  it('treats missing scores as zero', () => {
    renderWithTheme(<ScoreStrip scores={{ performance: null }} />);
    const definitions = screen.getAllByRole('definition');
    expect(definitions).toHaveLength(4);
    definitions.forEach((dd) => expect(dd).toHaveTextContent('0'));
  });
});
