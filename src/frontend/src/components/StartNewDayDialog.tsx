import { useState } from 'react';
import { RotateCcw, SkipForward } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { RoutineId } from '@/backend';

interface StartNewDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNextDayReset: () => void;
  onSkippedDayReset: () => void;
  isResettingNextDay: boolean;
  isResettingSkipped: boolean;
}

export default function StartNewDayDialog({
  open,
  onOpenChange,
  onNextDayReset,
  onSkippedDayReset,
  isResettingNextDay,
  isResettingSkipped,
}: StartNewDayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Day</DialogTitle>
          <DialogDescription>
            Choose how you want to reset your routines for the new day.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={onNextDayReset}
            disabled={isResettingNextDay || isResettingSkipped}
            className="w-full gap-2 h-auto py-4 flex-col items-start"
            variant="default"
          >
            <div className="flex items-center gap-2 w-full">
              <RotateCcw className={`h-5 w-5 ${isResettingNextDay ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Next Day Reset</span>
            </div>
            <span className="text-xs text-left opacity-90 font-normal">
              Uncheck all routines and update streaks based on completion
            </span>
          </Button>

          <Button
            onClick={onSkippedDayReset}
            disabled={isResettingNextDay || isResettingSkipped}
            className="w-full gap-2 h-auto py-4 flex-col items-start"
            variant="destructive"
          >
            <div className="flex items-center gap-2 w-full">
              <SkipForward className={`h-5 w-5 ${isResettingSkipped ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Skipped Day Reset</span>
            </div>
            <span className="text-xs text-left opacity-90 font-normal">
              Uncheck all routines and reset all streak counts to 0
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
