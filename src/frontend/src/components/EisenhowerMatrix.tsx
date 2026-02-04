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
      className="w-full rounded-lg border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-300 ease-out"
      style={{
        height: isExpanded ? '50vh' : '56px',
        willChange: 'height',
      }}
    >
      <div 
        className="sticky top-0 z-10 flex w-full items-center justify-between p-3 bg-gradient-to-r from-[#d4a5ff]/70 to-[#9e6cff]/70 dark:from-[#d4a5ff]/60 dark:to-[#9e6cff]/60 backdrop-blur-md rounded-t-lg border-b cursor-pointer"
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

      <div 
        className="p-0 m-0 flex flex-col overflow-hidden transition-opacity duration-300 ease-out"
        style={{
          height: 'calc(100% - 56px)',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          willChange: 'opacity',
        }}
      >
        {!quadrantsReady ? (
          <div className="flex items-center justify-center h-full p-6">
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
            <div className="grid grid-cols-2 gap-2 md:gap-6 m-0 p-0">
              <div className="h-10 flex items-center justify-center bg-transparent">
                <span className="text-xs md:text-sm font-semibold text-muted-foreground">Important × Urgent</span>
              </div>
              <div className="h-10 flex items-center justify-center bg-transparent">
                <span className="text-xs md:text-sm font-semibold text-muted-foreground">Important × Not Urgent</span>
              </div>
            </div>

            {/* 2x2 Quadrant Grid */}
            <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-6 flex-1 min-h-0 m-0 p-0">
              {orderedQuadrants.map((quadrant) => {
                const quadrantTasks = getQuadrantTasks(quadrant.id);
                
                return (
                  <div
                    key={quadrant.localId}
                    data-list-id={quadrant.id.toString()}
                    className={`rounded-xl border-2 pt-2 pb-3 md:pt-3 md:pb-4 transition-all duration-200 hover:shadow-lg px-1.5 overflow-y-auto flex flex-col ${getQuadrantColor(quadrant.urgent, quadrant.important)}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropWrapper(e, quadrant.id)}
                  >
                    <div className="mb-2 md:mb-3 flex-shrink-0">
                      <h3 className="text-sm md:text-base font-semibold leading-tight">{getQuadrantDisplayName(quadrant.name)}</h3>
                    </div>
                    
                    <div className="space-y-2 flex-1 min-h-0">
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
            <div className="grid grid-cols-2 gap-2 md:gap-6 m-0 p-0">
              <div className="h-10 flex items-center justify-center bg-transparent">
                <span className="text-xs md:text-sm font-semibold text-muted-foreground">Not Important × Urgent</span>
              </div>
              <div className="h-10 flex items-center justify-center bg-transparent">
                <span className="text-xs md:text-sm font-semibold text-muted-foreground">Not Important × Not Urgent</span>
              </div>
            </div>
          </>
        )}
      </div>
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
