import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2 } from 'lucide-react';
import type { LocalTask, LocalList } from '@/lib/types';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: LocalTask | null;
  lists: LocalList[];
  onUpdateTask: (taskId: bigint, updates: Partial<LocalTask>) => void;
  onDeleteTask: (taskId: bigint) => void;
  isLoading: boolean;
}

export default function EditTaskDialog({
  open,
  onOpenChange,
  task,
  lists,
  onUpdateTask,
  onDeleteTask,
  isLoading,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listId, setListId] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [isLongTask, setIsLongTask] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setListId(task.listId.toString());
      setUrgent(task.urgent);
      setImportant(task.important);
      setIsLongTask(task.isLongTask);
      setCompleted(task.completed);
    }
  }, [task]);

  if (!task) return null;

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      onDeleteTask(task.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
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

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {/* Delete button on the left */}
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>

            {/* Save / Cancel on the right */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting || isLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || isDeleting || isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
