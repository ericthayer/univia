import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { PageRow } from './PageRow';

const PAGE = { id: 'p1', url: 'https://shop.example.com/pricing', created_at: '2026-11-15T00:00:00Z' };

function setup(canRemove = true) {
  const onRemove = vi.fn();
  renderWithTheme(
    <table>
      <tbody>
        <PageRow page={PAGE} result={undefined} openIssues={2} canRemove={canRemove} disabled={false} onRemove={onRemove} />
      </tbody>
    </table>,
  );
  return { onRemove, user: userEvent.setup() };
}

describe('PageRow', () => {
  it('needs a second press to remove, and Keep returns focus', async () => {
    const { onRemove, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Remove /pricing' }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm remove /pricing' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.getByRole('button', { name: 'Remove /pricing' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Remove /pricing' }));
    await user.click(screen.getByRole('button', { name: 'Confirm remove /pricing' }));
    expect(onRemove).toHaveBeenCalledWith('p1');
  });

  it('cannot remove the last page', () => {
    setup(false);
    expect(screen.getByRole('button', { name: 'Remove /pricing' })).toBeDisabled();
  });
});
