import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Task, List, TaskCreateInput, TaskUpdateInput, TaskId, ListId, UserProfile, MorningRoutine, RoutineSection, RoutineId, MonetarySettings, PayrollRecord, SpendRecord, SpendInput, SpendId, SpendPreset, UserMetadata, UserTier, TierLimitsConfig, TierLimits, StorageMetrics, UserStorageBreakdown } from '@/backend';
import type { Principal } from '@icp-sdk/core/principal';
import { useState } from 'react';
import { useTestDate } from './useTestDate';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminUserList() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<UserMetadata[]>({
    queryKey: ['adminUserList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserMetadataWithRoles();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
  });
}

export function usePromoteToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.promoteToAdmin(targetPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useRemoveAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.removeAdmin(targetPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useSetUserTier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUser, newTier }: { targetUser: Principal; newTier: UserTier }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.setUserTier(targetUser, newTier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
    },
  });
}

export function useGetAllTierLimits() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<TierLimitsConfig>({
    queryKey: ['tierLimits'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllTierLimits();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
  });
}

export function useUpdateTierLimits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tier, limits }: { tier: UserTier; limits: TierLimits }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTierLimits(tier, limits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits'] });
    },
  });
}

export function useGetOverallStorageMetrics() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<StorageMetrics>({
    queryKey: ['overallStorageMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getOverallStorageMetrics();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
    refetchOnWindowFocus: false,
  });
}

export function useGetAllUserStorageBreakdowns() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<UserStorageBreakdown[]>({
    queryKey: ['allUserStorageBreakdowns'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUserStorageBreakdowns();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
    refetchOnWindowFocus: false,
  });
}

export function useGetDefaultOrder() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['defaultOrder'],
    queryFn: async () => {
      if (!actor) return BigInt(1000);
      return actor.getDefaultOrder();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRegisteredUserCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['registeredUserCount'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTotalUsers();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useAppMode() {
  const queryClient = useQueryClient();

  const appModeQuery = useQuery<number>({
    queryKey: ['appMode'],
    queryFn: async () => {
      return 0;
    },
    staleTime: Infinity,
  });

  const setAppModeMutation = useMutation({
    mutationFn: async (mode: number) => {
      return mode;
    },
    onMutate: async (newMode) => {
      await queryClient.cancelQueries({ queryKey: ['appMode'] });
      const previousMode = queryClient.getQueryData<number>(['appMode']);
      queryClient.setQueryData<number>(['appMode'], newMode);
      return { previousMode };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMode !== undefined) {
        queryClient.setQueryData(['appMode'], context.previousMode);
      }
    },
  });

  return {
    appMode: appModeQuery.data ?? 0,
    isLoading: appModeQuery.isLoading,
    setAppMode: setAppModeMutation,
  };
}

export function useEarningsEnabled() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const earningsEnabledQuery = useQuery<boolean>({
    queryKey: ['earningsEnabled'],
    queryFn: async () => {
      if (!actor) return true;
      return actor.getEarningsEnabled();
    },
    enabled: !!actor && !isFetching,
  });

  const toggleEarningsSystemMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.toggleEarningsSystem(enabled);
    },
    onMutate: async (newEnabled) => {
      await queryClient.cancelQueries({ queryKey: ['earningsEnabled'] });
      const previousEnabled = queryClient.getQueryData<boolean>(['earningsEnabled']);
      queryClient.setQueryData<boolean>(['earningsEnabled'], newEnabled);
      return { previousEnabled };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousEnabled !== undefined) {
        queryClient.setQueryData(['earningsEnabled'], context.previousEnabled);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['earningsEnabled'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });

  return {
    earningsEnabled: earningsEnabledQuery.data ?? true,
    isLoading: earningsEnabledQuery.isLoading,
    toggleEarningsSystem: toggleEarningsSystemMutation,
  };
}

export function useMonetarySettings() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const monetarySettingsQuery = useQuery<MonetarySettings>({
    queryKey: ['monetarySettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMonetarySettings();
    },
    enabled: !!actor && !isFetching,
  });

  const saveMonetarySettingsMutation = useMutation({
    mutationFn: async (settings: MonetarySettings) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveMonetarySettings(settings);
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['monetarySettings'] });
      const previousSettings = queryClient.getQueryData<MonetarySettings>(['monetarySettings']);
      queryClient.setQueryData<MonetarySettings>(['monetarySettings'], newSettings);
      return { previousSettings };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['monetarySettings'], context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
    },
  });

  const addPayrollMutation = useMutation({
    mutationFn: async (dailyIncome: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addPayroll(dailyIncome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
    },
  });

  return {
    monetarySettings: monetarySettingsQuery.data,
    isLoading: monetarySettingsQuery.isLoading,
    saveMonetarySettings: saveMonetarySettingsMutation,
    addPayroll: addPayrollMutation,
  };
}

export function usePayrollHistory() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const payrollHistoryQuery = useQuery<PayrollRecord[]>({
    queryKey: ['payrollHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPayrollHistory();
    },
    enabled: !!actor && !isFetching,
  });

  const submitPayrollLogMutation = useMutation({
    mutationFn: async (date: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.submitPayrollLog(date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollHistory'] });
      queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
    },
  });

  const editPayrollLogMutation = useMutation({
    mutationFn: async ({ date, updatedTotal }: { date: bigint; updatedTotal: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editPayrollLog(date, updatedTotal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollHistory'] });
    },
  });

  return {
    payrollHistory: payrollHistoryQuery.data,
    isLoading: payrollHistoryQuery.isLoading,
    submitPayrollLog: submitPayrollLogMutation,
    editPayrollLog: editPayrollLogMutation,
  };
}

export function useSpendRecords() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const spendsQuery = useQuery<SpendRecord[]>({
    queryKey: ['spends'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpends();
    },
    enabled: !!actor && !isFetching,
  });

  const createSpendMutation = useMutation({
    mutationFn: async (input: SpendInput) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createSpend(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spends'] });
      queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
    },
  });

  const deleteSpendMutation = useMutation({
    mutationFn: async (spendId: SpendId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteSpend(spendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spends'] });
      queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
    },
  });

  return {
    spends: spendsQuery.data,
    isLoading: spendsQuery.isLoading,
    createSpend: createSpendMutation,
    deleteSpend: deleteSpendMutation,
  };
}

export function useSpendPresets() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const presetsQuery = useQuery<SpendPreset[]>({
    queryKey: ['spendPresets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpendPresets();
    },
    enabled: !!actor && !isFetching,
  });

  const createPresetMutation = useMutation({
    mutationFn: async (preset: SpendPreset) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createPreset(preset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendPresets'] });
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, preset }: { id: bigint; preset: SpendPreset }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updatePreset(id, preset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendPresets'] });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deletePreset(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendPresets'] });
    },
  });

  return {
    presets: presetsQuery.data,
    isLoading: presetsQuery.isLoading,
    createPreset: createPresetMutation,
    updatePreset: updatePresetMutation,
    deletePreset: deletePresetMutation,
  };
}

export function useTaskQueries() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();

  const tasksQuery = useQuery<Task[]>({
    queryKey: ['tasks', testDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });

  const listsQuery = useQuery<List[]>({
    queryKey: ['lists', testDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLists();
    },
    enabled: !!actor && !isFetching,
  });

  const ensureQuadrantsMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.ensureAllQuadrants();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', testDate] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (input: TaskCreateInput) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createTask(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: TaskId; task: TaskUpdateInput }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTask(id, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  // Dedicated completeTask mutation with optimistic updates for instant checkbox feedback
  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: TaskId; completed: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeTask(id, completed);
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', testDate] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', testDate]);
      queryClient.setQueryData<Task[]>(['tasks', testDate], (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === id ? { ...t, completed } : t));
      });
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(['tasks', testDate], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: TaskId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, destinationListId }: { taskId: TaskId; destinationListId: ListId }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.moveTask(taskId, destinationListId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  // updateTaskPosition with optimistic reorder — updates cache instantly, rolls back on error
  const updateTaskPositionMutation = useMutation({
    mutationFn: async ({ taskId, positionIndex }: { taskId: TaskId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTaskPosition(taskId, positionIndex);
    },
    onMutate: async ({ taskId, positionIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', testDate] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', testDate]);

      queryClient.setQueryData<Task[]>(['tasks', testDate], (old) => {
        if (!old) return old;
        const task = old.find((t) => t.id === taskId);
        if (!task) return old;

        // Get tasks in the same list sorted by current order
        const sameList = [...old]
          .filter((t) => t.listId === task.listId)
          .sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));

        // Remove the dragged task, then insert at new position
        const withoutDragged = sameList.filter((t) => t.id !== taskId);
        const pos = Math.max(0, Math.min(Number(positionIndex), withoutDragged.length));
        withoutDragged.splice(pos, 0, task);

        // Assign synthetic order values so the list renders in the right order
        const reordered = withoutDragged.map((t, i) => ({ ...t, order: BigInt((i + 1) * 1000) }));

        // Merge back with tasks from other lists
        const otherTasks = old.filter((t) => t.listId !== task.listId);
        return [...otherTasks, ...reordered];
      });

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(['tasks', testDate], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createList(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', testDate] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: ListId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', testDate] });
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  const quadrants = listsQuery.data?.filter((list) => list.quadrant) || [];
  const customLists = listsQuery.data?.filter((list) => !list.quadrant) || [];

  return {
    tasks: tasksQuery.data || [],
    lists: listsQuery.data || [],
    quadrants,
    customLists,
    isLoading: tasksQuery.isLoading || listsQuery.isLoading,
    quadrantsReady: quadrants.length === 4,
    bootstrapQuadrants: ensureQuadrantsMutation.mutateAsync,
    createTask: createTaskMutation,
    updateTask: updateTaskMutation,
    completeTask: completeTaskMutation,
    deleteTask: deleteTaskMutation,
    moveTask: moveTaskMutation,
    updateTaskPosition: updateTaskPositionMutation,
    createList: createListMutation,
    deleteList: deleteListMutation,
  };
}

export function useMorningRoutineQueries() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();
  const [displayMode, setDisplayModeState] = useState<'normal' | 'reorder'>('normal');

  const routinesQuery = useQuery<MorningRoutine[]>({
    queryKey: ['routines', testDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMorningRoutines();
    },
    enabled: !!actor && !isFetching,
  });

  const createRoutineMutation = useMutation({
    mutationFn: async ({ text, section }: { text: string; section: RoutineSection }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createMorningRoutine(text, section);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', testDate] });
    },
  });

  const updateRoutineMutation = useMutation({
    mutationFn: async ({ id, text, section }: { id: RoutineId; text: string; section: RoutineSection }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateMorningRoutine(id, text, section);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', testDate] });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: RoutineId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMorningRoutine(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', testDate] });
    },
  });

  const completeRoutineMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: RoutineId; completed: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeMorningRoutine(id, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', testDate] });
    },
  });

  // updateRoutineItemPosition with optimistic reorder — updates cache instantly, rolls back on error
  const updateRoutinePositionMutation = useMutation({
    mutationFn: async ({ routineId, positionIndex }: { routineId: RoutineId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateRoutineItemPosition(routineId, positionIndex);
    },
    onMutate: async ({ routineId, positionIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['routines', testDate] });
      const previousRoutines = queryClient.getQueryData<MorningRoutine[]>(['routines', testDate]);

      queryClient.setQueryData<MorningRoutine[]>(['routines', testDate], (old) => {
        if (!old) return old;
        const routine = old.find((r) => r.id === routineId);
        if (!routine) return old;

        // Get routines in the same section sorted by current order
        const sameSection = [...old]
          .filter((r) => r.section === routine.section)
          .sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));

        // Remove the dragged routine, then insert at new position
        const withoutDragged = sameSection.filter((r) => r.id !== routineId);
        const pos = Math.max(0, Math.min(Number(positionIndex), withoutDragged.length));
        withoutDragged.splice(pos, 0, routine);

        // Assign synthetic order values so the list renders in the right order
        const reordered = withoutDragged.map((r, i) => ({ ...r, order: BigInt((i + 1) * 1000) }));

        // Merge back with routines from other sections
        const otherRoutines = old.filter((r) => r.section !== routine.section);
        return [...otherRoutines, ...reordered];
      });

      return { previousRoutines };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousRoutines !== undefined) {
        queryClient.setQueryData(['routines', testDate], context.previousRoutines);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', testDate] });
    },
  });

  const resetNewDayMutation = useMutation({
    mutationFn: async (completedRoutineIds: RoutineId[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.resetNewDay(completedRoutineIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', testDate] });
    },
  });

  const setDisplayMode = (mode: 'normal' | 'reorder' | number) => {
    if (typeof mode === 'number') {
      setDisplayModeState(mode === 1 ? 'reorder' : 'normal');
    } else {
      setDisplayModeState(mode);
    }
  };

  return {
    routines: routinesQuery.data || [],
    isLoading: routinesQuery.isLoading,
    displayMode,
    setDisplayMode,
    createRoutine: createRoutineMutation,
    updateRoutine: updateRoutineMutation,
    deleteRoutine: deleteRoutineMutation,
    completeRoutine: completeRoutineMutation,
    updateRoutinePosition: updateRoutinePositionMutation,
    resetNewDay: resetNewDayMutation,
  };
}
