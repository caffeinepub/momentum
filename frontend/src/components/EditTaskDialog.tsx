import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { LocalTask, LocalList } from '@/lib/types';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: LocalTask;
  lists: LocalList[];
  onUpdateTask: (taskId: bigint, updates: Partial<LocalTask>) => void;
  isLoading: boolean;
}

export default function EditTaskDialog({
  open,
  onOpenChange,
  task,
  lists,
  onUpdateTask,
  isLoading,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [listId, setListId] = useState(task.listId.toString());
  const [urgent, setUrgent] = useState(task.urgent);
  const [important, setImportant] = useState(task.important);
  const [isLongTask, setIsLongTask] = useState(task.isLongTask);
  const [completed, setCompleted] = useState(task.completed);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setListId(task.listId.toString());
    setUrgent(task.urgent);
    setImportant(task.important);
    setIsLongTask(task.isLongTask);
    setCompleted(task.completed);
  }, [task]);

  const selectedList = lists.find(l => l.id.toString() === listId);
  const isQuadrantList = selectedList?.quadrant ?? false;
  const isCustomList = !isQuadrantList;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        listId: BigInt(listId),
        urgent,
        important,
        isLongTask,
        completed,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and properties.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-task-title">Title</Label>
              <Input
                id="edit-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="mt-2"
                maxLength={20}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/20 characters
              </p>
            </div>

            <div>
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-task-list">List</Label>
              <Select value={listId} onValueChange={setListId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.localId} value={list.id.toString()}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              {isQuadrantList && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  Priority flags are automatically set by the quadrant and cannot be edited.
                </div>
              )}
              
              {isCustomList && (
                <>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-2">
                    Tasks in custom lists are automatically marked as not urgent. You can edit the importance flag.
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <Label htmlFor="edit-urgent">Urgent</Label>
                    <Switch
                      id="edit-urgent"
                      checked={false}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-important">Important</Label>
                    <Switch
                      id="edit-important"
                      checked={important}
                      onCheckedChange={setImportant}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-long-task">Long Task</Label>
                <Switch
                  id="edit-long-task"
                  checked={isLongTask}
                  onCheckedChange={setIsLongTask}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-completed">Completed</Label>
                <Switch
                  id="edit-completed"
                  checked={completed}
                  onCheckedChange={setCompleted}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
