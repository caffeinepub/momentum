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
import { Checkbox } from '@/components/ui/checkbox';
import { RoutineSection } from '@/backend';
import type { MorningRoutine as MorningRoutineType } from '@/backend';

interface MorningRoutineProps {
  section: RoutineSection;
  routines: MorningRoutineType[];
  onCreateRoutine: (text: string, section: RoutineSection) => Promise<void>;
  onDeleteRoutine: (id: bigint) => Promise<void>;
  onReorderRoutine: (routineId: bigint, positionIndex: bigint) => Promise<void>;
  isLoading?: boolean;
  displayMode: number;
  onToggleDisplayMode: (mode: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  testDate?: Date | null;
  checkedRoutineIds: Set<bigint>;
  onToggleChecked: (id: bigint) => void;
}

// Height of a single routine row in pixels:
// py-2 (8px top + 8px bottom = 16px) + text-sm leading-tight (~20px) = ~36px per row
// gap-1.5 between rows = 6px
// 4 rows: 4 * 36px + 3 * 6px = 162px
// container py-1.5 padding: 6px top + 6px bottom = 12px
// Total items area for 4 rows: 162 + 12 = 174px
const FOUR_ROW_HEIGHT = 174;
const HEADER_HEIGHT = 44;

export default function MorningRoutine({
  section,
  routines,
  onCreateRoutine,
  onDeleteRoutine,
  onReorderRoutine,
  isLoading = false,
  displayMode,
  onToggleDisplayMode,
  isExpanded,
  onToggleExpand,
  testDate,
  checkedRoutineIds,
  onToggleChecked,
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

  const handleSwitchChange = (checked: boolean) => {
    onToggleDisplayMode(checked ? 1 : 0);
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
    if (isReorderMode) return;
    
    longPressStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = setTimeout(() => {
      setIsReorderMode(true);
      setDraggedRoutineId(null);
    }, 500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!longPressStartRef.current || isReorderMode) return;
    
    const deltaX = Math.abs(e.clientX - longPressStartRef.current.x);
    const deltaY = Math.abs(e.clientY - longPressStartRef.current.y);
    
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
      setDraggedRoutineId(routineId);
      return;
    }

    const touch = e.touches[0];
    longPressStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      setIsReorderMode(true);
      setDraggedRoutineId(null);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isReorderMode && draggedRoutineId) {
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
  const getStreakVisualizationClass = (streakCount: number): string => {
    if (streakCount === 1) {
      return '';
    }
    if (streakCount >= 2 && streakCount <= 7) {
      return 'streak-shimmer-blue';
    }
    if (streakCount >= 8 && streakCount <= 30) {
      return 'streak-sparkle-purple';
    }
    if (streakCount > 30) {
      return 'streak-glow-gold';
    }
    return '';
  };

  const renderRoutineItem = (routine: MorningRoutineType) => {
    const isDragging = draggedRoutineId === routine.id;
    const isDragOver = dragOverRoutineId === routine.id;
    const streakCount = Number(routine.streakCount);
    const strikeCount = Number(routine.strikeCount);
    const isChecked = checkedRoutineIds.has(routine.id);
    const streakClass = getStreakVisualizationClass(streakCount);

    // Live streak count: backend strikeCount + 1 if currently checked, else strikeCount
    const liveStreakCount = strikeCount + (isChecked ? 1 : 0);

    // Show badge only when liveStreakCount > 0 (never show 0)
    const showStreakCounter = liveStreakCount > 0;

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
        className={`relative flex items-center gap-2 px-2 py-2 rounded-lg border shadow-sm bg-card hover:bg-accent/30 transition-all duration-300 ease-out group no-text-select ${
          isReorderMode ? 'cursor-move' : 'cursor-pointer'
        } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'ring-2 ring-primary' : ''} ${streakClass}`}
      >
        {isReorderMode && (
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onToggleChecked(routine.id)}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
        
        <span className={`flex-1 text-sm font-medium leading-tight ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
          {routine.text}
        </span>
        
        {showStreakCounter && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
              {liveStreakCount}
            </span>
          </div>
        )}
        
        {isReorderMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(e, routine.id)}
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div 
        className="w-full rounded-lg border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-300 ease-out"
        style={{
          height: isExpanded ? 'auto' : `${HEADER_HEIGHT}px`,
          minHeight: `${HEADER_HEIGHT}px`,
          willChange: 'height',
        }}
      >
        <div 
          className={`sticky top-0 z-10 flex w-full items-center justify-between px-3 py-2 ${headerGradient} backdrop-blur-md rounded-t-lg border-b cursor-pointer`}
          style={{ height: `${HEADER_HEIGHT}px` }}
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-1.5">
            <ChevronDown 
              className={`h-4 w-4 text-gray-800 dark:text-gray-100 transition-transform duration-300 ease-out`}
              style={{
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                willChange: 'transform',
              }}
            />
            <h2 className="text-base font-bold tracking-tight text-gray-800 dark:text-gray-100">{sectionTitle}</h2>
          </div>
          
          {isExpanded && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {!isReorderMode ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-100">2 Col</span>
                    <Switch
                      checked={isTwoColumn}
                      onCheckedChange={handleSwitchChange}
                      className="data-[state=checked]:bg-gray-800 dark:data-[state=checked]:bg-gray-100 scale-75"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenDialog}
                    className="h-7 w-7 p-0 text-gray-800 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-black/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitReorderMode}
                  className="h-7 px-2 text-xs text-gray-800 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-black/20 border-2 border-gray-800 dark:border-gray-100"
                >
                  Done
                </Button>
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <div 
            className="px-2 py-1.5 overflow-y-auto transition-opacity duration-300 ease-out"
            style={{
              maxHeight: `${FOUR_ROW_HEIGHT}px`,
              opacity: 1,
            }}
          >
            {sortedRoutines.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                No routines yet. Click + to add one.
              </div>
            ) : (
              <div className={`grid gap-1.5 ${isTwoColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {sortedRoutines.map(renderRoutineItem)}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {sectionTitle} Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter routine item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={isAdding || !newItemText.trim()}>
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmRoutineId !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine Item?</AlertDialogTitle>
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
