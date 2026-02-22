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

  const handleToggleDisplayMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleDisplayMode(isTwoColumn ? 0 : 1);
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
  const getStreakVisualizationClass = (streakCount: number): string => {
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
    const strikeCount = Number(routine.strikeCount);
    const isChecked = checkedRoutineIds.has(routine.id);
    const streakClass = getStreakVisualizationClass(streakCount);
    const showStreakCounter = streakCount > 1 || (streakCount === 1 && isChecked);
    
    // Display badge: if checked, show strikeCount + 1, else show strikeCount
    const displayBadgeCount = isChecked ? strikeCount + 1 : strikeCount;

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
        className={`relative flex items-center gap-2 p-2 pr-3 rounded-md bg-background/50 hover:bg-accent/30 transition-all ${
          isDragging ? 'opacity-50' : ''
        } ${isDragOver ? 'border-2 border-primary' : ''} ${streakClass}`}
      >
        {isReorderMode && (
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggleChecked(routine.id)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
        
        <span className={`flex-1 text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
          {routine.text}
        </span>
        
        {showStreakCounter && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400">
            <Flame className="h-3 w-3" />
            <span className="text-xs font-medium">{displayBadgeCount}</span>
          </div>
        )}
        
        {isReorderMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => handleDeleteClick(e, routine.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div
        className={`rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden ${
          !isExpanded ? 'cursor-pointer' : ''
        }`}
        onClick={!isExpanded ? onToggleExpand : undefined}
      >
        {/* Header */}
        <div className={`${headerGradient} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown
                className={`h-4 w-4 text-foreground transition-transform ${
                  isExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>
            <h2 className="text-base font-semibold text-foreground">{sectionTitle}</h2>
            <span className="text-xs text-muted-foreground">({routines.length})</span>
          </div>
          
          {isExpanded && (
            <div className="flex items-center gap-2">
              {isReorderMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitReorderMode}
                  className="h-7 text-xs"
                >
                  Done
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">2 Columns</span>
                    <Switch
                      checked={isTwoColumn}
                      onCheckedChange={handleSwitchChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenDialog}
                    className="h-7 w-7"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedRoutines.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No routines yet. Click + to add one.
              </div>
            ) : (
              <div className={`space-y-2 ${isTwoColumn ? 'grid grid-cols-2 gap-2' : ''}`}>
                {sortedRoutines.map(renderRoutineItem)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Routine Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {sectionTitle} Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmRoutineId !== null} onOpenChange={handleCancelDelete}>
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
    </div>
  );
}
