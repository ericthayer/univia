import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
  }),
}));

import InlineDocumentUpload from './InlineDocumentUpload';

describe('InlineDocumentUpload advanced options menu', () => {
  it('closes advanced options when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Outside action</button>
        <InlineDocumentUpload onUploadComplete={vi.fn()} />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /advanced options/i }));
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /outside action/i, hidden: true }));

    await waitFor(() => {
      expect(screen.queryByText('Advanced Options')).not.toBeInTheDocument();
    });
  });

  it('closes advanced options when trigger is clicked again', async () => {
    const user = userEvent.setup();

    render(<InlineDocumentUpload onUploadComplete={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /advanced options/i });

    await user.click(trigger);
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Advanced Options')).not.toBeInTheDocument();
    });
  });
});
