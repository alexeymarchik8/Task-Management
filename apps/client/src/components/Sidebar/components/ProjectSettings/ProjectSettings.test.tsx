import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSettings } from './index';
import * as projectsApi from '../../../../api/projectsApi';
import type { Project } from '../../../../api/projectsApi';

vi.mock('../../../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../../../api/projectsApi');
  return {
    ...actual,
    listMembers: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    leaveProject: vi.fn(),
    removeMember: vi.fn(),
  };
});

const project: Project = {
  id: 'p1',
  name: 'My Project',
  code: 'AAAAAAAA',
  ownerId: 'owner-id',
  createdAt: '2026-01-01',
};

describe('ProjectSettings', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.listMembers)
      .mockReset()
      .mockResolvedValue([
        { userId: 'owner-id', email: 'owner@example.com', role: 'owner' },
        { userId: 'member-id', email: 'member@example.com', role: 'member' },
      ]);
    vi.mocked(projectsApi.updateProject).mockReset();
    vi.mocked(projectsApi.deleteProject).mockReset();
    vi.mocked(projectsApi.leaveProject).mockReset();
    vi.mocked(projectsApi.removeMember).mockReset();
  });

  test('renders nothing without an open project', () => {
    const { container } = render(
      <ProjectSettings
        project={undefined}
        currentUserId="owner-id"
        onRenamed={vi.fn()}
        onLeftOrDeleted={vi.fn()}
        onMembersChanged={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('owner can rename the project', async () => {
    vi.mocked(projectsApi.updateProject).mockResolvedValue({ ...project, name: 'New name' });
    const onRenamed = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectSettings
        project={project}
        currentUserId="owner-id"
        onRenamed={onRenamed}
        onLeftOrDeleted={vi.fn()}
        onMembersChanged={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Настройки' }));

    const nameInput = screen.getByLabelText('Новое название проекта');
    await user.clear(nameInput);
    await user.type(nameInput, 'New name');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() =>
      expect(projectsApi.updateProject).toHaveBeenCalledWith('p1', { name: 'New name' }),
    );
    expect(onRenamed).toHaveBeenCalledWith({ ...project, name: 'New name' });
  });

  test('owner sees other members with a remove button and can remove one after confirming', async () => {
    vi.mocked(projectsApi.removeMember).mockResolvedValue({ userId: 'member-id' });
    const onMembersChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectSettings
        project={project}
        currentUserId="owner-id"
        onRenamed={vi.fn()}
        onLeftOrDeleted={vi.fn()}
        onMembersChanged={onMembersChanged}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Настройки' }));
    await waitFor(() => expect(screen.getByText('member@example.com')).toBeInTheDocument());

    expect(screen.queryByText('owner@example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Удалить участника member@example.com' }));
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => expect(projectsApi.removeMember).toHaveBeenCalledWith('p1', 'member-id'));
    expect(onMembersChanged).toHaveBeenCalled();
  });

  test('owner sees a delete-project button that requires confirmation', async () => {
    vi.mocked(projectsApi.deleteProject).mockResolvedValue({ id: 'p1' });
    const onLeftOrDeleted = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectSettings
        project={project}
        currentUserId="owner-id"
        onRenamed={vi.fn()}
        onLeftOrDeleted={onLeftOrDeleted}
        onMembersChanged={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Настройки' }));
    await user.click(screen.getByRole('button', { name: 'Удалить проект' }));

    expect(projectsApi.deleteProject).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => expect(projectsApi.deleteProject).toHaveBeenCalledWith('p1'));
    expect(onLeftOrDeleted).toHaveBeenCalled();
  });

  test('non-owner sees a leave-project button instead of rename/remove controls', async () => {
    vi.mocked(projectsApi.leaveProject).mockResolvedValue({ userId: 'member-id' });
    const onLeftOrDeleted = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectSettings
        project={project}
        currentUserId="member-id"
        onRenamed={vi.fn()}
        onLeftOrDeleted={onLeftOrDeleted}
        onMembersChanged={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Настройки' }));

    expect(screen.queryByLabelText('Новое название проекта')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Удалить проект' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Выйти из проекта' }));
    await user.click(screen.getByRole('button', { name: 'Выйти' }));

    await waitFor(() => expect(projectsApi.leaveProject).toHaveBeenCalledWith('p1'));
    expect(onLeftOrDeleted).toHaveBeenCalled();
  });

  test('cancelling the confirm dialog does not call the API', async () => {
    const user = userEvent.setup();

    render(
      <ProjectSettings
        project={project}
        currentUserId="owner-id"
        onRenamed={vi.fn()}
        onLeftOrDeleted={vi.fn()}
        onMembersChanged={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Настройки' }));
    await user.click(screen.getByRole('button', { name: 'Удалить проект' }));
    await user.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(projectsApi.deleteProject).not.toHaveBeenCalled();
  });
});
