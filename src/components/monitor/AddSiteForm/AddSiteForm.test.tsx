import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/monitor.service', () => ({ createSite: vi.fn() }));

import { createSite } from '../../../services/monitor.service';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AddSiteForm } from './AddSiteForm';

const create = vi.mocked(createSite);

describe('AddSiteForm', () => {
  beforeEach(() => create.mockReset());

  it('focuses the first invalid field and does not submit', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AddSiteForm onCreated={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /add site/i }));
    expect(screen.getByLabelText(/site name/i)).toHaveFocus();
    expect(screen.getByText('Give the site a name.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('always includes the home page and normalizes the address', async () => {
    create.mockResolvedValueOnce({ ok: true, value: 'site-1' });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<AddSiteForm onCreated={onCreated} />);
    await user.type(screen.getByLabelText(/site name/i), 'Shop');
    await user.type(screen.getByLabelText(/website address/i), 'Shop.Example.com');
    await user.type(screen.getByLabelText(/more pages/i), '/pricing');
    await user.click(screen.getByRole('button', { name: /add site/i }));
    expect(create).toHaveBeenCalledWith('Shop', 'https://shop.example.com', [
      'https://shop.example.com/',
      'https://shop.example.com/pricing',
    ]);
    expect(onCreated).toHaveBeenCalledWith('site-1');
  });

  it('shows the server message when creation fails', async () => {
    create.mockResolvedValueOnce({ ok: false, message: 'Your plan includes one site.' });
    const user = userEvent.setup();
    renderWithTheme(<AddSiteForm onCreated={vi.fn()} />);
    await user.type(screen.getByLabelText(/site name/i), 'Shop');
    await user.type(screen.getByLabelText(/website address/i), 'shop.example.com');
    await user.click(screen.getByRole('button', { name: /add site/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your plan includes one site.');
  });
});
