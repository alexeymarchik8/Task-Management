import type { TaskStatus } from '../../api/tasksApi';

export interface ColumnConfig {
  status: TaskStatus;
  label: string;
}

export const COLUMNS: ColumnConfig[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'in_review', label: 'In Review' },
  { status: 'done', label: 'Done' },
];
