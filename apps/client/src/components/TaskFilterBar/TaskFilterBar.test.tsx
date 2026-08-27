import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFilterBar, type TaskFiltersState } from './index';
import type { Member } from '../../api/projectsApi';

const members: Member[] = [
  { userId: 'user-1', email: 'owner@example.com', role: 'owner' },
  { userId: 'user-2', email: 'member@example.com', role: 'member' },
];

const emptyFilters: TaskFiltersState = { status: '', priority: '', assigneeId: '', search: '' };

describe('TaskFilterBar', () => {
  test('renders member options in the assignee filter', () => {
    render(<TaskFilterBar filters={emptyFilters} members={members} onChange={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'owner@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'member@example.com' })).toBeInTheDocument();
  });

  test('typing in the search field calls onChange with the updated search value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskFilterBar filters={emptyFilters} members={members} onChange={onChange} />);
    await user.type(screen.getByLabelText('Поиск задач'), 'a');

    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, search: 'a' });
  });

  test('selecting a status calls onChange with the updated status', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskFilterBar filters={emptyFilters} members={members} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText('Фильтр по статусу'), 'todo');

    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, status: 'todo' });
  });

  test('selecting a priority calls onChange with the updated priority', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskFilterBar filters={emptyFilters} members={members} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText('Фильтр по приоритету'), 'high');

    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, priority: 'high' });
  });

  test('selecting an assignee calls onChange with the updated assigneeId', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskFilterBar filters={emptyFilters} members={members} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText('Фильтр по исполнителю'), 'user-2');

    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, assigneeId: 'user-2' });
  });

  test('reflects the current filter values', () => {
    const filters: TaskFiltersState = {
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-2',
      search: 'report',
    };

    render(<TaskFilterBar filters={filters} members={members} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Поиск задач')).toHaveValue('report');
    expect(screen.getByLabelText('Фильтр по статусу')).toHaveValue('todo');
    expect(screen.getByLabelText('Фильтр по приоритету')).toHaveValue('high');
    expect(screen.getByLabelText('Фильтр по исполнителю')).toHaveValue('user-2');
  });
});
