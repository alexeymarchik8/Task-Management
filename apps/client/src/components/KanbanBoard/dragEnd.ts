import type { DragEndEvent } from '@dnd-kit/core';
import type { TaskStatus } from '../../api/tasksApi';
import { COLUMNS } from './config';

const VALID_STATUSES = new Set<string>(COLUMNS.map((column) => column.status));

export function handleDragEnd(
  event: DragEndEvent,
  onStatusChange: (taskId: string, status: TaskStatus) => void,
): void {
  const overId = event.over?.id;
  const activeId = event.active.id;

  if (typeof overId === 'string' && VALID_STATUSES.has(overId) && typeof activeId === 'string') {
    onStatusChange(activeId, overId as TaskStatus);
  }
}
