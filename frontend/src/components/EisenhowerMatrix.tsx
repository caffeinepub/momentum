import { memo, useState, useCallback, useRef } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from './TaskCard';
import type { LocalTask, LocalList } from '@/lib/types';
import { useTaskQueries } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import type { Task, List } from '@/backend';
import { readDragPayload } from '@/utils/dragPayload';
import { toast } from 'sonner';
import { useTestDate } from '@/hooks/useTestDate';

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
  // Shared edit mode state
  editTaskId: string | null;
  setEditTaskId: (id: string | null) => void;
}

const HEADER_HEIGHT = 56;
const TASK_LIST_MAX_HEIGHT = 200;

// Per-quadrant drop indicator state
interface QuadrantDragState {
  dropIndicatorIndex: number | null;
}

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
  editTaskId,
  setEditTaskId,
}: EisenhowerMatrixProps) {
  // Map from quadrant localId -> drop indicator index
  const [quadrantDragStates, setQuadrantDragStates] = useState<Record<string, QuadrantDragState>>({});
  // Refs to each quadrant's task list container for measuring card positions
  const listContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { moveTask } = useTaskQueries();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Calculate drop indicator index from pointer Y within a list container
  const calculateDropIndex = useCallback((containerEl: HTMLDivElement, clientY: number): number => {
    const cardElements = containerEl.querySelectorAll<HTMLElement>('[data-task-card]');
    if (cardElements.length === 0) return 0;

    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) {
        return i;
      }
    }
    return cardElements.length;
  }, []);

  // Calculate optimistic order using 1000-based method
  const calculateOptimisticOrder = useCallback((targetListId: bigint, dropIndex: number): bigint => {
    const allTasks = queryClient.getQueryData<Task[]>(['tasks', testDate]) ?? [];
    const listTasks = allTasks
      .filter(t => t.listId === targetListId)
      .sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));

    if (listTasks.length === 0) return BigInt(1000);

    if (dropIndex <= 0) {
      const lowestOrder = listTasks[0].order;
      const newOrder = lowestOrder - BigInt(1000);
      return newOrder > BigInt(0) ? newOrder : BigInt(1);
    }

    if (dropIndex >= listTasks.length) {
      return listTasks[listTasks.length - 1].order + BigInt(1000);
    }

    const prevOrder = listTasks[dropIndex - 1].order;
    const nextOrder = listTasks[dropIndex].order;
    return (prevOrder + nextOrder) / BigInt(2);
  }, [queryClient, testDate]);

  const handleQuadrantDragOver = useCallback((e: React.DragEvent, quadrantLocalId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const containerEl = listContainerRefs.current[quadrantLocalId];
    if (!containerEl) return;

    const newIndex = calculateDropIndex(containerEl, e.clientY);
    setQuadrantDragStates(prev => ({
      ...prev,
      [quadrantLocalId]: { dropIndicatorIndex: newIndex },
    }));
  }, [calculateDropIndex]);

  const handleQuadrantDragLeave = useCallback((e: React.DragEvent, quadrantLocalId: string) => {
    const containerEl = listContainerRefs.current[quadrantLocalId];
    if (containerEl) {
      const relatedTarget = e.relatedTarget as Node | null;
      if (relatedTarget && containerEl.contains(relatedTarget)) return;
    }
    setQuadrantDragStates(prev => ({
      ...prev,
      [quadrantLocalId]: { dropIndicatorIndex: null },
    }));
  }, []);

  const handleDropWrapper = useCallback((e: React.DragEvent, listId: bigint, quadrantLocalId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const state = quadrantDragStates[quadrantLocalId];
    const dropIndex = state?.dropIndicatorIndex ?? undefined;

    setQuadrantDragStates(prev => ({
      ...prev,
      [quadrantLocalId]: { dropIndicatorIndex: null },
    }));

    // Read payload to check if this is a cross-list move
    const payload = readDragPayload(e.dataTransfer);
    if (payload) {
      const taskId = BigInt(payload.taskId);
      const sourceListId = BigInt(payload.sourceListId);

      if (sourceListId !== listId && dropIndex !== undefined) {
        // Cross-list drop: use optimistic update via moveTask
        const optimisticOrder = calculateOptimisticOrder(listId, dropIndex);
        moveTask.mutate(
          {
            taskId,
            destinationListId: listId,
            newPosition: BigInt(dropIndex),
            optimisticOrder,
          },
          {
            onError: () => {
              toast.error('Failed to move task. Changes have been reverted.');
            },
          }
        );
        return;
      }
    }

    // Fall back to parent handler for same-list reorder
    onDrop(e, listId, dropIndex);
  }, [onDrop, quadrantDragStates, moveTask, calculateOptimisticOrder]);

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

              {/* 2×2 Quadrant Grid */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-4 flex-1 min-h-0">
                {orderedQuadrants.map((quadrant) => {
                  const quadrantTasks = getQuadrantTasks(quadrant.id);
                  const dragState = quadrantDragStates[quadrant.localId];
                  const dropIndicatorIndex = dragState?.dropIndicatorIndex ?? null;

                  return (
                    <div
                      key={quadrant.localId}
                      data-list-id={quadrant.id.toString()}
                      className={`rounded-xl border-2 pt-2 pb-3 md:pt-3 md:pb-4 transition-all duration-200 hover:shadow-lg px-1.5 flex flex-col overflow-hidden ${getQuadrantColor(quadrant.urgent, quadrant.important)}`}
                      onDragOver={(e) => handleQuadrantDragOver(e, quadrant.localId)}
                      onDragLeave={(e) => handleQuadrantDragLeave(e, quadrant.localId)}
                      onDrop={(e) => handleDropWrapper(e, quadrant.id, quadrant.localId)}
                    >
                      {/* Quadrant header */}
                      <div className="flex items-center justify-between mb-1.5 flex-shrink-0 px-0.5">
                        <h3 className="text-xs font-semibold text-muted-foreground truncate">
                          {getQuadrantDisplayName(quadrant.name)}
                        </h3>
                        <span className="text-xs text-muted-foreground/70 ml-1 flex-shrink-0">
                          {quadrantTasks.length}
                        </span>
                      </div>

                      {/* Task list — scrolls internally when > 4 tasks */}
                      <div
                        ref={(el) => { listContainerRefs.current[quadrant.localId] = el; }}
                        className="flex-1 overflow-y-auto min-h-0"
                        style={{ maxHeight: `${TASK_LIST_MAX_HEIGHT}px` }}
                      >
                        {quadrantTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/60 border border-dashed rounded-lg">
                            {dropIndicatorIndex === 0 ? (
                              <DropIndicatorLine />
                            ) : (
                              'Drop here'
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {quadrantTasks.map((task, taskIndex) => {
                              const showIndicatorBefore = dropIndicatorIndex === taskIndex;
                              const isLastTask = taskIndex === quadrantTasks.length - 1;
                              const showIndicatorAfter = isLastTask && dropIndicatorIndex === quadrantTasks.length;

                              return (
                                <div key={task.localId} className="relative">
                                  {showIndicatorBefore && (
                                    <div
                                      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                                      style={{ top: '-4px' }}
                                    >
                                      <div className="h-0.5 w-full rounded-full bg-primary shadow-sm" />
                                      <div className="absolute left-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background -translate-x-1/2" />
                                      <div className="absolute right-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background translate-x-1/2" />
                                    </div>
                                  )}
                                  <TaskCard
                                    task={task}
                                    index={taskIndex}
                                    onDragStart={onDragStart}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onTouchDrop={onTouchDrop}
                                    onEdit={() => onEditTask(task)}
                                    onDelete={() => onDeleteTask(task.id)}
                                    onToggleComplete={() => onToggleComplete(task.id, { completed: !task.completed })}
                                    isDragTarget={false}
                                    editTaskId={editTaskId}
                                    setEditTaskId={setEditTaskId}
                                  />
                                  {showIndicatorAfter && (
                                    <div
                                      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                                      style={{ bottom: '-4px' }}
                                    >
                                      <div className="h-0.5 w-full rounded-full bg-primary shadow-sm" />
                                      <div className="absolute left-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background -translate-x-1/2" />
                                      <div className="absolute right-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background translate-x-1/2" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// Reusable drop indicator line component
function DropIndicatorLine() {
  return (
    <div className="pointer-events-none w-full flex items-center">
      <div className="h-0.5 w-full rounded-full bg-primary shadow-sm" />
      <div className="absolute left-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background -translate-x-1/2" />
      <div className="absolute right-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background translate-x-1/2" />
    </div>
  );
}

export default EisenhowerMatrix;
