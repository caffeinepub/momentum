import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, SkipForward } from 'lucide-react';

interface DayResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNextDayReset: () => void;
  onSkippedDayReset: () => void;
  isResetting?: boolean;
}

export default function DayResetDialog({
  open,
  onOpenChange,
  onNextDayReset,
  onSkippedDayReset,
  isResetting = false,
}: DayResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Day</DialogTitle>
          <DialogDescription>
            Choose how you want to reset your routines for the new day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Button
              onClick={onNextDayReset}
              disabled={isResetting}
              className="w-full h-auto py-4 flex flex-col items-start gap-2"
              variant="default"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Next Day Reset</span>
              </div>
              <span className="text-xs text-left opacity-90 font-normal">
                Checked routines: increase streak count and uncheck
                <br />
                Unchecked routines: reset streak count to 0
              </span>
            </Button>

            <Button
              onClick={onSkippedDayReset}
              disabled={isResetting}
              className="w-full h-auto py-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <SkipForward className="h-5 w-5" />
                <span className="font-semibold">Skipped Day Reset</span>
              </div>
              <span className="text-xs text-left opacity-70 font-normal">
                Uncheck all routines and reset all streak counts to 0
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
