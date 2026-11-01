import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { MetricTile } from './MetricTile';

describe('MetricTile', () => {
  it('renders label, value and support copy', () => {
    renderWithTheme(<MetricTile label="Total Audits" value={22} support="Audits completed" />);
    expect(screen.getByText('Total Audits')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('Audits completed')).toBeInTheDocument();
  });

  it('shows a skeleton instead of the numeral while loading', () => {
    renderWithTheme(<MetricTile label="Active Users" value={5} loading />);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });
});
