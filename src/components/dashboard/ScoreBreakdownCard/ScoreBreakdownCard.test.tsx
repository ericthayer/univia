import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { ScoreBreakdownCard } from './ScoreBreakdownCard';

const overall = { performance: 82, accessibility: 94, bestPractices: 100, seo: 97, count: 22 };
const desktop = { performance: 89, accessibility: 94, bestPractices: 100, seo: 97, count: 11 };
const mobile = { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, count: 0 };

describe('ScoreBreakdownCard', () => {
  it('shows the overall dataset by default and swaps to desktop on toggle', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ScoreBreakdownCard overall={overall} desktop={desktop} mobile={mobile} />);

    expect(screen.getByRole('progressbar', { name: 'Performance score' })).toHaveAttribute('aria-valuenow', '82');
    expect(screen.getByText('22 audits')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /desktop/i }));

    expect(screen.getByRole('progressbar', { name: 'Performance score' })).toHaveAttribute('aria-valuenow', '89');
    expect(screen.getByText('11 audits')).toBeInTheDocument();
  });

  it('disables a dataset with no audits', () => {
    renderWithTheme(<ScoreBreakdownCard overall={overall} desktop={desktop} mobile={mobile} />);
    expect(screen.getByRole('button', { name: /mobile/i })).toBeDisabled();
  });
});
