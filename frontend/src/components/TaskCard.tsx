import { memo, useRef, useCallback } from 'react';
import { GripVertical, Pencil, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { LocalTask } from '@/lib/types';

interface TaskCardProps {
  task: LocalTask;
  index: number;
  onDragStart: (e: React.DragEvent, task: LocalTask) => void;
  onDrop: (e: React.DragEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onTouchDrop?: (task: LocalTask, targetListId: bigint, targetIndex?: number) => void;
  isDragTarget?: boolean;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  // Shared edit mode state (lifted to parent) — uses string | null (localId)
  editTaskId: string | null;
  setEditTaskId: (id: string | null) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  index,
  onDragStart,
  onDrop,
  onEdit,
  onDelete,
  onToggleComplete,
  onTouchDrop,
  isDragTarget = false,
  onDragEnter,
  onDragLeave,
  editTaskId,
  setEditTaskId,
}: TaskCardProps) {
  const isEditMode = editTaskId === task.localId;
  const isDraggingRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggedTaskRef = useRef<LocalTask | null>(null);
  const isDraggingStateRef = useRef(false);

  const enterEditMode = useCallback(() => {
    setEditTaskId(task.localId);
  }, [setEditTaskId, task.localId]);

  const exitEditMode = useCallback(() => {
    setEditTaskId(null);
  }, [setEditTaskId]);

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) {
      isDraggingRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          enterEditMode();
        }
      }, 500);
      return;
    }

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    draggedTaskRef.current = task;
    isDraggingStateRef.current = true;
    e.preventDefault();
  }, [isEditMode, task, enterEditMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      isDraggingRef.current = true;
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      return;
    }

    if (!isEditMode || !draggedTaskRef.current || !touchStartPosRef.current) {
      return;
    }

    e.preventDefault();
  }, [isEditMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isEditMode || !draggedTaskRef.current || !isDraggingStateRef.current) {
      isDraggingStateRef.current = false;
      draggedTaskRef.current = null;
      touchStartPosRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropTarget) {
      const listElement = dropTarget.closest('[data-list-id]') as HTMLElement | null;

      if (listElement) {
        const targetListId = listElement.getAttribute('data-list-id');

        if (targetListId && onTouchDrop) {
          let targetIndex: number | undefined = undefined;
          const taskElement = dropTarget.closest('[data-task-index]') as HTMLElement | null;
          if (taskElement) {
            const indexStr = taskElement.getAttribute('data-task-index');
            if (indexStr) {
              targetIndex = parseInt(indexStr, 10);
            }
          }

          onTouchDrop(draggedTaskRef.current, BigInt(targetListId), targetIndex);
        }
      }
    }

    isDraggingStateRef.current = false;
    draggedTaskRef.current = null;
    touchStartPosRef.current = null;
  }, [isEditMode, onTouchDrop]);

  const handleMouseDown = useCallback(() => {
    if (!isEditMode) {
      isDraggingRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          enterEditMode();
        }
      }, 500);
    }
  }, [isEditMode, enterEditMode]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragEnter) {
      onDragEnter();
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragLeave) {
      onDragLeave();
    }
  };

  const handleDragStartWrapper = (e: React.DragEvent) => {
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    isDraggingRef.current = true;
    isDraggingStateRef.current = true;
    onDragStart(e, task);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    isDraggingStateRef.current = false;
  };

  const handleDropWrapper = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e);
  };

  const handleEditClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleExitEditMode = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    exitEditMode();
  };

  return (
    <div
      data-task-index={index}
      draggable={isEditMode}
      onDragStart={handleDragStartWrapper}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDropWrapper}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-lg border shadow-sm transition-all duration-300 ease-out hover:shadow-md w-full no-text-select overflow-hidden',
        isEditMode
          ? 'cursor-move bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/10 border-blue-200 dark:border-blue-800'
          : 'cursor-default bg-card',
        isDragTarget && 'bg-blue-100 dark:bg-blue-900/40 shadow-lg ring-2 ring-blue-400 dark:ring-blue-600',
        task.completed && !isEditMode && 'opacity-60',
        'py-2 px-2'
      )}
      style={{
        touchAction: isEditMode ? 'none' : 'auto',
      }}
    >
      {/* ✕ exit button — top-right corner, only in edit mode */}
      {isEditMode && (
        <button
          className="absolute top-0 right-0 z-10 flex items-center justify-center w-7 h-7 rounded-bl-lg bg-blue-200/80 dark:bg-blue-800/80 text-blue-700 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
          onClick={handleExitEditMode}
          onTouchEnd={handleExitEditMode}
          aria-label="Exit edit mode"
          style={{ minWidth: 28, minHeight: 28 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Normal mode: checkbox + title in single row */}
      {!isEditMode && (
        <div className="flex items-center gap-2 w-full">
          <Checkbox
            checked={task.completed}
            onCheckedChange={onToggleComplete}
            className="flex-shrink-0 ml-0.5"
          />

          <h4
            className={cn(
              'font-medium text-sm leading-tight transition-all duration-200 flex-1 min-w-0 truncate',
              task.completed && 'line-through text-muted-foreground',
              task.important && !task.completed && 'text-red-600 dark:text-red-400'
            )}
            title={task.title}
          >
            {task.title}
          </h4>

          {task.isLongTask && (
            <div className="flex-shrink-0">
              <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
          )}
        </div>
      )}

      {/* Edit mode: single-line row — drag icon | title | edit icon (no delete — moved to EditTaskDialog) */}
      {isEditMode && (
        <div className="flex items-center gap-1.5 w-full pr-7">
          {/* 1. Drag icon on the far left */}
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          {/* 2. Task title — flex-1, truncated */}
          <h4
            className={cn(
              'flex-1 min-w-0 font-medium text-sm leading-tight truncate',
              task.important && 'text-red-600 dark:text-red-400'
            )}
            title={task.title}
          >
            {task.title}
          </h4>

          {task.isLongTask && (
            <div className="flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            </div>
          )}

          {/* 3. Edit icon */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/40"
            onClick={handleEditClick}
            onTouchEnd={handleEditClick}
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.urgent === nextProps.task.urgent &&
    prevProps.task.important === nextProps.task.important &&
    prevProps.task.isLongTask === nextProps.task.isLongTask &&
    prevProps.task.weight === nextProps.task.weight &&
    prevProps.task.listId === nextProps.task.listId &&
    prevProps.task.order === nextProps.task.order &&
    prevProps.index === nextProps.index &&
    prevProps.isDragTarget === nextProps.isDragTarget &&
    prevProps.editTaskId === nextProps.editTaskId
  );
});

export default TaskCard;
