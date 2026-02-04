import type { Task, List, TaskId, ListId } from '@/backend';

// Extended types with local identifiers for React keys
export interface LocalTask extends Task {
  localId: string;
}

export interface LocalList extends List {
  localId: string;
}

// Helper functions to convert between backend and local types
export function toLocalTask(task: Task): LocalTask {
  return {
    ...task,
    localId: `task-${task.id.toString()}`,
  };
}

export function toLocalList(list: List): LocalList {
  return {
    ...list,
    localId: `list-${list.id.toString()}`,
  };
}

export function fromLocalTask(localTask: LocalTask): Task {
  const { localId, ...task } = localTask;
  return task;
}

export function fromLocalList(localList: LocalList): List {
  const { localId, ...list } = localList;
  return list;
}
