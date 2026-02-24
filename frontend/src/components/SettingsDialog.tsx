import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings, AlertCircle } from 'lucide-react';
import type { MonetarySettings } from '@/backend';
import { toast } from 'sonner';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monetarySettings: MonetarySettings | undefined;
  onSaveSettings: (settings: MonetarySettings) => Promise<void>;
  isSaving: boolean;
  earningsEnabled: boolean;
  onToggleEarnings: (enabled: boolean) => Promise<void>;
  isTogglingEarnings: boolean;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  monetarySettings,
  onSaveSettings,
  isSaving,
  earningsEnabled,
  onToggleEarnings,
  isTogglingEarnings,
}: SettingsDialogProps) {
  const [localEarningsEnabled, setLocalEarningsEnabled] = useState(earningsEnabled);
  const [maxMoneyPerDay, setMaxMoneyPerDay] = useState<number>(0);
  const [maxMorningRoutine, setMaxMorningRoutine] = useState<number>(0);
  const [maxDailyPriorities, setMaxDailyPriorities] = useState<number>(0);
  const [maxEveningRoutine, setMaxEveningRoutine] = useState<number>(0);
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);

  useEffect(() => {
    setLocalEarningsEnabled(earningsEnabled);
  }, [earningsEnabled]);

  useEffect(() => {
    if (monetarySettings) {
      setMaxMoneyPerDay(Number(monetarySettings.maxMoneyPerDay));
      setMaxMorningRoutine(Number(monetarySettings.maxMorningRoutine));
      setMaxDailyPriorities(Number(monetarySettings.maxDailyPriorities));
      setMaxEveningRoutine(Number(monetarySettings.maxEveningRoutine));
    }
  }, [monetarySettings]);

  const handleMaxMoneyChange = (value: number) => {
    setMaxMoneyPerDay(value);
    
    const currentTotal = maxMorningRoutine + maxDailyPriorities + maxEveningRoutine;
    if (currentTotal > 0) {
      const ratio = value / currentTotal;
      setMaxMorningRoutine(Math.round(maxMorningRoutine * ratio));
      setMaxDailyPriorities(Math.round(maxDailyPriorities * ratio));
      setMaxEveningRoutine(Math.round(maxEveningRoutine * ratio));
    } else {
      setMaxMorningRoutine(Math.round(value * 0.3));
      setMaxDailyPriorities(Math.round(value * 0.5));
      setMaxEveningRoutine(Math.round(value * 0.2));
    }
  };

  const handleMorningChange = (value: number) => {
    setMaxMorningRoutine(value);
    const remaining = maxMoneyPerDay - value - maxDailyPriorities;
    setMaxEveningRoutine(Math.max(0, remaining));
  };

  const handlePrioritiesChange = (value: number) => {
    setMaxDailyPriorities(value);
    const remaining = maxMoneyPerDay - maxMorningRoutine - value;
    setMaxEveningRoutine(Math.max(0, remaining));
  };

  const handleEveningChange = (value: number) => {
    setMaxEveningRoutine(value);
    const remaining = maxMoneyPerDay - maxMorningRoutine - value;
    setMaxDailyPriorities(Math.max(0, remaining));
  };

  const handleToggleEarnings = async (checked: boolean) => {
    if (checked && maxMoneyPerDay === 0) {
      setShowConfigPrompt(true);
      return;
    }

    try {
      await onToggleEarnings(checked);
      setLocalEarningsEnabled(checked);
      toast.success(checked ? 'Earnings system enabled' : 'Earnings system disabled');
    } catch (error: any) {
      console.error('Toggle earnings error:', error);
      if (error.message?.includes('Max Money Per Day')) {
        toast.error('Cannot enable earnings system', {
          description: 'Please set Max Money Per Day to a positive value first.',
        });
      } else {
        toast.error('Failed to toggle earnings system');
      }
    }
  };

  const handleSaveAndEnable = async () => {
    const bucketSum = maxMorningRoutine + maxDailyPriorities + maxEveningRoutine;
    if (bucketSum !== maxMoneyPerDay) {
      toast.error('Bucket sum must equal max money per day');
      return;
    }

    if (maxMoneyPerDay <= 0) {
      toast.error('Max Money Per Day must be greater than 0');
      return;
    }

    const settings: MonetarySettings = {
      maxMoneyPerDay: BigInt(maxMoneyPerDay),
      maxMorningRoutine: BigInt(maxMorningRoutine),
      maxDailyPriorities: BigInt(maxDailyPriorities),
      maxEveningRoutine: BigInt(maxEveningRoutine),
      totalBalance: monetarySettings?.totalBalance ?? BigInt(0),
    };

    try {
      await onSaveSettings(settings);
      await onToggleEarnings(true);
      setLocalEarningsEnabled(true);
      setShowConfigPrompt(false);
      toast.success('Settings saved and earnings system enabled');
    } catch (error: any) {
      console.error('Save and enable error:', error);
      toast.error('Failed to save settings and enable earnings system');
    }
  };

  const handleSave = async () => {
    const bucketSum = maxMorningRoutine + maxDailyPriorities + maxEveningRoutine;
    if (bucketSum !== maxMoneyPerDay) {
      toast.error('Bucket sum must equal max money per day');
      return;
    }

    const settings: MonetarySettings = {
      maxMoneyPerDay: BigInt(maxMoneyPerDay),
      maxMorningRoutine: BigInt(maxMorningRoutine),
      maxDailyPriorities: BigInt(maxDailyPriorities),
      maxEveningRoutine: BigInt(maxEveningRoutine),
      totalBalance: monetarySettings?.totalBalance ?? BigInt(0),
    };

    try {
      await onSaveSettings(settings);
      toast.success('Settings saved successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    }
  };

  const isValidConfiguration = maxMoneyPerDay > 0 && (maxMorningRoutine + maxDailyPriorities + maxEveningRoutine === maxMoneyPerDay);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-lg bg-white/90 dark:bg-gray-900/90">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Earnings System Toggle Section */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="earningsToggle" className="text-base font-semibold">
                  Enable Earnings System
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle the earnings system on or off. When disabled, all monetary features are hidden.
                </p>
              </div>
              <Switch
                id="earningsToggle"
                checked={localEarningsEnabled}
                onCheckedChange={handleToggleEarnings}
                disabled={isTogglingEarnings}
              />
            </div>
          </div>

          {/* Configuration Prompt */}
          {showConfigPrompt && !localEarningsEnabled && (
            <div className="space-y-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Configuration Required
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    To enable the earnings system, please enter your daily income goal and distribute your buckets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Monetary Settings */}
          {(localEarningsEnabled || showConfigPrompt) && (
            <>
              <div className="space-y-3">
                <Label htmlFor="maxMoneyPerDay" className="text-base font-semibold">
                  Max Money Per Day
                </Label>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Set your Max Money Per Day — the maximum amount you allow yourself to earn each day through focused work and disciplined action. (Think of it as your personal daily paycheck: estimated as (Monthly Income – Monthly Fixed Spending [rent, utilities, insurance, mortgage, childcare, subscriptions]) ÷ 30).
                </p>
                <Input
                  id="maxMoneyPerDay"
                  type="number"
                  min="0"
                  value={maxMoneyPerDay}
                  onChange={(e) => handleMaxMoneyChange(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Bucket Distribution</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This reflects where you want to invest your energy and personal growth. You can adjust these amounts anytime if a category feels too easy or too hard, based on your focus level and productivity goals.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxMorningRoutine">Morning Routine</Label>
                    <span className="text-sm font-semibold">${maxMorningRoutine}</span>
                  </div>
                  <Slider
                    id="maxMorningRoutine"
                    min={0}
                    max={maxMoneyPerDay}
                    step={1}
                    value={[maxMorningRoutine]}
                    onValueChange={([value]) => handleMorningChange(value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxDailyPriorities">Daily Priorities</Label>
                    <span className="text-sm font-semibold">${maxDailyPriorities}</span>
                  </div>
                  <Slider
                    id="maxDailyPriorities"
                    min={0}
                    max={maxMoneyPerDay}
                    step={1}
                    value={[maxDailyPriorities]}
                    onValueChange={([value]) => handlePrioritiesChange(value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxEveningRoutine">Evening Routine</Label>
                    <span className="text-sm font-semibold">${maxEveningRoutine}</span>
                  </div>
                  <Slider
                    id="maxEveningRoutine"
                    min={0}
                    max={maxMoneyPerDay}
                    step={1}
                    value={[maxEveningRoutine]}
                    onValueChange={([value]) => handleEveningChange(value)}
                    className="w-full"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Total: ${maxMorningRoutine + maxDailyPriorities + maxEveningRoutine} / ${maxMoneyPerDay}
                  {maxMorningRoutine + maxDailyPriorities + maxEveningRoutine !== maxMoneyPerDay && (
                    <span className="text-destructive ml-2">⚠ Must equal max money per day</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowConfigPrompt(false);
              onOpenChange(false);
            }}
            disabled={isSaving || isTogglingEarnings}
          >
            Cancel
          </Button>
          
          {showConfigPrompt && !localEarningsEnabled ? (
            <Button
              onClick={handleSaveAndEnable}
              disabled={isSaving || isTogglingEarnings || !isValidConfiguration}
            >
              {isSaving || isTogglingEarnings ? 'Saving...' : 'Save & Enable Earnings'}
            </Button>
          ) : localEarningsEnabled ? (
            <Button
              onClick={handleSave}
              disabled={isSaving || isTogglingEarnings || maxMorningRoutine + maxDailyPriorities + maxEveningRoutine !== maxMoneyPerDay}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
