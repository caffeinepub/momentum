import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, Clock, AlertTriangle } from 'lucide-react';
import type { LocalList } from '@/lib/types';

interface UniversalAddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (title: string, description: string, listId: bigint, urgent: boolean, important: boolean, isLongTask: boolean) => void;
  lists: LocalList[];
  isLoading: boolean;
  preSelectedListId?: bigint | null;
  quadrantsReady: boolean;
}

export default function UniversalAddTaskDialog({
  open,
  onOpenChange,
  onCreateTask,
  lists,
  isLoading,
  preSelectedListId = null,
  quadrantsReady,
}: UniversalAddTaskDialogProps) {
  const [activeTab, setActiveTab] = useState<'quadrant' | 'other'>('quadrant');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Quadrant tab state
  const [important, setImportant] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [isLongTask, setIsLongTask] = useState(false);
  
  // Other Lists tab state
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [otherImportant, setOtherImportant] = useState(false);
  const [otherIsLongTask, setOtherIsLongTask] = useState(false);

  // Build quadrant lookup map (in-memory, fast)
  const quadrantMap = useMemo(() => {
    const map = new Map<string, bigint>();
    lists.filter(l => l.quadrant).forEach(list => {
      const key = `${list.urgent}-${list.important}`;
      map.set(key, list.id);
    });
    return map;
  }, [lists]);

  // Get predicted quadrant info
  const predictedQuadrant = useMemo(() => {
    if (!quadrantsReady) return null;
    const key = `${urgent}-${important}`;
    const listId = quadrantMap.get(key);
    const list = lists.find(l => l.id === listId);
    return list ? { id: listId!, name: list.name } : null;
  }, [urgent, important, quadrantMap, lists, quadrantsReady]);

  // Get custom lists (non-quadrant)
  const customLists = useMemo(() => {
    return lists.filter(l => !l.quadrant);
  }, [lists]);

  // Handle pre-selected list
  useEffect(() => {
    if (open && preSelectedListId !== null) {
      setActiveTab('other');
      setSelectedListId(preSelectedListId.toString());
    }
  }, [open, preSelectedListId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setImportant(false);
      setUrgent(false);
      setIsLongTask(false);
      setSelectedListId('');
      setOtherImportant(false);
      setOtherIsLongTask(false);
      if (preSelectedListId === null) {
        setActiveTab('quadrant');
      }
    }
  }, [open, preSelectedListId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    if (activeTab === 'quadrant') {
      if (!predictedQuadrant) return;
      onCreateTask(title.trim(), description.trim(), predictedQuadrant.id, urgent, important, isLongTask);
    } else {
      if (!selectedListId) return;
      onCreateTask(title.trim(), description.trim(), BigInt(selectedListId), false, otherImportant, otherIsLongTask);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setImportant(false);
    setUrgent(false);
    setIsLongTask(false);
    setSelectedListId('');
    setOtherImportant(false);
    setOtherIsLongTask(false);
  };

  const isFormValid = activeTab === 'quadrant' 
    ? title.trim() && predictedQuadrant 
    : title.trim() && selectedListId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a task in a quadrant or custom list
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quadrant' | 'other')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quadrant">Quadrant</TabsTrigger>
              <TabsTrigger value="other">Other Lists</TabsTrigger>
            </TabsList>

            <TabsContent value="quadrant" className="space-y-4 mt-4">
              {!quadrantsReady && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Quadrant lists are still initializing. Please wait a moment or use the "Other Lists" tab.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="quadrant-title">Title</Label>
                <Input
                  id="quadrant-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="mt-2"
                  maxLength={20}
                  autoFocus
                  disabled={!quadrantsReady}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/20 characters
                </p>
              </div>

              <div>
                <Label htmlFor="quadrant-description">Description</Label>
                <Textarea
                  id="quadrant-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description (optional)"
                  className="mt-2"
                  rows={3}
                  disabled={!quadrantsReady}
                />
              </div>

              <div>
                <Label className="mb-3 block">Priority</Label>
                <div className="flex gap-4 justify-center flex-wrap">
                  {/* Important Toggle */}
                  <button
                    type="button"
                    onClick={() => setImportant(!important)}
                    disabled={!quadrantsReady}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      important 
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                        : 'border-border hover:border-red-300'
                    } ${!quadrantsReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <AlertCircle 
                      className={`h-10 w-10 transition-colors ${
                        important ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      important ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    }`}>
                      Important
                    </span>
                  </button>

                  {/* Urgent Toggle */}
                  <button
                    type="button"
                    onClick={() => setUrgent(!urgent)}
                    disabled={!quadrantsReady}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      urgent 
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' 
                        : 'border-border hover:border-yellow-300'
                    } ${!quadrantsReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Zap 
                      className={`h-10 w-10 transition-colors ${
                        urgent ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      urgent ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
                    }`}>
                      Urgent
                    </span>
                  </button>

                  {/* Long Task Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsLongTask(!isLongTask)}
                    disabled={!quadrantsReady}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      isLongTask 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'border-border hover:border-blue-300'
                    } ${!quadrantsReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Clock 
                      className={`h-10 w-10 transition-colors ${
                        isLongTask ? 'text-blue-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      isLongTask ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                    }`}>
                      Long Task
                    </span>
                  </button>
                </div>
              </div>

              {/* Predicted Quadrant Display */}
              {predictedQuadrant && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <p className="text-sm font-medium text-primary">
                    Task will be added to: <span className="font-bold">{predictedQuadrant.name}</span>
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="other" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="other-title">Title</Label>
                <Input
                  id="other-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="mt-2"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/20 characters
                </p>
              </div>

              <div>
                <Label htmlFor="other-description">Description</Label>
                <Textarea
                  id="other-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description (optional)"
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="other-list">Select List</Label>
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {customLists.map((list) => (
                      <SelectItem key={list.localId} value={list.id.toString()}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-3 block">Priority</Label>
                <div className="flex gap-4 justify-center flex-wrap">
                  {/* Important Toggle */}
                  <button
                    type="button"
                    onClick={() => setOtherImportant(!otherImportant)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      otherImportant 
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                        : 'border-border hover:border-red-300'
                    }`}
                  >
                    <AlertCircle 
                      className={`h-10 w-10 transition-colors ${
                        otherImportant ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      otherImportant ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    }`}>
                      Important
                    </span>
                  </button>

                  {/* Long Task Toggle */}
                  <button
                    type="button"
                    onClick={() => setOtherIsLongTask(!otherIsLongTask)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      otherIsLongTask 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <Clock 
                      className={`h-10 w-10 transition-colors ${
                        otherIsLongTask ? 'text-blue-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      otherIsLongTask ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                    }`}>
                      Long Task
                    </span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Urgent is automatically set to false for custom lists
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
