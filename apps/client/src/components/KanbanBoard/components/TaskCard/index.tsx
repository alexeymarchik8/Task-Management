import type { ChangeEvent } from 'react';
import type { Task, TaskStatus } from '../../../../api/tasksApi';
import { COLUMNS } from '../../config';
import styles from './TaskCard.module.scss';

interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{task.title}</h3>
        <button
          type="button"
          className={styles.deleteButton}
          aria-label="Удалить задачу"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      {task.description && <p className={styles.description}>{task.description}</p>}
      <div className={styles.meta}>
        <span className={`${styles.priority} ${styles[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.dueDate && (
          <span className={styles.dueDate}>{new Date(task.dueDate).toLocaleDateString()}</span>
        )}
      </div>
      <div className={styles.actions}>
        <label className={styles.statusLabel} htmlFor={`status-${task.id}`}>
          Статус
        </label>
        <select
          id={`status-${task.id}`}
          className={styles.statusSelect}
          value={task.status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onStatusChange(e.target.value as TaskStatus)
          }
        >
          {COLUMNS.map((column) => (
            <option key={column.status} value={column.status}>
              {column.label}
            </option>
          ))}
        </select>
        <button type="button" className={styles.editButton} onClick={onEdit}>
          Изменить
        </button>
      </div>
    </article>
  );
}
