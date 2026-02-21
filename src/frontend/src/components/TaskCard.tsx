import { memo, useState, useRef, useCallback } from 'react';
import { GripVertical, Pencil, Trash2, Minus, Clock } from 'lucide-react';
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
}: TaskCardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggedTaskRef = useRef<LocalTask | null>(null);

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) {
      // Long press detection for entering edit mode
      isDraggingRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setIsEditMode(true);
        }
      }, 500);
      return;
    }

    // In edit mode: start drag operation immediately
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    draggedTaskRef.current = task;
    
    // Start visual drag feedback immediately
    setIsDragging(true);
    
    // Prevent default to stop scrolling during drag
    e.preventDefault();
  }, [isEditMode, task]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      // Cancel long press if user moves finger
      isDraggingRef.current = true;
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      return;
    }

    if (!isEditMode || !draggedTaskRef.current || !touchStartPosRef.current) {
      return;
    }

    // Prevent scrolling during drag
    e.preventDefault();
  }, [isEditMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isEditMode || !draggedTaskRef.current || !isDragging) {
      setIsDragging(false);
      draggedTaskRef.current = null;
      touchStartPosRef.current = null;
      return;
    }

    // Get touch end position
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (dropTarget) {
      // Find the closest list container
      let listElement = dropTarget.closest('[data-list-id]') as HTMLElement | null;
      
      if (listElement) {
        const targetListId = listElement.getAttribute('data-list-id');
        
        if (targetListId && onTouchDrop) {
          // Serialize task data with BigInt conversion
          const serializedTask = {
            ...draggedTaskRef.current,
            id: draggedTaskRef.current.id,
            listId: draggedTaskRef.current.listId,
            order: draggedTaskRef.current.order,
          };
          
          // Find target index by checking if we're over a specific task
          let targetIndex: number | undefined = undefined;
          const taskElement = dropTarget.closest('[data-task-index]') as HTMLElement | null;
          if (taskElement) {
            const indexStr = taskElement.getAttribute('data-task-index');
            if (indexStr) {
              targetIndex = parseInt(indexStr, 10);
            }
          }
          
          onTouchDrop(serializedTask, BigInt(targetListId), targetIndex);
        }
      }
    }

    // Reset drag state but keep edit mode active
    setIsDragging(false);
    draggedTaskRef.current = null;
    touchStartPosRef.current = null;
  }, [isEditMode, isDragging, onTouchDrop]);

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback(() => {
    if (!isEditMode) {
      isDraggingRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setIsEditMode(true);
        }
      }, 500);
    }
  }, [isEditMode]);

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
    // Only allow drag in edit mode
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    isDraggingRef.current = true;
    setIsDragging(true);
    onDragStart(e, task);
  };

  const handleDragEnd = () => {
    // Keep edit mode active after drag ends
    isDraggingRef.current = false;
    setIsDragging(false);
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

  const handleDeleteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleExitEditMode = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsEditMode(false);
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
        'relative rounded-lg border shadow-sm transition-all duration-300 ease-out hover:shadow-md w-full no-text-select',
        isEditMode 
          ? 'cursor-move hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/10 border-blue-200 dark:border-blue-800' 
          : 'cursor-default bg-card',
        isDragging && 'opacity-50 scale-95',
        isDragTarget && 'bg-blue-100 dark:bg-blue-900/40 shadow-lg ring-2 ring-blue-400 dark:ring-blue-600',
        task.completed && 'opacity-60',
        'py-2 px-2'
      )}
      style={{
        touchAction: isEditMode ? 'none' : 'auto',
        willChange: isDragging ? 'transform, opacity' : 'auto',
      }}
    >
      {/* Regular mode: checkbox + title in single row */}
      <div className="flex items-center gap-2 w-full">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggleComplete}
          className="flex-shrink-0 ml-0.5"
        />
        
        <h4 
          className={cn(
            'font-medium text-sm leading-tight transition-all duration-200 min-w-0 truncate',
            task.completed && 'line-through text-muted-foreground',
            task.important && !task.completed && 'text-red-600 dark:text-red-400'
          )}
          style={{ maxWidth: '75%' }}
          title={task.title}
        >
          {task.title}
        </h4>

        {/* Long Task Badge - only visible when isLongTask is true */}
        {task.isLongTask && (
          <div className="flex-shrink-0 ml-1">
            <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
        )}

        {/* Drag handle - only visible in edit mode with larger size */}
        {isEditMode && (
          <div className="flex-shrink-0 ml-auto">
            <GripVertical className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>

      {/* Edit mode: second line with edit, delete, and exit icons */}
      {isEditMode && (
        <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 transition-transform duration-200 hover:scale-110"
            onClick={handleEditClick}
            onTouchEnd={handleEditClick}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive transition-transform duration-200 hover:scale-110"
            onClick={handleDeleteClick}
            onTouchEnd={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 transition-transform duration-200 hover:scale-110"
            onClick={handleExitEditMode}
            onTouchEnd={handleExitEditMode}
          >
            <Minus className="h-4 w-4" />
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
    prevProps.isDragTarget === nextProps.isDragTarget
  );
});

export default TaskCard;
