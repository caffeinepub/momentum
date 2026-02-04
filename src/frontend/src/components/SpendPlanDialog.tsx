import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, DollarSign, Plus, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SpendType, type SpendRecord, type SpendInput, type MonetarySettings, type SpendPreset } from '@/backend';

interface SpendPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spends: SpendRecord[] | undefined;
  monetarySettings: MonetarySettings | undefined;
  presets: SpendPreset[] | undefined;
  onCreateSpend: (input: SpendInput) => Promise<string>;
  onDeleteSpend: (spendId: bigint) => Promise<void>;
  onCreatePreset: (preset: SpendPreset) => Promise<bigint>;
  onUpdatePreset: (id: bigint, preset: SpendPreset) => Promise<void>;
  onDeletePreset: (id: bigint) => Promise<void>;
  isCreating: boolean;
  isDeleting: boolean;
}

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Others', 'Pre-deducted'];

export default function SpendPlanDialog({
  open,
  onOpenChange,
  spends,
  monetarySettings,
  presets,
  onCreateSpend,
  onDeleteSpend,
  onCreatePreset,
  onUpdatePreset,
  onDeletePreset,
  isCreating,
  isDeleting,
}: SpendPlanDialogProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  
  // Preset management state
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<bigint | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetAmount, setPresetAmount] = useState('');
  const [presetCategory, setPresetCategory] = useState('Food');

  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSpend, setPendingSpend] = useState<SpendInput | null>(null);

  const handleQuickAdd = async (preset: SpendPreset) => {
    const spendType = preset.category === 'Pre-deducted' ? SpendType.preDeducted : SpendType.normal;
    const input: SpendInput = {
      amount: preset.amount,
      category: preset.category,
      spendType,
    };
    
    // Show confirmation dialog
    setPendingSpend(input);
    setShowConfirmation(true);
  };

  const handleCustomAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const spendType = category === 'Pre-deducted' ? SpendType.preDeducted : SpendType.normal;
    const input: SpendInput = {
      amount: parseFloat(amount),
      category,
      spendType,
    };
    
    // Show confirmation dialog
    setPendingSpend(input);
    setShowConfirmation(true);
  };

  const handleConfirmSpend = async () => {
    if (!pendingSpend) return;

    try {
      const message = await onCreateSpend(pendingSpend);
      toast.success(message);
      setAmount('');
      setCategory('Food');
      setPendingSpend(null);
      setShowConfirmation(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add spend');
      setShowConfirmation(false);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingSpend(null);
    setShowConfirmation(false);
  };

  const handleDelete = async (spendId: bigint) => {
    try {
      await onDeleteSpend(spendId);
      toast.success('Spend deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete spend');
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim() || !presetAmount || parseFloat(presetAmount) <= 0) {
      toast.error('Please enter valid preset details');
      return;
    }

    try {
      const preset: SpendPreset = {
        id: editingPresetId || BigInt(0),
        name: presetName.trim(),
        amount: parseFloat(presetAmount),
        category: presetCategory,
      };

      if (editingPresetId) {
        await onUpdatePreset(editingPresetId, preset);
        toast.success('Preset updated successfully');
      } else {
        await onCreatePreset(preset);
        toast.success('Preset created successfully');
      }

      setShowPresetForm(false);
      setEditingPresetId(null);
      setPresetName('');
      setPresetAmount('');
      setPresetCategory('Food');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preset');
    }
  };

  const handleEditPreset = (preset: SpendPreset) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    setPresetAmount(preset.amount.toString());
    setPresetCategory(preset.category);
    setShowPresetForm(true);
  };

  const handleDeletePreset = async (id: bigint) => {
    try {
      await onDeletePreset(id);
      toast.success('Preset deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete preset');
    }
  };

  const handleCancelPresetForm = () => {
    setShowPresetForm(false);
    setEditingPresetId(null);
    setPresetName('');
    setPresetAmount('');
    setPresetCategory('Food');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalBalance = monetarySettings ? Number(monetarySettings.totalBalance) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] backdrop-blur-xl bg-gradient-to-br from-background/95 via-background/90 to-muted/95 border border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Spend Plan
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Track your spending and manage your budget
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6">
              {/* Balance Display */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-foreground">{totalBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Custom Spend Entry - Moved to Top with Visual Distinction */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 via-blue-500/10 to-green-500/10 border border-green-500/30 shadow-md">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background/80 backdrop-blur-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-background/80 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCustomAdd}
                    disabled={isCreating || !amount}
                    size="icon"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Add Presets Bar - Moved Below Custom Spend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Quick Add Presets</h3>
                  <Button
                    onClick={() => setShowPresetForm(true)}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Preset
                  </Button>
                </div>

                {/* Preset Form */}
                {showPresetForm && (
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        {editingPresetId ? 'Edit Preset' : 'Create New Preset'}
                      </h4>
                      <Button
                        onClick={handleCancelPresetForm}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Name"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="bg-background text-sm"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={presetAmount}
                        onChange={(e) => setPresetAmount(e.target.value)}
                        className="bg-background text-sm"
                      />
                      <Select value={presetCategory} onValueChange={setPresetCategory}>
                        <SelectTrigger className="bg-background text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleSavePreset}
                      className="w-full h-8 text-sm"
                    >
                      {editingPresetId ? 'Update Preset' : 'Save Preset'}
                    </Button>
                  </div>
                )}

                {/* Presets Horizontal Bar */}
                {presets && presets.length > 0 && (
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {presets.map((preset) => (
                        <div
                          key={preset.id.toString()}
                          className="flex-shrink-0 group relative"
                        >
                          <Button
                            onClick={() => handleQuickAdd(preset)}
                            disabled={isCreating}
                            variant="outline"
                            className="h-auto py-2 px-3 flex flex-col items-start gap-0.5 bg-background/50 hover:bg-background/70 min-w-[120px]"
                          >
                            <span className="font-semibold text-sm">{preset.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ${preset.amount.toFixed(2)}
                            </span>
                          </Button>
                          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPreset(preset);
                              }}
                              variant="secondary"
                              size="icon"
                              className="h-5 w-5 rounded-full"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePreset(preset.id);
                              }}
                              variant="destructive"
                              size="icon"
                              className="h-5 w-5 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {(!presets || presets.length === 0) && !showPresetForm && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No presets yet. Create your first quick-add preset!
                  </p>
                )}
              </div>

              {/* Spend Records List - Compact One-Line Format */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Recent Spending</h3>
                {!spends || spends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No spending records yet</p>
                ) : (
                  <div className="space-y-2">
                    {spends.map((spend) => (
                      <div
                        key={spend.id.toString()}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-semibold text-foreground whitespace-nowrap">
                            ${spend.amount.toFixed(2)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                            {spend.category}
                          </span>
                          {spend.spendType === SpendType.preDeducted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 whitespace-nowrap">
                              Pre-deducted
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground truncate">
                            {formatDate(spend.date)}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleDelete(spend.id)}
                          disabled={isDeleting}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="backdrop-blur-xl bg-gradient-to-br from-background/95 via-background/90 to-muted/95 border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Spend</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please confirm the following spend details:</p>
              {pendingSpend && (
                <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/50 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                    <span className="text-sm font-semibold text-foreground">${pendingSpend.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Category:</span>
                    <span className="text-sm font-semibold text-foreground">{pendingSpend.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {pendingSpend.spendType === SpendType.preDeducted ? 'Pre-deducted' : 'Normal'}
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSpend} disabled={isCreating}>
              {isCreating ? 'Adding...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
