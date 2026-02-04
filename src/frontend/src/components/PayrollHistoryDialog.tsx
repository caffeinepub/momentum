import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Edit, Check, X } from 'lucide-react';
import { usePayrollHistory } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { PayrollRecord } from '@/backend';

interface PayrollHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PayrollHistoryDialog({
  open,
  onOpenChange,
}: PayrollHistoryDialogProps) {
  const { payrollHistory, isLoading, submitPayrollLog, editPayrollLog } = usePayrollHistory();
  const [editingDate, setEditingDate] = useState<bigint | null>(null);
  const [editValue, setEditValue] = useState('');

  const sortedHistory = payrollHistory
    ? [...payrollHistory].sort((a, b) => Number(b.date) - Number(a.date))
    : [];

  const handleEdit = (record: PayrollRecord) => {
    setEditingDate(record.date);
    setEditValue((Number(record.total) / 100).toFixed(2));
  };

  const handleSaveEdit = async (date: bigint) => {
    try {
      const updatedTotal = BigInt(Math.round(parseFloat(editValue) * 100));
      await editPayrollLog.mutateAsync({ date, updatedTotal });
      toast.success('Payroll updated successfully');
      setEditingDate(null);
      setEditValue('');
    } catch (error) {
      toast.error('Failed to update payroll');
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setEditValue('');
  };

  const handleSubmit = async (date: bigint, total: bigint) => {
    try {
      const newBalance = await submitPayrollLog.mutateAsync(date);
      toast.success(`Payroll submitted! New balance: $${(Number(newBalance) / 100).toFixed(2)}`);
    } catch (error) {
      toast.error('Failed to submit payroll');
      console.error(error);
    }
  };

  const formatDate = (date: bigint) => {
    const dateNum = Number(date);
    const dateObj = new Date(dateNum * 24 * 60 * 60 * 1000);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] backdrop-blur-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <History className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Payroll History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No payroll history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((record) => (
                <div
                  key={record.date.toString()}
                  className={`p-4 rounded-lg border ${
                    record.submitted
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{formatDate(record.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.submitted ? 'Submitted' : 'Pending'}
                      </p>
                    </div>
                    <div className="text-right">
                      {editingDate === record.date ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 h-8"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(record.date)}
                            disabled={editPayrollLog.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${(Number(record.total) / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Morning</p>
                      <p className="font-semibold">${(Number(record.details.morning) / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Priorities</p>
                      <p className="font-semibold">${(Number(record.details.priorities) / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Evening</p>
                      <p className="font-semibold">${(Number(record.details.evening) / 100).toFixed(2)}</p>
                    </div>
                  </div>

                  {!record.submitted && editingDate !== record.date && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(record)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(record.date, record.total)}
                        disabled={submitPayrollLog.isPending}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Submit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
