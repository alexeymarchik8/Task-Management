import type { ChangeEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../../../../api/tasksApi';
import type { Member } from '../../../../api/projectsApi';
import { COLUMNS } from '../../config';
import styles from './TaskCard.module.scss';

interface TaskCardProps {
  task: Task;
  members?: Member[];
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TaskCard({ task, members, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const assignee = members?.find((member) => member.userId === task.assigneeId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.top}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label="Перетащить задачу"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
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
        <span className={styles.assignee}>{assignee ? assignee.email : 'Не назначен'}</span>
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
