import React, { useState, useRef, useCallback } from 'react';
import { Check, Pencil, X, GripVertical } from 'lucide-react';
import { LocalTask } from '@/lib/types';
import { writeTaskDragPayload } from '@/utils/dragPayload';

interface TaskCardProps {
  task: LocalTask;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  editTaskId: string | null;
  setEditTaskId: (id: string | null) => void;
  isDragEnabled?: boolean;
  onDragStart?: (e: React.DragEvent, task: LocalTask) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

// Drop indicator position: 'above' | 'below' | null
type DropPosition = 'above' | 'below' | null;

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEditTask,
  editTaskId,
  setEditTaskId,
  isDragEnabled = true,
  onDragStart,
  onDragEnd,
}) => {
  const isEditing = editTaskId === task.localId;
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setEditTaskId(task.localId);
    }, 500);
  }, [task.localId, setEditTaskId]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      writeTaskDragPayload(e.dataTransfer, {
        type: 'task',
        taskId: Number(task.id),
        listId: Number(task.listId),
        order: Number(task.order),
      });
      if (onDragStart) onDragStart(e, task);
    },
    [task, onDragStart]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(false);
      setDropPosition(null);
      if (onDragEnd) onDragEnd(e);
    },
    [onDragEnd]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropPosition(e.clientY < midY ? 'above' : 'below');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the card entirely
    if (cardRef.current && !cardRef.current.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);
  }, []);

  const handleClick = useCallback(() => {
    if (!isEditing) {
      onToggleComplete(task.localId);
    }
  }, [isEditing, onToggleComplete, task.localId]);

  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEditTask(task.localId);
    },
    [onEditTask, task.localId]
  );

  const handleExitEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditTaskId(null);
    },
    [setEditTaskId]
  );

  const streakRangeClass = '';

  return (
    <div
      ref={cardRef}
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator above */}
      {dropPosition === 'above' && (
        <div className="drop-indicator" />
      )}

      <div
        draggable={isDragEnabled && !isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onClick={handleClick}
        className={`
          task-card group flex items-center gap-2 px-3 py-2 rounded-lg
          border border-border/50 bg-card/80 backdrop-blur-sm
          cursor-pointer select-none transition-all duration-150
          hover:border-border hover:bg-card
          ${task.completed ? 'opacity-60' : ''}
          ${isDragging ? 'opacity-40 scale-95' : ''}
          ${isEditing ? 'ring-1 ring-primary/50 border-primary/30' : ''}
          ${streakRangeClass}
        `}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Drag handle */}
        {isDragEnabled && (
          <div className="drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
            <GripVertical size={14} />
          </div>
        )}

        {/* Checkbox */}
        <div
          className={`
            flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center
            transition-all duration-150
            ${task.completed
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/40 hover:border-primary/60'
            }
          `}
        >
          {task.completed && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
        </div>

        {/* Task title */}
        <span
          className={`
            flex-1 text-sm leading-tight min-w-0 truncate
            ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}
          `}
        >
          {task.title}
        </span>

        {/* Long task indicator */}
        {task.isLongTask && (
          <span className="flex-shrink-0 text-xs text-muted-foreground/60">⏱</span>
        )}

        {/* Edit mode actions */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEditClick}
              className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
              title="Edit task"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={handleExitEdit}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Exit edit mode"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleEditClick}
            className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-150"
            title="Edit task"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      {/* Drop indicator below */}
      {dropPosition === 'below' && (
        <div className="drop-indicator" />
      )}
    </div>
  );
};

export default TaskCard;
