import type { Task, TaskStatus } from '../../api/tasksApi';
import { COLUMNS } from './config';
import { Column } from './components/Column';
import styles from './KanbanBoard.module.scss';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  return (
    <div className={styles.board}>
      {COLUMNS.map((column) => (
        <Column
          key={column.status}
          column={column}
          tasks={tasks.filter((task) => task.status === column.status)}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
