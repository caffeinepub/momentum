import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RoutineSection } from '../backend';
import type { MorningRoutine as MorningRoutineType, RoutineId } from '../backend';

interface MorningRoutineProps {
  title: string;
  section: RoutineSection;
  routines: MorningRoutineType[];
  isReorderMode: boolean;
  onToggleReorder: () => void;
  onCreate: (text: string, section: RoutineSection) => void;
  onDelete: (id: RoutineId) => void;
  onUpdatePosition: (routineId: RoutineId, positionIndex: bigint) => void;
  testDate?: Date | null;
  onCheckedRoutinesChange?: (checkedIds: RoutineId[]) => void;
}

export default function MorningRoutine({
  title,
  section,
  routines,
  isReorderMode,
  onToggleReorder,
  onCreate,
  onDelete,
  onUpdatePosition,
  onCheckedRoutinesChange,
}: MorningRoutineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newRoutineText, setNewRoutineText] = useState('');
  const [draggedRoutineId, setDraggedRoutineId] = useState<RoutineId | null>(null);
  const [checkedRoutines, setCheckedRoutines] = useState<Set<RoutineId>>(new Set());

  const sortedRoutines = [...routines].sort((a, b) => Number(a.order - b.order));

  // Notify parent of checked routines changes
  useEffect(() => {
    if (onCheckedRoutinesChange) {
      onCheckedRoutinesChange(Array.from(checkedRoutines));
    }
  }, [checkedRoutines, onCheckedRoutinesChange]);

  const handleCreate = () => {
    if (newRoutineText.trim()) {
      onCreate(newRoutineText.trim(), section);
      setNewRoutineText('');
    }
  };

  const handleCheckboxChange = (routineId: RoutineId, checked: boolean) => {
    setCheckedRoutines((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(routineId);
      } else {
        newSet.delete(routineId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, routineId: RoutineId) => {
    if (!isReorderMode) return;
    setDraggedRoutineId(routineId);
    e.dataTransfer.setData('text/plain', routineId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isReorderMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isReorderMode) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedRoutineId !== null) {
      onUpdatePosition(draggedRoutineId, BigInt(targetIndex));
    }
    setDraggedRoutineId(null);
  };

  const handleDragEnd = () => {
    setDraggedRoutineId(null);
  };

  const getStreakColor = (count: bigint): string => {
    const num = Number(count);
    if (num === 0) return 'text-gray-400';
    if (num === 1) return 'text-blue-500';
    if (num <= 7) return 'text-green-500';
    if (num <= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStreakAnimation = (count: bigint): string => {
    const num = Number(count);
    if (num === 0) return '';
    if (num === 1) return 'animate-pulse-soft';
    if (num <= 7) return 'animate-glow-green';
    if (num <= 30) return 'animate-glow-orange';
    return 'animate-glow-red';
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-md p-1 hover:bg-accent"
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
          <h2 className="text-lg font-semibold">{title}</h2>
          <Badge variant="secondary">{sortedRoutines.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onToggleReorder}>
          {isReorderMode ? 'Done' : 'Reorder'}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="space-y-2">
          {sortedRoutines.map((routine, index) => {
            const isChecked = checkedRoutines.has(routine.id);
            const displayStreakCount = isChecked ? Number(routine.streakCount) + 1 : Number(routine.streakCount);

            return (
              <div
                key={routine.id.toString()}
                draggable={isReorderMode}
                onDragStart={(e) => handleDragStart(e, routine.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-3 rounded-md border border-border bg-background p-3 transition-all',
                  isReorderMode && 'cursor-move hover:border-primary',
                  draggedRoutineId === routine.id && 'opacity-50'
                )}
              >
                {isReorderMode && <GripVertical className="h-5 w-5 text-muted-foreground" />}

                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCheckboxChange(routine.id, checked as boolean)}
                  disabled={isReorderMode}
                />

                <span className={cn('flex-1', isChecked && 'line-through text-muted-foreground')}>
                  {routine.text}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Flame className={cn('h-4 w-4', getStreakColor(routine.streakCount), getStreakAnimation(routine.streakCount))} />
                    <span className={cn('text-sm font-medium', getStreakColor(routine.streakCount))}>
                      {displayStreakCount}
                    </span>
                  </div>

                  {isReorderMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(routine.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex gap-2">
            <Input
              placeholder="Add new routine..."
              value={newRoutineText}
              onChange={(e) => setNewRoutineText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
