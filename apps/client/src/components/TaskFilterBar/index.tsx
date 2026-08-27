import type { ChangeEvent } from 'react';
import type { Member } from '../../api/projectsApi';
import { COLUMNS } from '../KanbanBoard/config';
import styles from './TaskFilterBar.module.scss';

export interface TaskFiltersState {
  status: string;
  priority: string;
  assigneeId: string;
  search: string;
}

interface TaskFilterBarProps {
  filters: TaskFiltersState;
  members: Member[];
  onChange: (filters: TaskFiltersState) => void;
}

export function TaskFilterBar({ filters, members, onChange }: TaskFilterBarProps) {
  const update =
    (field: keyof TaskFiltersState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...filters, [field]: e.target.value });

  return (
    <div className={styles.bar}>
      <input
        type="search"
        className={styles.search}
        placeholder="Поиск задач"
        aria-label="Поиск задач"
        value={filters.search}
        onChange={update('search')}
      />
      <select
        className={styles.select}
        aria-label="Фильтр по статусу"
        value={filters.status}
        onChange={update('status')}
      >
        <option value="">Все статусы</option>
        {COLUMNS.map((column) => (
          <option key={column.status} value={column.status}>
            {column.label}
          </option>
        ))}
      </select>
      <select
        className={styles.select}
        aria-label="Фильтр по приоритету"
        value={filters.priority}
        onChange={update('priority')}
      >
        <option value="">Все приоритеты</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select
        className={styles.select}
        aria-label="Фильтр по исполнителю"
        value={filters.assigneeId}
        onChange={update('assigneeId')}
      >
        <option value="">Все исполнители</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.email}
          </option>
        ))}
      </select>
    </div>
  );
}
