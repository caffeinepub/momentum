import React, { useState, useRef, useCallback } from 'react';
import { LocalTask, LocalList } from '@/lib/types';
import TaskCard from './TaskCard';
import { readTaskDragPayload, writeTaskDragPayload } from '@/utils/dragPayload';
import { toast } from 'sonner';

interface EisenhowerMatrixProps {
  tasks: LocalTask[];
  lists: LocalList[];
  onToggleComplete: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  editTaskId: string | null;
  setEditTaskId: (id: string | null) => void;
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

const QUADRANT_IDS = [1, 2, 3, 4];

const QUADRANT_LABELS: Record<number, { title: string; subtitle: string; color: string }> = {
  1: { title: 'Must Do', subtitle: 'Urgent & Important', color: 'border-red-500/30 bg-red-500/5' },
  2: { title: 'Should Do', subtitle: 'Important, Not Urgent', color: 'border-blue-500/30 bg-blue-500/5' },
  3: { title: 'Delegate', subtitle: 'Urgent, Not Important', color: 'border-yellow-500/30 bg-yellow-500/5' },
  4: { title: 'May Do', subtitle: 'Not Urgent or Important', color: 'border-green-500/30 bg-green-500/5' },
};

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

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  lists,
  onToggleComplete,
  onEditTask,
  editTaskId,
  setEditTaskId,
  onUpdateTaskContainerAndPosition,
  onReorderTask,
}) => {
  const [dropState, setDropState] = useState<DropState>({ containerId: null, insertIndex: null });
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<LocalTask[] | null>(null);
  const dragPayloadRef = useRef<{ taskId: number; listId: number; order: number } | null>(null);

  const displayTasks = optimisticTasks ?? tasks;

  const getQuadrantTasks = useCallback(
    (quadrantId: number) => {
      return [...displayTasks.filter((t) => Number(t.listId) === quadrantId)].sort(
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
    (e: React.DragEvent, quadrantId: number, quadrantTasks: LocalTask[]) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const container = e.currentTarget as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const mouseY = e.clientY;

      // Find insert index based on card positions
      const cards = Array.from(container.querySelectorAll('[data-task-card]')) as HTMLElement[];
      let insertIndex = quadrantTasks.length;

      for (let i = 0; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        const midY = cardRect.top + cardRect.height / 2;
        if (mouseY < midY) {
          insertIndex = i;
          break;
        }
      }

      setDropState({ containerId: quadrantId, insertIndex });
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
    async (e: React.DragEvent, targetQuadrantId: number) => {
      e.preventDefault();
      e.stopPropagation();

      const payload = readTaskDragPayload(e.dataTransfer);
      if (!payload) {
        setDropState({ containerId: null, insertIndex: null });
        return;
      }

      const { taskId, listId: sourceListId } = payload;
      const targetListId = targetQuadrantId;

      // Get current insert index
      const container = e.currentTarget as HTMLElement;
      const quadrantTasks = getQuadrantTasks(targetQuadrantId);
      const cards = Array.from(container.querySelectorAll('[data-task-card]')) as HTMLElement[];
      let insertIndex = quadrantTasks.length;

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

      // Determine actual position index in target container (excluding the moved task)
      const actualPositionIndex = Math.min(insertIndex, targetTasks.length);

      try {
        await onUpdateTaskContainerAndPosition(
          BigInt(taskId),
          BigInt(targetListId),
          BigInt(actualPositionIndex)
        );
        // On success, clear optimistic state (parent will refetch)
        setOptimisticTasks(null);
      } catch (err) {
        // Rollback
        setOptimisticTasks(null);
        toast.error('Failed to move task. Please try again.');
      }
    },
    [displayTasks, getQuadrantTasks, onUpdateTaskContainerAndPosition]
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {QUADRANT_IDS.map((quadrantId) => {
        const quadrantTasks = getQuadrantTasks(quadrantId);
        const label = QUADRANT_LABELS[quadrantId];
        const isDropTarget = dropState.containerId === quadrantId;

        return (
          <div
            key={quadrantId}
            className={`
              relative rounded-xl border p-3 min-h-[120px] transition-all duration-150
              ${label.color}
              ${isDropTarget ? 'ring-2 ring-primary/40 border-primary/40' : ''}
            `}
            onDragOver={(e) => handleContainerDragOver(e, quadrantId, quadrantTasks)}
            onDragLeave={handleContainerDragLeave}
            onDrop={(e) => handleDrop(e, quadrantId)}
          >
            {/* Quadrant header */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-foreground/80 leading-tight">{label.title}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label.subtitle}</p>
            </div>

            {/* Task list with drop indicators */}
            <div className="space-y-1" data-container-id={quadrantId}>
              {quadrantTasks.map((task, index) => {
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
                dropState.insertIndex === quadrantTasks.length &&
                quadrantTasks.length > 0 && (
                  <div className="drop-indicator" />
                )}

              {/* Empty state with drop indicator */}
              {quadrantTasks.length === 0 && (
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

export default EisenhowerMatrix;
