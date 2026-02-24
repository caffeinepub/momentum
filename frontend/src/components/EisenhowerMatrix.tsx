import { memo, useState, useCallback } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from './TaskCard';
import type { LocalTask, LocalList } from '@/lib/types';

interface EisenhowerMatrixProps {
  tasks: LocalTask[];
  quadrantLists: LocalList[];
  onDragStart: (e: React.DragEvent, task: LocalTask) => void;
  onDrop: (e: React.DragEvent, listId: bigint, index?: number) => void;
  onTouchDrop: (task: LocalTask, targetListId: bigint, targetIndex?: number) => void;
  onReorder: (taskId: bigint, listId: bigint, newIndex: number) => void;
  onEditTask: (task: LocalTask) => void;
  onDeleteTask: (taskId: bigint) => void;
  onToggleComplete: (taskId: bigint, updates: Partial<LocalTask>) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isPlanMode: boolean;
  onSwitchToPlanMode?: () => void;
}

const HEADER_HEIGHT = 56;

// Approximate height for 4 task cards:
// Each task card: ~40px (py-2 + single row content)
// space-y-2 gap: 8px between items → 3 gaps = 24px
// Total ≈ 4×40 + 24 = 184px, use 200px for a bit of breathing room
const TASK_LIST_MAX_HEIGHT = 200;

const EisenhowerMatrix = memo(function EisenhowerMatrix({
  tasks,
  quadrantLists,
  onDragStart,
  onDrop,
  onTouchDrop,
  onReorder,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  isExpanded,
  onToggleExpand,
  isPlanMode,
  onSwitchToPlanMode,
}: EisenhowerMatrixProps) {
  const [dragTargetTaskId, setDragTargetTaskId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = useCallback((taskLocalId: string) => {
    setDragTargetTaskId(taskLocalId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragTargetTaskId(null);
  }, []);

  const handleDropWrapper = useCallback((e: React.DragEvent, listId: bigint, index?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTargetTaskId(null);
    onDrop(e, listId, index);
  }, [onDrop]);

  const getQuadrantTasks = (listId: bigint) => {
    return tasks
      .filter(task => task.listId === listId)
      .sort((a, b) => Number(a.order) - Number(b.order));
  };

  const getQuadrantColor = (urgent: boolean, important: boolean) => {
    if (urgent && important) {
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
    } else if (!urgent && important) {
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
    } else if (urgent && !important) {
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
    } else {
      return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900';
    }
  };

  const getQuadrantDisplayName = (name: string) => {
    const nameMap: Record<string, string> = {
      'Must Do': 'Must Do',
      'Should Do': 'Should Do',
      'Delegate / Could Do': 'Delegate / Could Do',
      'May Do': 'May Do',
    };
    return nameMap[name] || name;
  };

  const orderedQuadrants = [1, 2, 3, 4].map(id => {
    const quadrant = quadrantLists.find(q => Number(q.id) === id);
    return quadrant;
  }).filter(Boolean) as LocalList[];

  const handlePlanButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSwitchToPlanMode) {
      onSwitchToPlanMode();
    }
  };

  const showPlanButton = isExpanded && !isPlanMode;

  // Check if quadrants are ready (all 4 exist)
  const quadrantsReady = orderedQuadrants.length === 4;

  return (
    <div
      className="w-full rounded-lg border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-out"
      style={{
        maxHeight: isExpanded ? '60vh' : `${HEADER_HEIGHT}px`,
        minHeight: `${HEADER_HEIGHT}px`,
        willChange: 'max-height',
      }}
    >
      {/* Fixed header — never scrolls */}
      <div
        className="flex-shrink-0 flex w-full items-center justify-between p-3 bg-gradient-to-r from-[#d4a5ff]/70 to-[#9e6cff]/70 dark:from-[#d4a5ff]/60 dark:to-[#9e6cff]/60 backdrop-blur-md rounded-t-lg border-b cursor-pointer z-10"
        style={{ height: `${HEADER_HEIGHT}px` }}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className="h-5 w-5 text-gray-800 dark:text-gray-100 transition-transform duration-300 ease-out"
            style={{
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              willChange: 'transform',
            }}
          />
          <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-100">Daily Priorities</h2>
        </div>
        {showPlanButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlanButtonClick}
            className="h-8 px-3 text-gray-800 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-black/20 border-2 border-gray-800 dark:border-gray-100"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Plan
          </Button>
        )}
      </div>

      {/* Content area — does NOT scroll itself; only task lists inside quadrants scroll */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-2 gap-1">
          {!quadrantsReady ? (
            <div className="flex items-center justify-center flex-1" style={{ minHeight: '200px' }}>
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Initializing quadrant lists...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Column Headers */}
              <div className="grid grid-cols-2 gap-2 md:gap-4 flex-shrink-0">
                <div className="h-8 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-semibold text-muted-foreground">Important × Urgent</span>
                </div>
                <div className="h-8 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-semibold text-muted-foreground">Important × Not Urgent</span>
                </div>
              </div>

              {/* 2×2 Quadrant Grid — fills remaining space, no overflow on the grid itself */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-4 flex-1 min-h-0">
                {orderedQuadrants.map((quadrant) => {
                  const quadrantTasks = getQuadrantTasks(quadrant.id);

                  return (
                    <div
                      key={quadrant.localId}
                      data-list-id={quadrant.id.toString()}
                      className={`rounded-xl border-2 pt-2 pb-3 md:pt-3 md:pb-4 transition-all duration-200 hover:shadow-lg px-1.5 flex flex-col overflow-hidden ${getQuadrantColor(quadrant.urgent, quadrant.important)}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropWrapper(e, quadrant.id)}
                    >
                      {/* Quadrant header — always visible, never scrolls */}
                      <div className="mb-2 md:mb-3 flex-shrink-0">
                        <h3 className="text-sm md:text-base font-semibold leading-tight">{getQuadrantDisplayName(quadrant.name)}</h3>
                      </div>

                      {/* Task list — scrollable only when more than 4 tasks */}
                      <div
                        className="space-y-2 overflow-y-auto"
                        style={{ maxHeight: `${TASK_LIST_MAX_HEIGHT}px` }}
                      >
                        {quadrantTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-20 text-xs md:text-sm text-muted-foreground border-2 border-dashed rounded-lg transition-all duration-200 hover:border-solid hover:bg-muted/20">
                            Drop tasks here
                          </div>
                        ) : (
                          quadrantTasks.map((task, index) => (
                            <TaskCard
                              key={task.localId}
                              task={task}
                              index={index}
                              onDragStart={onDragStart}
                              onDrop={(e) => handleDropWrapper(e, quadrant.id, index)}
                              onTouchDrop={onTouchDrop}
                              onEdit={() => onEditTask(task)}
                              onDelete={() => onDeleteTask(task.id)}
                              onToggleComplete={() => onToggleComplete(task.id, { completed: !task.completed })}
                              isDragTarget={dragTargetTaskId === task.localId}
                              onDragEnter={() => handleDragEnter(task.localId)}
                              onDragLeave={handleDragLeave}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Row */}
              <div className="grid grid-cols-2 gap-2 md:gap-4 flex-shrink-0">
                <div className="h-8 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-semibold text-muted-foreground">Not Important × Urgent</span>
                </div>
                <div className="h-8 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-semibold text-muted-foreground">Not Important × Not Urgent</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.tasks === nextProps.tasks &&
    prevProps.quadrantLists === nextProps.quadrantLists &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isPlanMode === nextProps.isPlanMode
  );
});

export default EisenhowerMatrix;
