import type { Task } from '../../../../api/tasksApi';
import styles from './TaskCard.module.scss';

interface TaskCardProps {
  task: Task;
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{task.title}</h3>
      {task.description && <p className={styles.description}>{task.description}</p>}
      <div className={styles.meta}>
        <span className={`${styles.priority} ${styles[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.dueDate && (
          <span className={styles.dueDate}>{new Date(task.dueDate).toLocaleDateString()}</span>
        )}
      </div>
    </article>
  );
}
