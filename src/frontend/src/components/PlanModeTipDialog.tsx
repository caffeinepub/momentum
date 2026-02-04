import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoveHorizontal } from 'lucide-react';

interface PlanModeTipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

export default function PlanModeTipDialog({ open, onOpenChange, onDismiss }: PlanModeTipDialogProps) {
  const handleGotIt = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Plan Mode Tips</DialogTitle>
          <DialogDescription className="text-center">
            Master your custom lists
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <MoveHorizontal className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm leading-relaxed">
                  <strong>Drag tasks between lists:</strong> Press and hold any task, then drag it to another list to organize your work.
                </p>
                <p className="text-sm leading-relaxed">
                  You can also reorder tasks within the same list by dragging them up or down.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-center font-medium text-muted-foreground italic">
                The Real Magic Is in Settings.
              </p>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleGotIt}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
