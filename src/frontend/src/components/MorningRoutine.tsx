import { useState, useRef } from 'react';
import { Plus, Trash2, Flame, GripVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { RoutineSection, type MorningRoutine as MorningRoutineType } from '@/lib/backendTypes';

interface MorningRoutineProps {
  section: RoutineSection;
  routines: MorningRoutineType[];
  onCreateRoutine: (text: string, section: RoutineSection) => Promise<void>;
  onToggleComplete: (id: bigint, completed: boolean) => Promise<void>;
  onDeleteRoutine: (id: bigint) => Promise<void>;
  onReorderRoutine: (routineId: bigint, positionIndex: bigint) => Promise<void>;
  isLoading?: boolean;
  displayMode: number;
  onToggleDisplayMode: (mode: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function MorningRoutine({
  section,
  routines,
  onCreateRoutine,
  onToggleComplete,
  onDeleteRoutine,
  onReorderRoutine,
  isLoading = false,
  displayMode,
  onToggleDisplayMode,
  isExpanded,
  onToggleExpand,
}: MorningRoutineProps) {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedRoutineId, setDraggedRoutineId] = useState<bigint | null>(null);
  const [dragOverRoutineId, setDragOverRoutineId] = useState<bigint | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [deleteConfirmRoutineId, setDeleteConfirmRoutineId] = useState<bigint | null>(null);

  // Long-press detection state
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const sectionTitle = section === RoutineSection.top ? 'Morning Routine' : 'Evening Routine';
  const isTwoColumn = displayMode === 1;

  // Gradient styles based on section
  const headerGradient = section === RoutineSection.top
    ? 'bg-gradient-to-r from-[#a1c4fd]/70 to-[#c2e9fb]/70 dark:from-[#a1c4fd]/60 dark:to-[#c2e9fb]/60'
    : 'bg-gradient-to-r from-[#89f7fe]/70 to-[#66a6ff]/70 dark:from-[#89f7fe]/60 dark:to-[#66a6ff]/60';

  const sortedRoutines = [...routines].sort((a, b) => Number(a.order) - Number(b.order));

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    setIsAdding(true);
    try {
      await onCreateRoutine(newItemText.trim(), section);
      setNewItemText('');
      setIsDialogOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleToggleDisplayMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleDisplayMode(isTwoColumn ? 0 : 1);
  };

  const handleDeleteClick = (e: React.MouseEvent, routineId: bigint) => {
    e.stopPropagation();
    setDeleteConfirmRoutineId(routineId);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmRoutineId !== null) {
      await onDeleteRoutine(deleteConfirmRoutineId);
      setDeleteConfirmRoutineId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRoutineId(null);
  };

  // Long-press handlers for entering reorder mode
  const handleMouseDown = (e: React.MouseEvent, routineId: bigint) => {
    if (isReorderMode) return; // Already in reorder mode
    
    longPressStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = setTimeout(() => {
      setIsReorderMode(true);
      setDraggedRoutineId(null);
    }, 500); // 500ms long press
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!longPressStartRef.current || isReorderMode) return;
    
    const deltaX = Math.abs(e.clientX - longPressStartRef.current.x);
    const deltaY = Math.abs(e.clientY - longPressStartRef.current.y);
    
    // Cancel long press if moved too much
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressStartRef.current = null;
    }
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  };

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent, routineId: bigint) => {
    if (isReorderMode) {
      // In reorder mode, start dragging
      setDraggedRoutineId(routineId);
      return;
    }

    // Not in reorder mode, detect long press
    const touch = e.touches[0];
    longPressStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      setIsReorderMode(true);
      setDraggedRoutineId(null);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isReorderMode && draggedRoutineId) {
      // In reorder mode with active drag
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const routineElement = element?.closest('[data-routine-id]');
      if (routineElement) {
        const routineId = routineElement.getAttribute('data-routine-id');
        if (routineId) {
          setDragOverRoutineId(BigInt(routineId));
        }
      }
    } else if (longPressStartRef.current && !isReorderMode) {
      // Detecting long press, check if moved too much
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - longPressStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - longPressStartRef.current.y);
      
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        longPressStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (isReorderMode && draggedRoutineId && dragOverRoutineId && draggedRoutineId !== dragOverRoutineId) {
      // Complete the reorder
      e.preventDefault();
      
      const draggedIndex = sortedRoutines.findIndex(r => r.id === draggedRoutineId);
      const targetIndex = sortedRoutines.findIndex(r => r.id === dragOverRoutineId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        try {
          await onReorderRoutine(draggedRoutineId, BigInt(targetIndex));
        } catch (error) {
          console.error('Failed to reorder routine:', error);
        }
      }
    }

    // Clean up long press detection
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
    setDraggedRoutineId(null);
    setDragOverRoutineId(null);
  };

  // Drag handlers for reorder mode
  const handleDragStart = (e: React.DragEvent, routineId: bigint) => {
    if (!isReorderMode) {
      e.preventDefault();
      return;
    }
    setDraggedRoutineId(routineId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', routineId.toString());
  };

  const handleDragOver = (e: React.DragEvent, routineId: bigint) => {
    if (!isReorderMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRoutineId(routineId);
  };

  const handleDragLeave = () => {
    setDragOverRoutineId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetRoutineId: bigint) => {
    if (!isReorderMode) return;
    e.preventDefault();
    setDragOverRoutineId(null);

    if (!draggedRoutineId || draggedRoutineId === targetRoutineId) {
      setDraggedRoutineId(null);
      return;
    }

    const draggedIndex = sortedRoutines.findIndex(r => r.id === draggedRoutineId);
    const targetIndex = sortedRoutines.findIndex(r => r.id === targetRoutineId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedRoutineId(null);
      return;
    }

    try {
      await onReorderRoutine(draggedRoutineId, BigInt(targetIndex));
    } catch (error) {
      console.error('Failed to reorder routine:', error);
    } finally {
      setDraggedRoutineId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedRoutineId(null);
    setDragOverRoutineId(null);
  };

  const handleExitReorderMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReorderMode(false);
    setDraggedRoutineId(null);
    setDragOverRoutineId(null);
  };

  // Get streak visualization class based on streak count
  const getStreakVisualizationClass = (streakCount: number, completed: boolean): string => {
    // 1 day streak: no visual effect; streak count only displayed when routine is marked complete
    if (streakCount === 1) {
      return '';
    }
    // 2-7 days: subtle blue shimmer animation or ring highlight
    if (streakCount >= 2 && streakCount <= 7) {
      return 'streak-shimmer-blue';
    }
    // 8-30 days: small particle sparkle or gradient shift (blue → purple)
    if (streakCount >= 8 && streakCount <= 30) {
      return 'streak-sparkle-purple';
    }
    // > 30 days: golden glow or pulse (symbolizing mastery)
    if (streakCount > 30) {
      return 'streak-glow-gold';
    }
    return '';
  };

  const renderRoutineItem = (routine: MorningRoutineType) => {
    const isDragging = draggedRoutineId === routine.id;
    const isDragOver = dragOverRoutineId === routine.id;
    const streakCount = Number(routine.streakCount);
    const streakClass = getStreakVisualizationClass(streakCount, routine.completed);
    const showStreakCounter = streakCount > 1 || (streakCount === 1 && routine.completed);

    return (
      <div
        key={routine.id.toString()}
        data-routine-id={routine.id.toString()}
        draggable={isReorderMode}
        onDragStart={(e) => handleDragStart(e, routine.id)}
        onDragOver={(e) => handleDragOver(e, routine.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, routine.id)}
        onDragEnd={handleDragEnd}
        onMouseDown={(e) => handleMouseDown(e, routine.id)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => handleTouchStart(e, routine.id)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex items-center gap-2 p-2 pr-3 rounded-md bg-background/50 hover:bg-accent/30 transition-all duration-300 ease-out group ${
          isReorderMode ? 'cursor-move' : 'cursor-default'
        } ${isDragging ? 'opacity-50 scale-95' : ''} ${
          isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/30' : ''
        } ${streakClass}`}
      >
        {isReorderMode && (
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <button
          onClick={() => onToggleComplete(routine.id, !routine.completed)}
          disabled={isLoading}
          className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center transition-all hover:bg-primary/10 disabled:opacity-50"
          aria-label={routine.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {routine.completed && (
            <div className="h-3 w-3 rounded-full bg-primary" />
          )}
        </button>
        <span
          className={`flex-1 text-sm text-blue-600 dark:text-blue-400 pr-2 ${
            routine.completed ? 'line-through opacity-60' : ''
          }`}
        >
          {routine.text}
        </span>
        {showStreakCounter && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex-shrink-0">
            <Flame className="h-3 w-3" />
            <span className="text-xs font-semibold">
              {routine.streakCount.toString()}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleDeleteClick(e, routine.id)}
          disabled={isLoading}
          className="h-8 w-8 flex-shrink-0 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  };

  const renderRoutineItems = () => {
    if (sortedRoutines.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          No items yet. Add your first routine item.
        </p>
      );
    }

    if (isTwoColumn) {
      const midpoint = Math.ceil(sortedRoutines.length / 2);
      const leftColumn = sortedRoutines.slice(0, midpoint);
      const rightColumn = sortedRoutines.slice(midpoint);

      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            {leftColumn.map(renderRoutineItem)}
          </div>
          <div className="space-y-1">
            {rightColumn.map(renderRoutineItem)}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {sortedRoutines.map(renderRoutineItem)}
      </div>
    );
  };

  return (
    <>
      <div className="w-full rounded-lg border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-300 ease-out"
        style={{
          height: isExpanded ? '25vh' : '56px',
          willChange: 'height',
        }}
      >
        <div 
          className={`sticky top-0 z-10 flex w-full items-center justify-between p-3 backdrop-blur-md rounded-t-lg border-b cursor-pointer ${headerGradient}`}
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-2">
            <ChevronDown 
              className={`h-5 w-5 text-gray-800 dark:text-gray-100 transition-transform duration-300 ease-out`}
              style={{
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                willChange: 'transform',
              }}
            />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{sectionTitle}</h3>
          </div>
          {isExpanded && (
            <div className="flex items-center gap-3">
              {isReorderMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitReorderMode}
                  className="bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60"
                >
                  Done
                </Button>
              )}
              <div 
                className="flex items-center gap-2"
                onClick={handleToggleDisplayMode}
              >
                <Switch
                  id={`display-mode-${section}`}
                  checked={isTwoColumn}
                  onCheckedChange={(checked) => onToggleDisplayMode(checked ? 1 : 0)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenDialog}
                className="h-8 w-8 hover:bg-white/30 dark:hover:bg-black/20 transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-800 dark:text-gray-100" />
              </Button>
            </div>
          )}
        </div>

        <div 
          className="px-4 pb-4 pt-3 overflow-y-auto transition-opacity duration-300 ease-out"
          style={{
            height: 'calc(100% - 56px)',
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? 'auto' : 'none',
            willChange: 'opacity',
          }}
        >
          {renderRoutineItems()}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Routine Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAdding || isLoading}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewItemText('');
              }}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!newItemText.trim() || isAdding || isLoading}
            >
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmRoutineId !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete routine item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this routine item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
