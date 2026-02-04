import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateList: (name: string) => void;
  isLoading: boolean;
}

export default function CreateListDialog({ open, onOpenChange, onCreateList, isLoading }: CreateListDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateList(name.trim());
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Add a new custom list to organize your tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects, Personal Goals"
              className="mt-2"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
