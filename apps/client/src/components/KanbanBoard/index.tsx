import type { Task } from '../../api/tasksApi';
import { COLUMNS } from './config';
import { Column } from './components/Column';
import styles from './KanbanBoard.module.scss';

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  return (
    <div className={styles.board}>
      {COLUMNS.map((column) => (
        <Column
          key={column.status}
          column={column}
          tasks={tasks.filter((task) => task.status === column.status)}
        />
      ))}
    </div>
  );
}
