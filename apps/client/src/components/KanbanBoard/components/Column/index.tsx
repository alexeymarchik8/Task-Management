import type { Task } from '../../../../api/tasksApi';
import type { ColumnConfig } from '../../config';
import { TaskCard } from '../TaskCard';
import styles from './Column.module.scss';

interface ColumnProps {
  column: ColumnConfig;
  tasks: Task[];
}

export function Column({ column, tasks }: ColumnProps) {
  return (
    <section className={styles.column} aria-label={column.label}>
      <header className={styles.header}>
        <h2 className={styles.title}>{column.label}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </header>
      <div className={styles.cards}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
