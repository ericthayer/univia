import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import ViolationCard from '../ViolationCard';
import type { Violation } from '../../../types';

const violation: Violation = {
  id: 'v1',
  audit_id: 'a1',
  wcag_guideline: 'image-alt',
  severity: 'critical',
  title: 'Image elements do not have [alt] attributes',
  description: 'Informative elements should aim for short text. [Learn more about the alt attribute](https://developer.chrome.com/docs/lighthouse/accessibility/image-alt/)',
  remediation_steps: ['Element: <img src="hero.jpg">'],
  created_at: '2026-11-01T00:00:00Z',
};

describe('ViolationCard fix guide', () => {
  it('shows the real WCAG criterion and a plain summary instead of the rule id', () => {
    renderWithTheme(<ul><ViolationCard violation={violation} /></ul>);
    expect(screen.getByText('WCAG 1.1.1')).toBeInTheDocument();
    expect(screen.getByText('Level A')).toBeInTheDocument();
    expect(screen.queryByText(/WCAG image-alt/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\]\(https/)).not.toBeInTheDocument();
  });

  it('expands into steps, instances, and real links', async () => {
    renderWithTheme(<ul><ViolationCard violation={violation} /></ul>);
    const toggle = screen.getByRole('button', { name: /show how to fix/i });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'How to fix' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Where we found it (1)' })).toBeInTheDocument();
    expect(screen.getByText('<img src="hero.jpg">')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Lighthouse guide/ });
    expect(link).toHaveAttribute('href', 'https://developer.chrome.com/docs/lighthouse/accessibility/image-alt/');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
