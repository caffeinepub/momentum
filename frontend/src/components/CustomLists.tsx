import { memo, useState, useCallback, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TaskCard from './TaskCard';
import type { LocalTask, LocalList } from '@/lib/types';
import { useTaskQueries } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/backend';
import { readDragPayload } from '@/utils/dragPayload';
import { toast } from 'sonner';
import { useTestDate } from '@/hooks/useTestDate';

interface CustomListsProps {
  tasks: LocalTask[];
  lists: LocalList[];
  onDragStart: (e: React.DragEvent, task: LocalTask) => void;
  onDrop: (e: React.DragEvent, listId: bigint, index?: number) => void;
  onTouchDrop: (task: LocalTask, targetListId: bigint, targetIndex?: number) => void;
  onReorder: (taskId: bigint, listId: bigint, newIndex: number) => void;
  onEditTask: (task: LocalTask) => void;
  onDeleteTask: (taskId: bigint) => void;
  onDeleteList: (listId: bigint) => void;
  onToggleComplete: (taskId: bigint, updates: Partial<LocalTask>) => void;
  onCreateTask: () => void;
  onCreateList: () => void;
  onQuickAddTask: (listId: bigint) => void;
  isHidden?: boolean;
  isPlanMode?: boolean;
  // Shared edit mode state
  editTaskId: string | null;
  setEditTaskId: (id: string | null) => void;
}

// Per-list drop indicator state
interface ListDragState {
  dropIndicatorIndex: number | null;
}

const CustomLists = memo(function CustomLists({
  tasks,
  lists,
  onDragStart,
  onDrop,
  onTouchDrop,
  onReorder,
  onEditTask,
  onDeleteTask,
  onDeleteList,
  onToggleComplete,
  onCreateTask,
  onCreateList,
  onQuickAddTask,
  isHidden = false,
  isPlanMode = false,
  editTaskId,
  setEditTaskId,
}: CustomListsProps) {
  // Map from list localId -> drop indicator state
  const [listDragStates, setListDragStates] = useState<Record<string, ListDragState>>({});
  // Refs to each list's task container for measuring card positions
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

  const handleListDragOver = useCallback((e: React.DragEvent, listLocalId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const containerEl = listContainerRefs.current[listLocalId];
    if (!containerEl) return;

    const newIndex = calculateDropIndex(containerEl, e.clientY);
    setListDragStates(prev => ({
      ...prev,
      [listLocalId]: { dropIndicatorIndex: newIndex },
    }));
  }, [calculateDropIndex]);

  const handleListDragLeave = useCallback((e: React.DragEvent, listLocalId: string) => {
    const containerEl = listContainerRefs.current[listLocalId];
    if (containerEl) {
      const relatedTarget = e.relatedTarget as Node | null;
      if (relatedTarget && containerEl.contains(relatedTarget)) return;
    }
    setListDragStates(prev => ({
      ...prev,
      [listLocalId]: { dropIndicatorIndex: null },
    }));
  }, []);

  const handleDropWrapper = useCallback((e: React.DragEvent, listId: bigint, listLocalId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const state = listDragStates[listLocalId];
    const dropIndex = state?.dropIndicatorIndex ?? undefined;

    setListDragStates(prev => ({
      ...prev,
      [listLocalId]: { dropIndicatorIndex: null },
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
  }, [onDrop, listDragStates, moveTask, calculateOptimisticOrder]);

  const getListTasks = (listId: bigint) => {
    return tasks
      .filter(task => task.listId === listId)
      .sort((a, b) => Number(a.order) - Number(b.order));
  };

  const handleDeleteListClick = (listId: bigint) => {
    const listTasks = getListTasks(listId);
    if (listTasks.length > 0) {
      if (window.confirm('This list contains tasks. Are you sure you want to delete it?')) {
        onDeleteList(listId);
      }
    } else {
      onDeleteList(listId);
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <div className="w-full h-[calc(50vh-80px)] rounded-lg border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="sticky top-0 z-10 flex w-full items-center justify-between p-3 bg-gradient-to-r from-[#e0e0e0]/70 to-[#fafafa]/70 dark:from-[#e0e0e0]/60 dark:to-[#fafafa]/60 backdrop-blur-md rounded-t-lg border-b">
        <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-100">My Lists</h2>
        {isPlanMode && (
          <span className="text-xs text-muted-foreground/70 italic">
            (Press & hold to drag tasks)
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 h-[calc(100%-56px)] overflow-y-auto">
        {!isPlanMode && (
          <div className="flex gap-2">
            <Button
              onClick={onCreateTask}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
            <Button
              onClick={onCreateList}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </div>
        )}

        {lists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No custom lists yet. Create your first list!</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {lists.map((list) => {
                const listTasks = getListTasks(list.id);
                const dragState = listDragStates[list.localId];
                const dropIndicatorIndex = dragState?.dropIndicatorIndex ?? null;

                return (
                  <div
                    key={list.localId}
                    data-list-id={list.id.toString()}
                    className="flex-shrink-0 w-80 h-[calc(50vh-180px)] flex flex-col rounded-xl border-2 bg-background/50 p-4 transition-all duration-200 hover:shadow-lg"
                    onDragOver={(e) => handleListDragOver(e, list.localId)}
                    onDragLeave={(e) => handleListDragLeave(e, list.localId)}
                    onDrop={(e) => handleDropWrapper(e, list.id, list.localId)}
                  >
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-lg font-semibold truncate flex-1">{list.name}</h3>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onQuickAddTask(list.id)}
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Add task to this list"
                        >
                          <Plus className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteListClick(list.id)}
                          className="h-8 w-8 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div
                      ref={(el) => { listContainerRefs.current[list.localId] = el; }}
                      className="flex-1 overflow-y-auto"
                    >
                      {listTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                          Drop tasks here
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {listTasks.map((task, index) => {
                            const showIndicatorBefore = dropIndicatorIndex === index;
                            const isLastTask = index === listTasks.length - 1;
                            const showIndicatorAfter = isLastTask && dropIndicatorIndex === listTasks.length;

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
                                  index={index}
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.tasks === nextProps.tasks &&
    prevProps.lists === nextProps.lists &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.isPlanMode === nextProps.isPlanMode &&
    prevProps.editTaskId === nextProps.editTaskId
  );
});

export default CustomLists;
