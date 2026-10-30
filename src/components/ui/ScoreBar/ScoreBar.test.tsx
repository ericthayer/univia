import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { ScoreBar } from './ScoreBar';
import { clampScore, scoreTone } from './scoreTone';

describe('scoreTone', () => {
  it('bands scores by value', () => {
    expect(scoreTone(100)).toBe('success');
    expect(scoreTone(90)).toBe('success');
    expect(scoreTone(89)).toBe('warning');
    expect(scoreTone(70)).toBe('warning');
    expect(scoreTone(69)).toBe('error');
    expect(scoreTone(0)).toBe('error');
  });

  it('clamps and rounds', () => {
    expect(clampScore(120)).toBe(100);
    expect(clampScore(-4)).toBe(0);
    expect(clampScore(83.6)).toBe(84);
    expect(clampScore(Number.NaN)).toBe(0);
  });
});

describe('ScoreBar', () => {
  it('exposes an accessible progressbar with the value', () => {
    renderWithTheme(<ScoreBar label="Accessibility" value={94} />);
    const bar = screen.getByRole('progressbar', { name: 'Accessibility score' });
    expect(bar).toHaveAttribute('aria-valuenow', '94');
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('clamps out-of-range values', () => {
    renderWithTheme(<ScoreBar label="Performance" value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
