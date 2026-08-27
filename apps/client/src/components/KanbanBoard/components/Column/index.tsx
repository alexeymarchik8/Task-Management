import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../../../../api/tasksApi';
import type { Member } from '../../../../api/projectsApi';
import type { ColumnConfig } from '../../config';
import { TaskCard } from '../TaskCard';
import styles from './Column.module.scss';

interface ColumnProps {
  column: ColumnConfig;
  tasks: Task[];
  members?: Member[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function Column({ column, tasks, members, onStatusChange, onEdit, onDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <section
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.over : ''}`}
      aria-label={column.label}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{column.label}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </header>
      <div className={styles.cards}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            onStatusChange={(status) => onStatusChange(task.id, status)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
