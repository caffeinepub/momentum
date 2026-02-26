// Drag payload utilities for task and routine drag-and-drop
// Uses MIME types to distinguish between task and routine payloads

const TASK_MIME_TYPE = 'application/x-task-payload';
const ROUTINE_MIME_TYPE = 'application/x-routine-id';

export interface TaskDragPayload {
  type: 'task';
  taskId: number;
  listId: number;
  order: number;
}

export function writeTaskDragPayload(
  dataTransfer: DataTransfer,
  payload: TaskDragPayload
): void {
  dataTransfer.effectAllowed = 'move';
  dataTransfer.setData(TASK_MIME_TYPE, JSON.stringify(payload));
  // Also set as text for fallback
  dataTransfer.setData('text/plain', JSON.stringify(payload));
}

export function readTaskDragPayload(
  dataTransfer: DataTransfer
): TaskDragPayload | null {
  try {
    const raw =
      dataTransfer.getData(TASK_MIME_TYPE) ||
      dataTransfer.getData('text/plain');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.type === 'task') {
      return parsed as TaskDragPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function isTaskDragEvent(dataTransfer: DataTransfer): boolean {
  return (
    dataTransfer.types.includes(TASK_MIME_TYPE) ||
    (() => {
      try {
        const raw = dataTransfer.getData('text/plain');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return parsed && parsed.type === 'task';
      } catch {
        return false;
      }
    })()
  );
}

export function writeRoutineDragPayload(
  dataTransfer: DataTransfer,
  routineId: number
): void {
  dataTransfer.effectAllowed = 'move';
  dataTransfer.setData(ROUTINE_MIME_TYPE, String(routineId));
}

export function readRoutineDragPayload(
  dataTransfer: DataTransfer
): number | null {
  const raw = dataTransfer.getData(ROUTINE_MIME_TYPE);
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}
