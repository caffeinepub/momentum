import React, { useState, useRef, useCallback } from 'react';
import { LocalTask, LocalList } from '@/lib/types';
import TaskCard from './TaskCard';
import { readTaskDragPayload, writeTaskDragPayload } from '@/utils/dragPayload';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface CustomListsProps {
  tasks: LocalTask[];
  lists: LocalList[];
  onToggleComplete: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  editTaskId: string | null;
  setEditTaskId: (id: string | null) => void;
  onDeleteList?: (listId: string) => void;
  onUpdateTaskContainerAndPosition: (
    taskId: bigint,
    newContainerId: bigint,
    positionIndex: bigint
  ) => Promise<void>;
  onReorderTask?: (taskId: bigint, positionIndex: bigint) => Promise<void>;
}

interface DropState {
  containerId: number | null;
  insertIndex: number | null;
}

function calcNewOrder(tasks: LocalTask[], insertIndex: number): number {
  const sorted = [...tasks].sort((a, b) => Number(a.order) - Number(b.order));
  const n = sorted.length;
  if (n === 0) return 1000;
  if (insertIndex <= 0) {
    const first = Number(sorted[0].order);
    return first > 1 ? Math.floor(first / 2) : 1000;
  }
  if (insertIndex >= n) {
    return Number(sorted[n - 1].order) + 1000;
  }
  const before = Number(sorted[insertIndex - 1].order);
  const after = Number(sorted[insertIndex].order);
  return Math.floor((before + after) / 2);
}

const CustomLists: React.FC<CustomListsProps> = ({
  tasks,
  lists,
  onToggleComplete,
  onEditTask,
  editTaskId,
  setEditTaskId,
  onDeleteList,
  onUpdateTaskContainerAndPosition,
  onReorderTask,
}) => {
  const [dropState, setDropState] = useState<DropState>({ containerId: null, insertIndex: null });
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<LocalTask[] | null>(null);
  const dragPayloadRef = useRef<{ taskId: number; listId: number; order: number } | null>(null);

  const displayTasks = optimisticTasks ?? tasks;

  const customLists = lists.filter((l) => !l.quadrant);

  const getListTasks = useCallback(
    (listId: number) => {
      return [...displayTasks.filter((t) => Number(t.listId) === listId)].sort(
        (a, b) => Number(a.order) - Number(b.order)
      );
    },
    [displayTasks]
  );

  const handleDragStart = useCallback((e: React.DragEvent, task: LocalTask) => {
    setDraggingTaskId(Number(task.id));
    dragPayloadRef.current = {
      taskId: Number(task.id),
      listId: Number(task.listId),
      order: Number(task.order),
    };
    writeTaskDragPayload(e.dataTransfer, {
      type: 'task',
      taskId: Number(task.id),
      listId: Number(task.listId),
      order: Number(task.order),
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDropState({ containerId: null, insertIndex: null });
    dragPayloadRef.current = null;
  }, []);

  const handleContainerDragOver = useCallback(
    (e: React.DragEvent, listId: number, listTasks: LocalTask[]) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const container = e.currentTarget as HTMLElement;
      const mouseY = e.clientY;

      const cards = Array.from(container.querySelectorAll('[data-task-card]')) as HTMLElement[];
      let insertIndex = listTasks.length;

      for (let i = 0; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        const midY = cardRect.top + cardRect.height / 2;
        if (mouseY < midY) {
          insertIndex = i;
          break;
        }
      }

      setDropState({ containerId: listId, insertIndex });
    },
    []
  );

  const handleContainerDragLeave = useCallback((e: React.DragEvent) => {
    const container = e.currentTarget as HTMLElement;
    if (!container.contains(e.relatedTarget as Node)) {
      setDropState({ containerId: null, insertIndex: null });
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetListId: number) => {
      e.preventDefault();
      e.stopPropagation();

      const payload = readTaskDragPayload(e.dataTransfer);
      if (!payload) {
        setDropState({ containerId: null, insertIndex: null });
        return;
      }

      const { taskId } = payload;

      // Get current insert index
      const container = e.currentTarget as HTMLElement;
      const listTasks = getListTasks(targetListId);
      const cards = Array.from(container.querySelectorAll('[data-task-card]')) as HTMLElement[];
      let insertIndex = listTasks.length;

      for (let i = 0; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        const midY = cardRect.top + cardRect.height / 2;
        if (e.clientY < midY) {
          insertIndex = i;
          break;
        }
      }

      setDropState({ containerId: null, insertIndex: null });
      setDraggingTaskId(null);

      // Find the task being moved
      const movingTask = displayTasks.find((t) => Number(t.id) === taskId);
      if (!movingTask) return;

      // Build optimistic state
      const tasksWithoutMoved = displayTasks.filter((t) => Number(t.id) !== taskId);
      const targetTasks = tasksWithoutMoved
        .filter((t) => Number(t.listId) === targetListId)
        .sort((a, b) => Number(a.order) - Number(b.order));

      const newOrder = calcNewOrder(targetTasks, insertIndex);

      const updatedTask: LocalTask = {
        ...movingTask,
        listId: BigInt(targetListId),
        order: BigInt(newOrder),
      };

      const newOptimistic = [...tasksWithoutMoved, updatedTask];
      setOptimisticTasks(newOptimistic);

      const actualPositionIndex = Math.min(insertIndex, targetTasks.length);

      try {
        await onUpdateTaskContainerAndPosition(
          BigInt(taskId),
          BigInt(targetListId),
          BigInt(actualPositionIndex)
        );
        setOptimisticTasks(null);
      } catch (err) {
        setOptimisticTasks(null);
        toast.error('Failed to move task. Please try again.');
      }
    },
    [displayTasks, getListTasks, onUpdateTaskContainerAndPosition]
  );

  if (customLists.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {customLists.map((list) => {
        const listId = Number(list.id);
        const listTasks = getListTasks(listId);
        const isDropTarget = dropState.containerId === listId;

        return (
          <div
            key={list.localId}
            className={`
              flex-shrink-0 w-64 rounded-xl border border-border/50 bg-card/60 p-3
              transition-all duration-150
              ${isDropTarget ? 'ring-2 ring-primary/40 border-primary/40' : ''}
            `}
          >
            {/* List header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground/80 truncate">{list.name}</h3>
              {onDeleteList && (
                <button
                  onClick={() => onDeleteList(list.localId)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
                  title="Delete list"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Task list with drop zone */}
            <div
              className="space-y-1 min-h-[60px]"
              data-container-id={listId}
              onDragOver={(e) => handleContainerDragOver(e, listId, listTasks)}
              onDragLeave={handleContainerDragLeave}
              onDrop={(e) => handleDrop(e, listId)}
            >
              {listTasks.map((task, index) => {
                const showIndicatorAbove =
                  isDropTarget &&
                  dropState.insertIndex === index &&
                  Number(task.id) !== draggingTaskId;

                return (
                  <div key={task.localId} data-task-card>
                    {showIndicatorAbove && <div className="drop-indicator" />}
                    <TaskCard
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEditTask={onEditTask}
                      editTaskId={editTaskId}
                      setEditTaskId={setEditTaskId}
                      isDragEnabled={true}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                );
              })}

              {/* Drop indicator at end */}
              {isDropTarget &&
                dropState.insertIndex === listTasks.length &&
                listTasks.length > 0 && (
                  <div className="drop-indicator" />
                )}

              {/* Empty state */}
              {listTasks.length === 0 && (
                <div
                  className={`
                    text-center py-4 text-xs text-muted-foreground/50 rounded-lg border border-dashed border-border/30
                    transition-all duration-150
                    ${isDropTarget ? 'border-primary/40 bg-primary/5 text-primary/50' : ''}
                  `}
                >
                  {isDropTarget ? 'Drop here' : 'No tasks'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CustomLists;
