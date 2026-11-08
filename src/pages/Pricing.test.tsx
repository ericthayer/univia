import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../test/renderWithTheme';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', tier: 'basic' },
  }),
}));

import Pricing from './Pricing';

function renderPricing() {
  return renderWithTheme(
    <MemoryRouter>
      <Pricing />
    </MemoryRouter>
  );
}

function planCard(name: string): HTMLElement {
  const card = screen.getByRole('heading', { level: 2, name }).closest('article');
  if (!card) throw new Error(`No card for ${name}`);
  return card;
}

describe('Pricing', () => {
  afterEach(() => vi.restoreAllMocks());

  it('explains that Monitor is not on sale yet, without a browser alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderPricing();

    const monitor = planCard('Monitor');
    const status = within(monitor).getByRole('status');
    expect(status).toBeEmptyDOMElement();

    await user.click(within(monitor).getByRole('button', { name: /upgrade/i }));

    expect(status).toHaveTextContent("Monitor isn't on sale yet.");
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('sends Agency enquiries to the contact address', () => {
    renderPricing();

    const link = within(planCard('Agency')).getByRole('link', { name: /contact us/i });
    expect(link).toHaveAttribute('href', 'mailto:hello@univia.help?subject=Univia%20Agency');
  });

  it('lists only built features as available; the rest are marked coming soon', () => {
    renderPricing();

    const agency = planCard('Agency');
    const apiItem = within(agency).getByText(/API access and webhooks/).closest('li');
    expect(apiItem).toHaveTextContent('(coming soon)');
    expect(within(agency).queryByText(/Unlimited audits/)).not.toBeInTheDocument();

    const extraSites = within(planCard('Monitor')).getByText(/Extra sites/).closest('li');
    expect(extraSites).toHaveTextContent('(coming soon)');
  });
});
