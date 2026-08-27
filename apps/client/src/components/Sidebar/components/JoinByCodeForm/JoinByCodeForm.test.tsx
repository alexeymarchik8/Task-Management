import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinByCodeForm } from './index';
import * as joinRequestsApi from '../../../../api/joinRequestsApi';
import { ApiError } from '../../../../api/authApi';

vi.mock('../../../../api/joinRequestsApi', async () => {
  const actual = await vi.importActual<typeof joinRequestsApi>('../../../../api/joinRequestsApi');
  return { ...actual, joinProject: vi.fn() };
});

describe('JoinByCodeForm', () => {
  beforeEach(() => {
    vi.mocked(joinRequestsApi.joinProject).mockReset();
  });

  test('submits the code and clears the input on success', async () => {
    vi.mocked(joinRequestsApi.joinProject).mockResolvedValue({
      id: 'jr1',
      userId: '1',
      projectId: 'p1',
      status: 'pending',
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<JoinByCodeForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText('Код проекта'), 'AAAAAAAA');
    await user.click(screen.getByRole('button', { name: 'Вступить' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'jr1' })),
    );
    expect(joinRequestsApi.joinProject).toHaveBeenCalledWith('AAAAAAAA');
    expect(screen.getByLabelText('Код проекта')).toHaveValue('');
  });

  test('shows the server error message when joining fails', async () => {
    vi.mocked(joinRequestsApi.joinProject).mockRejectedValue(new ApiError(404, 'Проект не найден'));
    const user = userEvent.setup();

    render(<JoinByCodeForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText('Код проекта'), 'ZZZZZZZZ');
    await user.click(screen.getByRole('button', { name: 'Вступить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Проект не найден');
  });
});
