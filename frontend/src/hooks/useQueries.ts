import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Task,
  List,
  TaskCreateInput,
  TaskUpdateInput,
  TaskId,
  ListId,
  UserProfile,
  MorningRoutine,
  RoutineSection,
  RoutineId,
  MonetarySettings,
  PayrollRecord,
  SpendRecord,
  SpendInput,
  SpendId,
  SpendPreset,
  UserMetadata,
  UserTier,
  TierLimitsConfig,
  TierLimits,
  StorageMetrics,
  UserStorageBreakdown,
} from '@/backend';
import type { Principal } from '@icp-sdk/core/principal';
import { useTestDate } from './useTestDate';

// ─── User Profile ─────────────────────────────────────────────────────────────

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

// ─── Admin ────────────────────────────────────────────────────────────────────

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
    mutationFn: async ({ tier, newLimits }: { tier: UserTier; newLimits: TierLimits }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTierLimits(tier, newLimits);
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

// ─── App Mode (client-only) ───────────────────────────────────────────────────

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

// ─── Earnings ─────────────────────────────────────────────────────────────────

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

// ─── Monetary Settings ────────────────────────────────────────────────────────

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

// ─── Payroll History ──────────────────────────────────────────────────────────

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

// ─── Spend Records ────────────────────────────────────────────────────────────

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

// ─── Spend Presets ────────────────────────────────────────────────────────────

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

// ─── Tasks + Lists (composite) ────────────────────────────────────────────────

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

  // Move task to a different list using the backend's moveTaskToList method.
  // taskId: the task to move
  // destinationListId: the target list
  // newPosition: the target index within the destination list (0-based); defaults to appending at end
  const moveTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      destinationListId,
      newPosition,
    }: {
      taskId: TaskId;
      destinationListId: ListId;
      newPosition?: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      // If no position given, get current task count in destination to append at end
      const currentTasks = queryClient.getQueryData<Task[]>(['tasks', testDate]) || [];
      const destTasks = currentTasks.filter((t) => t.listId === destinationListId);
      const position = newPosition ?? BigInt(destTasks.length);
      return actor.moveTaskToList(taskId, destinationListId, position);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', testDate] });
    },
  });

  // Reorder a task within its current list by updating its order value via updateTask.
  // Uses client-side sparse index calculation then calls actor.updateTask.
  const updateTaskPositionMutation = useMutation({
    mutationFn: async ({
      taskId,
      positionIndex,
    }: {
      taskId: TaskId;
      positionIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const currentTasks = queryClient.getQueryData<Task[]>(['tasks', testDate]) || [];
      const task = currentTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const listTasks = currentTasks
        .filter((t) => t.listId === task.listId)
        .sort((a, b) => Number(a.order) - Number(b.order));

      const idx = Number(positionIndex);
      const numTasks = listTasks.length;

      let newOrder: bigint;
      if (numTasks <= 1) {
        newOrder = BigInt(1000);
      } else if (idx <= 0) {
        const first = listTasks[0];
        newOrder = first.order > BigInt(1) ? first.order / BigInt(2) : BigInt(1000);
      } else if (idx >= numTasks) {
        const last = listTasks[numTasks - 1];
        newOrder = last.order + BigInt(1000);
      } else {
        const before = listTasks[idx - 1];
        const after = listTasks[idx];
        newOrder = (before.order + after.order) / BigInt(2);
      }

      const updatedTask: TaskUpdateInput = {
        title: task.title,
        description: task.description,
        completed: task.completed,
        urgent: task.urgent,
        important: task.important,
        isLongTask: task.isLongTask,
        listId: task.listId,
        order: newOrder,
      };

      return actor.updateTask(taskId, updatedTask);
    },
    onSuccess: () => {
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

  return {
    tasks: tasksQuery.data,
    lists: listsQuery.data,
    isLoading: tasksQuery.isLoading || listsQuery.isLoading,
    ensureQuadrants: ensureQuadrantsMutation,
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

// ─── Morning Routines (composite) ─────────────────────────────────────────────

export function useMorningRoutineQueries() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();

  const routinesQuery = useQuery<MorningRoutine[]>({
    queryKey: ['morningRoutines', testDate],
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
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: RoutineId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMorningRoutine(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['morningRoutines', testDate] });
      const previousRoutines = queryClient.getQueryData<MorningRoutine[]>(['morningRoutines', testDate]);
      queryClient.setQueryData<MorningRoutine[]>(['morningRoutines', testDate], (old) => {
        if (!old) return old;
        return old.filter((r) => r.id !== id);
      });
      return { previousRoutines };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRoutines !== undefined) {
        queryClient.setQueryData(['morningRoutines', testDate], context.previousRoutines);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const completeRoutineMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: RoutineId; completed: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeMorningRoutine(id, completed);
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['morningRoutines', testDate] });
      const previousRoutines = queryClient.getQueryData<MorningRoutine[]>(['morningRoutines', testDate]);
      queryClient.setQueryData<MorningRoutine[]>(['morningRoutines', testDate], (old) => {
        if (!old) return old;
        return old.map((r) => (r.id === id ? { ...r, completed } : r));
      });
      return { previousRoutines };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRoutines !== undefined) {
        queryClient.setQueryData(['morningRoutines', testDate], context.previousRoutines);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const resetNewDayMutation = useMutation({
    mutationFn: async (completedRoutineIds: RoutineId[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.resetNewDay(completedRoutineIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', testDate] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', null] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', undefined] });
    },
  });

  const resetSkippedDayMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.resetSkippedDay();
    },
    onMutate: async () => {
      // Optimistic update: immediately mark all routines as unchecked with streak 0
      const allCacheKeys = queryClient.getQueryCache().getAll();
      const snapshots: Array<{ key: unknown[]; data: MorningRoutine[] | undefined }> = [];
      for (const cacheEntry of allCacheKeys) {
        const key = cacheEntry.queryKey;
        if (Array.isArray(key) && key[0] === 'morningRoutines') {
          const data = queryClient.getQueryData<MorningRoutine[]>(key);
          snapshots.push({ key, data });
          if (data) {
            queryClient.setQueryData<MorningRoutine[]>(key, (old) => {
              if (!old) return old;
              return old.map((r) => ({ ...r, completed: false, streakCount: BigInt(0) }));
            });
          }
        }
      }
      return { snapshots };
    },
    onError: (_err, _variables, context) => {
      if (context?.snapshots) {
        for (const { key, data } of context.snapshots) {
          if (data !== undefined) {
            queryClient.setQueryData(key, data);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', testDate] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', null] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', undefined] });
    },
  });

  const updateRoutineItemPositionMutation = useMutation({
    mutationFn: async ({
      routineId,
      positionIndex,
    }: {
      routineId: RoutineId;
      positionIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateRoutineItemPosition(routineId, positionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  return {
    routines: routinesQuery.data,
    isLoading: routinesQuery.isLoading,
    createRoutine: createRoutineMutation,
    deleteRoutine: deleteRoutineMutation,
    completeRoutine: completeRoutineMutation,
    resetNewDay: resetNewDayMutation,
    resetSkippedDay: resetSkippedDayMutation,
    updateRoutineItemPosition: updateRoutineItemPositionMutation,
  };
}

// ─── Standalone useResetSkippedDay (used by Header.tsx) ───────────────────────
// This is a standalone hook that wraps the resetSkippedDay backend call,
// used by Header.tsx which needs direct access without the full routine composite hook.

export function useResetSkippedDay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.resetSkippedDay();
    },
    onMutate: async () => {
      // Optimistic update across all morningRoutines cache keys
      const allCacheKeys = queryClient.getQueryCache().getAll();
      const snapshots: Array<{ key: unknown[]; data: MorningRoutine[] | undefined }> = [];
      for (const cacheEntry of allCacheKeys) {
        const key = cacheEntry.queryKey;
        if (Array.isArray(key) && key[0] === 'morningRoutines') {
          const data = queryClient.getQueryData<MorningRoutine[]>(key);
          snapshots.push({ key, data });
          if (data) {
            queryClient.setQueryData<MorningRoutine[]>(key, (old) => {
              if (!old) return old;
              return old.map((r) => ({ ...r, completed: false, streakCount: BigInt(0) }));
            });
          }
        }
      }
      return { snapshots };
    },
    onError: (_err, _variables, context) => {
      if (context?.snapshots) {
        for (const { key, data } of context.snapshots) {
          if (data !== undefined) {
            queryClient.setQueryData(key, data);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', testDate] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', null] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines', undefined] });
    },
  });
}
