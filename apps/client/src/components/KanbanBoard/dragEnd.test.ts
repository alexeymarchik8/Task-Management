import { describe, test, expect, vi } from 'vitest';
import type { DragEndEvent } from '@dnd-kit/core';
import { handleDragEnd } from './dragEnd';

function makeEvent(overId: string | null, activeId: string): DragEndEvent {
  return {
    active: { id: activeId, data: { current: undefined }, rect: {} as never },
    over: overId
      ? { id: overId, rect: {} as never, disabled: false, data: { current: undefined } }
      : null,
    delta: { x: 0, y: 0 },
    collisions: null,
    activatorEvent: {} as never,
  } as unknown as DragEndEvent;
}

describe('handleDragEnd', () => {
  test('calls onStatusChange with the task id and the column it was dropped on', () => {
    const onStatusChange = vi.fn();

    handleDragEnd(makeEvent('done', 'task-1'), onStatusChange);

    expect(onStatusChange).toHaveBeenCalledWith('task-1', 'done');
  });

  test('does nothing when dropped outside any column', () => {
    const onStatusChange = vi.fn();

    handleDragEnd(makeEvent(null, 'task-1'), onStatusChange);

    expect(onStatusChange).not.toHaveBeenCalled();
  });

  test('does nothing when dropped on an unrecognized droppable id', () => {
    const onStatusChange = vi.fn();

    handleDragEnd(makeEvent('not-a-status', 'task-1'), onStatusChange);

    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
