import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, History } from 'lucide-react';
import type { MonetarySettings, Task, MorningRoutine } from '@/lib/backendTypes';
import { RoutineSection } from '@/lib/backendTypes';
import { toast } from 'sonner';
import PayrollHistoryDialog from './PayrollHistoryDialog';

interface TodayEarnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monetarySettings: MonetarySettings | undefined;
  tasks: Task[] | undefined;
  routines: MorningRoutine[] | undefined;
  onSubmitPayroll: (dailyIncome: bigint) => Promise<void>;
  isSubmitting: boolean;
}

export default function TodayEarnsDialog({
  open,
  onOpenChange,
  monetarySettings,
  tasks,
  routines,
  onSubmitPayroll,
  isSubmitting,
}: TodayEarnsDialogProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const calculations = useMemo(() => {
    if (!tasks || !routines || !monetarySettings) {
      return {
        dailyTaskIncome: 0,
        dailyMorningRoutineIncome: 0,
        dailyEveningRoutineIncome: 0,
        totalDailyIncome: 0,
      };
    }

    const maxMorningRoutine = Number(monetarySettings.maxMorningRoutine);
    const maxDailyPriorities = Number(monetarySettings.maxDailyPriorities);
    const maxEveningRoutine = Number(monetarySettings.maxEveningRoutine);

    const quadrantTasks = tasks.filter(t => t.listId >= BigInt(1) && t.listId <= BigInt(4));
    const totalTaskWeight = quadrantTasks.reduce((sum, task) => sum + task.weight, 0);
    const taskWeightCompleted = quadrantTasks
      .filter(t => t.completed)
      .reduce((sum, task) => sum + task.weight, 0);

    const morningRoutines = routines.filter(r => r.section === RoutineSection.top);
    const eveningRoutines = routines.filter(r => r.section === RoutineSection.bottom);

    const morningWeightCompleted = morningRoutines
      .filter(r => r.completed)
      .reduce((sum, r) => sum + Number(r.weight), 0);

    const eveningWeightCompleted = eveningRoutines
      .filter(r => r.completed)
      .reduce((sum, r) => sum + Number(r.weight), 0);

    const taskWeightUnit = totalTaskWeight > 0 ? maxDailyPriorities / totalTaskWeight : 0;
    const morningRoutineWeightUnit = morningRoutines.length > 0 
      ? maxMorningRoutine / (morningRoutines.length * 5) 
      : 0;
    const eveningRoutineWeightUnit = eveningRoutines.length > 0 
      ? maxEveningRoutine / (eveningRoutines.length * 5) 
      : 0;

    const dailyTaskIncome = taskWeightUnit * taskWeightCompleted;
    const dailyMorningRoutineIncome = morningRoutineWeightUnit * morningWeightCompleted;
    const dailyEveningRoutineIncome = eveningRoutineWeightUnit * eveningWeightCompleted;
    const totalDailyIncome = dailyTaskIncome + dailyMorningRoutineIncome + dailyEveningRoutineIncome;

    return {
      dailyTaskIncome,
      dailyMorningRoutineIncome,
      dailyEveningRoutineIncome,
      totalDailyIncome,
    };
  }, [tasks, routines, monetarySettings]);

  const handleSubmitPayroll = async () => {
    try {
      const dailyIncome = BigInt(Math.round(calculations.totalDailyIncome));
      await onSubmitPayroll(dailyIncome);
      toast.success(`Payroll submitted! +$${calculations.totalDailyIncome.toFixed(2)}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to submit payroll');
      console.error(error);
    }
  };

  const totalBalance = monetarySettings?.totalBalance ? Number(monetarySettings.totalBalance) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-lg bg-gradient-to-br from-green-500/10 to-blue-500/10 dark:from-green-600/20 dark:to-blue-600/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              Today Earns
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Total Balance Display */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${totalBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Today's Income Calculation */}
            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Income
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Morning Routine Income:</span>
                  <span className="font-semibold">${calculations.dailyMorningRoutineIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Priorities Income:</span>
                  <span className="font-semibold">${calculations.dailyTaskIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Evening Routine Income:</span>
                  <span className="font-semibold">${calculations.dailyEveningRoutineIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border text-base">
                  <span className="font-semibold">Total Daily Income:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ${calculations.totalDailyIncome.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payroll History Button */}
            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              className="w-full"
            >
              <History className="h-4 w-4 mr-2" />
              View Payroll History
            </Button>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayroll}
              disabled={isSubmitting || calculations.totalDailyIncome === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payroll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayrollHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
