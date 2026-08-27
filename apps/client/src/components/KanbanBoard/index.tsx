import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../../api/tasksApi';
import type { Member } from '../../api/projectsApi';
import { COLUMNS } from './config';
import { Column } from './components/Column';
import { handleDragEnd } from './dragEnd';
import styles from './KanbanBoard.module.scss';

interface KanbanBoardProps {
  tasks: Task[];
  members?: Member[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function KanbanBoard({
  tasks,
  members,
  onStatusChange,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (event: DragEndEvent) => handleDragEnd(event, onStatusChange);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className={styles.board}>
        {COLUMNS.map((column) => (
          <Column
            key={column.status}
            column={column}
            tasks={tasks.filter((task) => task.status === column.status)}
            members={members}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
