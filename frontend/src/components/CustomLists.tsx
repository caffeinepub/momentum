import { memo, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TaskCard from './TaskCard';
import type { LocalTask, LocalList } from '@/lib/types';

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

                return (
                  <div
                    key={list.localId}
                    data-list-id={list.id.toString()}
                    className="flex-shrink-0 w-80 h-[calc(50vh-180px)] flex flex-col rounded-xl border-2 bg-background/50 p-4 transition-all duration-200 hover:shadow-lg"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropWrapper(e, list.id)}
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

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {listTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                          Drop tasks here
                        </div>
                      ) : (
                        listTasks.map((task, index) => (
                          <TaskCard
                            key={task.localId}
                            task={task}
                            index={index}
                            onDragStart={onDragStart}
                            onDrop={(e) => handleDropWrapper(e, list.id, index)}
                            onTouchDrop={onTouchDrop}
                            onEdit={() => onEditTask(task)}
                            onDelete={() => onDeleteTask(task.id)}
                            onToggleComplete={() => onToggleComplete(task.id, { completed: !task.completed })}
                            isDragTarget={dragTargetTaskId === task.localId}
                            onDragEnter={() => handleDragEnter(task.localId)}
                            onDragLeave={handleDragLeave}
                            editTaskId={editTaskId}
                            setEditTaskId={setEditTaskId}
                          />
                        ))
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
