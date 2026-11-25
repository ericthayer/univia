import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { MetricTile } from './MetricTile';
import { scoreStatus } from '../ScoreBar/scoreTone';

describe('MetricTile', () => {
  it('shows the status as text, not color alone', () => {
    renderWithTheme(<MetricTile label="Avg Accessibility" value="95%" tone="success" status="Good" />);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('omits the status pill when no status is given', () => {
    renderWithTheme(<MetricTile label="Total Audits" value={28} />);
    expect(screen.queryByText('Good')).not.toBeInTheDocument();
  });
});

describe('scoreStatus', () => {
  it('bands scores like Lighthouse', () => {
    expect(scoreStatus(95)).toBe('Good');
    expect(scoreStatus(90)).toBe('Good');
    expect(scoreStatus(83)).toBe('Needs work');
    expect(scoreStatus(69)).toBe('Poor');
  });
});
