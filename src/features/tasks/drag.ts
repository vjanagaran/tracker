import type { DragEvent } from "react";

const TASK_DRAG_TYPE = "application/x-task-id";

/**
 * Native drag and drop moves a task between board columns and week days.
 * It needs a mouse, so every drag has a keyboard route as well: the status
 * menu on each task, and the edit form for its date.
 */
export function startTaskDrag(event: DragEvent, taskId: string) {
  event.dataTransfer.setData(TASK_DRAG_TYPE, taskId);
  event.dataTransfer.effectAllowed = "move";
}

export function isTaskDrag(event: DragEvent) {
  return event.dataTransfer.types.includes(TASK_DRAG_TYPE);
}

export function readTaskDrag(event: DragEvent): string | null {
  const id = event.dataTransfer.getData(TASK_DRAG_TYPE);
  return id || null;
}
