import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import LanguageSwitcher from './LanguageSwitcher';

describe('LanguageSwitcher interactions', () => {
  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Outside action</button>
        <LanguageSwitcher />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /english/i }));
    expect(screen.getByText('Spanish')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /outside action/i, hidden: true }));

    await waitFor(() => {
      expect(screen.queryByText('Spanish')).not.toBeInTheDocument();
    });
  });

  it('applies selected language and closes', async () => {
    const user = userEvent.setup();

    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /english/i }));
    await user.click(screen.getByText('German'));

    await waitFor(() => {
      expect(screen.queryByText('Spanish')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /german/i })).toBeInTheDocument();
  });
});
