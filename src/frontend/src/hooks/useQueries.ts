import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Task, List, TaskCreateInput, TaskUpdateInput, TaskId, ListId, UserProfile, MorningRoutine, RoutineSection, RoutineId, MonetarySettings, PayrollRecord, SpendRecord, SpendInput, SpendId, SpendPreset, UserMetadata, UserTier } from '@/backend';
import type { Principal } from '@icp-sdk/core/principal';
import { useState } from 'react';

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

  const tasksQuery = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });

  const listsQuery = useQuery<List[]>({
    queryKey: ['lists'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLists();
    },
    enabled: !!actor && !isFetching,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (input: TaskCreateInput) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createTask(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, input }: { id: TaskId; input: TaskUpdateInput }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTask(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleTaskCompletionMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: TaskId; completed: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeTask(id, completed);
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old;
        return old.map(task => {
          if (task.id === id) {
            return { ...task, completed };
          }
          return task;
        });
      });

      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      console.error('Task completion toggle failed:', err);
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: TaskId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, destinationListId }: { taskId: TaskId; destinationListId: ListId }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.moveTask(taskId, destinationListId);
    },
    onMutate: async ({ taskId, destinationListId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old;
        
        const lists = queryClient.getQueryData<List[]>(['lists']);
        const destinationList = lists?.find(l => l.id === destinationListId);
        
        return old.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              listId: destinationListId,
              urgent: destinationList?.urgent ?? task.urgent,
              important: destinationList?.important ?? task.important,
            };
          }
          return task;
        });
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskPositionMutation = useMutation({
    mutationFn: async ({ taskId, positionIndex }: { taskId: TaskId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTaskPosition(taskId, positionIndex);
    },
    onMutate: async ({ taskId, positionIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old;
        
        const task = old.find(t => t.id === taskId);
        if (!task) return old;

        const tasksInList = old
          .filter(t => t.listId === task.listId)
          .sort((a, b) => Number(a.order) - Number(b.order));

        const targetIndex = Number(positionIndex);
        
        let newOrder: bigint;
        if (tasksInList.length === 0) {
          newOrder = BigInt(1000);
        } else if (targetIndex >= tasksInList.length) {
          const lastTask = tasksInList[tasksInList.length - 1];
          newOrder = lastTask.order + BigInt(1000);
        } else if (targetIndex === 0) {
          const firstTask = tasksInList[0];
          newOrder = firstTask.order > BigInt(1) ? firstTask.order / BigInt(2) : BigInt(500);
        } else {
          const beforeTask = tasksInList[targetIndex - 1];
          const afterTask = tasksInList[targetIndex];
          newOrder = (beforeTask.order + afterTask.order) / BigInt(2);
        }
        
        return old.map(t => {
          if (t.id === taskId) {
            return { ...t, order: newOrder };
          }
          return t;
        });
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createList(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: ListId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const ensureAllQuadrantsMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.ensureAllQuadrants();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const quadrantLists = listsQuery.data?.filter(l => l.quadrant) || [];
  const quadrantsReady = quadrantLists.length === 4;

  const refetchLists = async () => {
    await queryClient.invalidateQueries({ queryKey: ['lists'] });
    await listsQuery.refetch();
  };

  const bootstrapQuadrants = async (): Promise<void> => {
    if (!actor) throw new Error('Actor not initialized');
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 500;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await actor.ensureAllQuadrants();
        
        await queryClient.invalidateQueries({ queryKey: ['lists'] });
        const result = await queryClient.fetchQuery({
          queryKey: ['lists'],
          queryFn: async () => {
            if (!actor) return [];
            return actor.getAllLists();
          },
        });
        
        const quadrants = result.filter(l => l.quadrant);
        if (quadrants.length === 4) {
          return;
        }
        
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Only admins')) {
          throw new Error('Unable to initialize workspace. Please refresh the page and try again.');
        }
        
        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    
    throw new Error('Failed to initialize all quadrants. Please refresh the page to try again.');
  };

  return {
    tasks: tasksQuery.data,
    lists: listsQuery.data,
    isLoading: tasksQuery.isLoading || listsQuery.isLoading,
    quadrantsReady,
    refetchLists,
    bootstrapQuadrants,
    createTask: createTaskMutation,
    updateTask: updateTaskMutation,
    toggleTaskCompletion: toggleTaskCompletionMutation,
    deleteTask: deleteTaskMutation,
    moveTask: moveTaskMutation,
    updateTaskPosition: updateTaskPositionMutation,
    createList: createListMutation,
    deleteList: deleteListMutation,
    initializeQuadrants: ensureAllQuadrantsMutation,
  };
}

export function useMorningRoutineQueries() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const routinesQuery = useQuery<MorningRoutine[]>({
    queryKey: ['morningRoutines'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMorningRoutines();
    },
    enabled: !!actor && !isFetching,
  });

  const displayModeQuery = useQuery<bigint>({
    queryKey: ['displayMode'],
    queryFn: async () => {
      return BigInt(0);
    },
    staleTime: Infinity,
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

  const completeRoutineMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: RoutineId; completed: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeMorningRoutine(id, completed);
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['morningRoutines'] });

      const previousRoutines = queryClient.getQueryData<MorningRoutine[]>(['morningRoutines']);

      queryClient.setQueryData<MorningRoutine[]>(['morningRoutines'], (old) => {
        if (!old) return old;
        return old.map(routine => {
          if (routine.id === id) {
            return { ...routine, completed };
          }
          return routine;
        });
      });

      return { previousRoutines };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRoutines) {
        queryClient.setQueryData(['morningRoutines'], context.previousRoutines);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: RoutineId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMorningRoutine(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const updateRoutinePositionMutation = useMutation({
    mutationFn: async ({ routineId, positionIndex }: { routineId: RoutineId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateRoutineItemPosition(routineId, positionIndex);
    },
    onMutate: async ({ routineId, positionIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['morningRoutines'] });

      const previousRoutines = queryClient.getQueryData<MorningRoutine[]>(['morningRoutines']);

      queryClient.setQueryData<MorningRoutine[]>(['morningRoutines'], (old) => {
        if (!old) return old;
        
        const routine = old.find(r => r.id === routineId);
        if (!routine) return old;

        const routinesInSection = old
          .filter(r => r.section === routine.section)
          .sort((a, b) => Number(a.order) - Number(b.order));

        const targetIndex = Number(positionIndex);
        
        let newOrder: bigint;
        if (routinesInSection.length === 0) {
          newOrder = BigInt(1000);
        } else if (targetIndex >= routinesInSection.length) {
          const lastRoutine = routinesInSection[routinesInSection.length - 1];
          newOrder = lastRoutine.order + BigInt(1000);
        } else if (targetIndex === 0) {
          const firstRoutine = routinesInSection[0];
          newOrder = firstRoutine.order > BigInt(1) ? firstRoutine.order / BigInt(2) : BigInt(500);
        } else {
          const beforeRoutine = routinesInSection[targetIndex - 1];
          const afterRoutine = routinesInSection[targetIndex];
          newOrder = (beforeRoutine.order + afterRoutine.order) / BigInt(2);
        }
        
        return old.map(r => {
          if (r.id === routineId) {
            return { ...r, order: newOrder };
          }
          return r;
        });
      });

      return { previousRoutines };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRoutines) {
        queryClient.setQueryData(['morningRoutines'], context.previousRoutines);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const setDisplayModeMutation = useMutation({
    mutationFn: async (displayMode: number) => {
      return BigInt(displayMode);
    },
    onMutate: async (newMode) => {
      await queryClient.cancelQueries({ queryKey: ['displayMode'] });
      const previousMode = queryClient.getQueryData<bigint>(['displayMode']);
      queryClient.setQueryData<bigint>(['displayMode'], BigInt(newMode));
      return { previousMode };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMode !== undefined) {
        queryClient.setQueryData(['displayMode'], context.previousMode);
      }
    },
  });

  const performDailyResetMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.performRoutineDailyResetIfNeeded();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const resetNewDayMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.resetNewDay();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
      queryClient.invalidateQueries({ queryKey: ['payrollHistory'] });
    },
  });

  return {
    routines: routinesQuery.data,
    displayMode: displayModeQuery.data,
    isLoading: routinesQuery.isLoading,
    createRoutine: createRoutineMutation,
    completeRoutine: completeRoutineMutation,
    deleteRoutine: deleteRoutineMutation,
    updateRoutinePosition: updateRoutinePositionMutation,
    setDisplayMode: setDisplayModeMutation,
    performDailyReset: performDailyResetMutation,
    resetNewDay: resetNewDayMutation,
  };
}
