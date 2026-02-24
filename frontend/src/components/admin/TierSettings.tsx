import { useState, useEffect } from 'react';
import { Loader2, Save, Infinity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useGetAllTierLimits, useUpdateTierLimits } from '@/hooks/useQueries';
import { getAllTiers } from '@/lib/userTier';
import { UserTier, TierLimits } from '@/backend';
import { toast } from 'sonner';

interface TierLimitState {
  maxTasks: number | null;
  maxCustomLists: number | null;
  maxRoutines: number | null;
  maxTasksUnlimited: boolean;
  maxCustomListsUnlimited: boolean;
  maxRoutinesUnlimited: boolean;
}

export default function TierSettings() {
  const { data: tierLimitsConfig, isLoading } = useGetAllTierLimits();
  const updateTierLimits = useUpdateTierLimits();

  const [tierStates, setTierStates] = useState<Record<UserTier, TierLimitState>>({
    [UserTier.basic]: {
      maxTasks: 20,
      maxCustomLists: 2,
      maxRoutines: 5,
      maxTasksUnlimited: false,
      maxCustomListsUnlimited: false,
      maxRoutinesUnlimited: false,
    },
    [UserTier.silver]: {
      maxTasks: 50,
      maxCustomLists: 5,
      maxRoutines: 10,
      maxTasksUnlimited: false,
      maxCustomListsUnlimited: false,
      maxRoutinesUnlimited: false,
    },
    [UserTier.gold]: {
      maxTasks: 100,
      maxCustomLists: 10,
      maxRoutines: 20,
      maxTasksUnlimited: false,
      maxCustomListsUnlimited: false,
      maxRoutinesUnlimited: false,
    },
    [UserTier.diamond]: {
      maxTasks: null,
      maxCustomLists: null,
      maxRoutines: null,
      maxTasksUnlimited: true,
      maxCustomListsUnlimited: true,
      maxRoutinesUnlimited: true,
    },
  });

  const [savingTier, setSavingTier] = useState<UserTier | null>(null);

  useEffect(() => {
    if (tierLimitsConfig) {
      const newStates: Record<UserTier, TierLimitState> = {
        [UserTier.basic]: convertToState(tierLimitsConfig.basic),
        [UserTier.silver]: convertToState(tierLimitsConfig.silver),
        [UserTier.gold]: convertToState(tierLimitsConfig.gold),
        [UserTier.diamond]: convertToState(tierLimitsConfig.diamond),
      };
      setTierStates(newStates);
    }
  }, [tierLimitsConfig]);

  const convertToState = (limits: TierLimits): TierLimitState => {
    return {
      maxTasks: limits.maxTasks ? Number(limits.maxTasks) : null,
      maxCustomLists: limits.maxCustomLists ? Number(limits.maxCustomLists) : null,
      maxRoutines: limits.maxRoutines ? Number(limits.maxRoutines) : null,
      maxTasksUnlimited: !limits.maxTasks,
      maxCustomListsUnlimited: !limits.maxCustomLists,
      maxRoutinesUnlimited: !limits.maxRoutines,
    };
  };

  const convertToBackendLimits = (state: TierLimitState): TierLimits => {
    return {
      maxTasks: state.maxTasksUnlimited ? undefined : BigInt(state.maxTasks || 0),
      maxCustomLists: state.maxCustomListsUnlimited ? undefined : BigInt(state.maxCustomLists || 0),
      maxRoutines: state.maxRoutinesUnlimited ? undefined : BigInt(state.maxRoutines || 0),
    };
  };

  const handleSave = async (tier: UserTier) => {
    setSavingTier(tier);
    try {
      const limits = convertToBackendLimits(tierStates[tier]);
      await updateTierLimits.mutateAsync({ tier, limits });
      toast.success(`${getAllTiers().find(t => t.value === tier)?.label} tier limits updated successfully`);
    } catch (error: any) {
      console.error('Failed to update tier limits:', error);
      toast.error(error?.message || 'Failed to update tier limits');
    } finally {
      setSavingTier(null);
    }
  };

  const handleUnlimitedToggle = (tier: UserTier, field: 'maxTasks' | 'maxCustomLists' | 'maxRoutines') => {
    const unlimitedField = `${field}Unlimited` as keyof TierLimitState;
    setTierStates(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [unlimitedField]: !prev[tier][unlimitedField],
      },
    }));
  };

  const handleValueChange = (tier: UserTier, field: 'maxTasks' | 'maxCustomLists' | 'maxRoutines', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setTierStates(prev => ({
        ...prev,
        [tier]: {
          ...prev[tier],
          [field]: numValue,
        },
      }));
    }
  };

  const allTiers = getAllTiers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {allTiers.map(({ value: tier, label }) => {
        const state = tierStates[tier];
        const isSaving = savingTier === tier;

        return (
          <Card key={tier}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>Configure limits for {label} tier users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Max Tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${tier}-tasks`}>Max Tasks</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${tier}-tasks-unlimited`}
                      checked={state.maxTasksUnlimited}
                      onCheckedChange={() => handleUnlimitedToggle(tier, 'maxTasks')}
                    />
                    <Label htmlFor={`${tier}-tasks-unlimited`} className="text-sm text-muted-foreground cursor-pointer">
                      Unlimited
                    </Label>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id={`${tier}-tasks`}
                    type="number"
                    min="0"
                    value={state.maxTasksUnlimited ? '' : state.maxTasks || ''}
                    onChange={(e) => handleValueChange(tier, 'maxTasks', e.target.value)}
                    disabled={state.maxTasksUnlimited}
                    placeholder={state.maxTasksUnlimited ? 'Unlimited' : '0'}
                  />
                  {state.maxTasksUnlimited && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Max Custom Lists */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${tier}-lists`}>Max Custom Lists</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${tier}-lists-unlimited`}
                      checked={state.maxCustomListsUnlimited}
                      onCheckedChange={() => handleUnlimitedToggle(tier, 'maxCustomLists')}
                    />
                    <Label htmlFor={`${tier}-lists-unlimited`} className="text-sm text-muted-foreground cursor-pointer">
                      Unlimited
                    </Label>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id={`${tier}-lists`}
                    type="number"
                    min="0"
                    value={state.maxCustomListsUnlimited ? '' : state.maxCustomLists || ''}
                    onChange={(e) => handleValueChange(tier, 'maxCustomLists', e.target.value)}
                    disabled={state.maxCustomListsUnlimited}
                    placeholder={state.maxCustomListsUnlimited ? 'Unlimited' : '0'}
                  />
                  {state.maxCustomListsUnlimited && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Max Routines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${tier}-routines`}>Max Routines</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${tier}-routines-unlimited`}
                      checked={state.maxRoutinesUnlimited}
                      onCheckedChange={() => handleUnlimitedToggle(tier, 'maxRoutines')}
                    />
                    <Label htmlFor={`${tier}-routines-unlimited`} className="text-sm text-muted-foreground cursor-pointer">
                      Unlimited
                    </Label>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id={`${tier}-routines`}
                    type="number"
                    min="0"
                    value={state.maxRoutinesUnlimited ? '' : state.maxRoutines || ''}
                    onChange={(e) => handleValueChange(tier, 'maxRoutines', e.target.value)}
                    disabled={state.maxRoutinesUnlimited}
                    placeholder={state.maxRoutinesUnlimited ? 'Unlimited' : '0'}
                  />
                  {state.maxRoutinesUnlimited && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleSave(tier)}
                disabled={isSaving || updateTierLimits.isPending}
                className="w-full gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save {label} Limits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
