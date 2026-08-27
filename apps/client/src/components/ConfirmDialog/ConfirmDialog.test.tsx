import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './index';

describe('ConfirmDialog', () => {
  test('renders the message and confirm label', () => {
    render(
      <ConfirmDialog
        message="Удалить проект?"
        confirmLabel="Удалить"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('Удалить проект?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  test('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        message="Удалить проект?"
        confirmLabel="Удалить"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(onConfirm).toHaveBeenCalled();
  });

  test('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        message="Удалить проект?"
        confirmLabel="Удалить"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
