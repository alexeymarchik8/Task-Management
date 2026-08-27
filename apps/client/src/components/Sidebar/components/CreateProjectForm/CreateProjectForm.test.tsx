import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProjectForm } from './index';
import * as projectsApi from '../../../../api/projectsApi';
import { ApiError } from '../../../../api/authApi';

vi.mock('../../../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../../../api/projectsApi');
  return { ...actual, createProject: vi.fn() };
});

describe('CreateProjectForm', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.createProject).mockReset();
  });

  test('creates a project and clears the input on success', async () => {
    vi.mocked(projectsApi.createProject).mockResolvedValue({
      id: 'p1',
      name: 'New project',
      code: 'AAAAAAAA',
      ownerId: '1',
      createdAt: '2026-01-01',
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<CreateProjectForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText('Название проекта'), 'New project');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ name: 'New project' })),
    );
    expect(projectsApi.createProject).toHaveBeenCalledWith({ name: 'New project' });
    expect(screen.getByLabelText('Название проекта')).toHaveValue('');
  });

  test('shows the server error message when creation fails', async () => {
    vi.mocked(projectsApi.createProject).mockRejectedValue(
      new ApiError(400, 'Название обязательно'),
    );
    const user = userEvent.setup();

    render(<CreateProjectForm onSuccess={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Название обязательно');
  });

  test('disables the submit button while submitting', async () => {
    let resolvePromise: (value: projectsApi.Project) => void = () => {};
    vi.mocked(projectsApi.createProject).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<CreateProjectForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText('Название проекта'), 'New project');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
    resolvePromise({
      id: 'p1',
      name: 'New project',
      code: 'AAAAAAAA',
      ownerId: '1',
      createdAt: '2026-01-01',
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Создать' })).not.toBeDisabled());
  });
});
