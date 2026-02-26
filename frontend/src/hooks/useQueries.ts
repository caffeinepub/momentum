import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  Task,
  List,
  MorningRoutine,
  RoutineSection,
  TaskCreateInput,
  TaskUpdateInput,
  MonetarySettings,
  SpendPreset,
  UserProfile,
  UserTier,
  TierLimits,
  UserMetadata,
  StorageMetrics,
  UserStorageBreakdown,
  TierLimitsConfig,
} from '../backend';
import { TaskId, ListId, RoutineId } from '../backend';
import { Principal } from '@dfinity/principal';

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

export function useAppMode() {
  return useQuery<'home' | 'plan'>({
    queryKey: ['appMode'],
    queryFn: () => 'home',
    staleTime: Infinity,
  });
}

export function useEarningsEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['earningsEnabled'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getEarningsEnabled();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonetarySettings() {
  const { actor, isFetching } = useActor();
  return useQuery<MonetarySettings>({
    queryKey: ['monetarySettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMonetarySettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSpendRecords() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['spendRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpends();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSpendPresets() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['spendPresets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpendPresets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePayrollHistory() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['payrollHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPayrollHistory();
    },
    enabled: !!actor && !isFetching,
  });

  const submitPayrollLog = useMutation({
    mutationFn: async (date: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPayrollLog(date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollHistory'] });
      queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
    },
  });

  const editPayrollLog = useMutation({
    mutationFn: async ({ date, updatedTotal }: { date: bigint; updatedTotal: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editPayrollLog(date, updatedTotal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollHistory'] });
    },
  });

  return {
    payrollHistory: query.data,
    isLoading: query.isLoading,
    submitPayrollLog,
    editPayrollLog,
  };
}

export function useAdminUserList() {
  const { actor, isFetching } = useActor();
  return useQuery<UserMetadata[]>({
    queryKey: ['adminUserList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserMetadataWithRoles();
    },
    enabled: !!actor && !isFetching,
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

export function useGetRegisteredUserCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['registeredUserCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePromoteToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.promoteToAdmin(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
    },
  });
}

export function useRemoveAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeAdmin(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
    },
  });
}

export function useSetUserTier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUser, newTier }: { targetUser: Principal; newTier: UserTier }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserTier(targetUser, newTier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
    },
  });
}

export function useGetAllTierLimits() {
  const { actor, isFetching } = useActor();
  return useQuery<TierLimitsConfig>({
    queryKey: ['tierLimits'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllTierLimits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateTierLimits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tier, newLimits }: { tier: UserTier; newLimits: TierLimits }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTierLimits(tier, newLimits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits'] });
    },
  });
}

export function useGetOverallStorageMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<StorageMetrics>({
    queryKey: ['overallStorageMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getOverallStorageMetrics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUserStorageBreakdowns() {
  const { actor, isFetching } = useActor();
  return useQuery<UserStorageBreakdown[]>({
    queryKey: ['allUserStorageBreakdowns'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUserStorageBreakdowns();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useResetSkippedDay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetSkippedDay();
    },
    onSuccess: () => {
      queryClient.setQueriesData(
        { queryKey: ['morningRoutines'] },
        (old: MorningRoutine[] | undefined) => {
          if (!old) return old;
          return old.map((r) => ({ ...r, completed: false, streakCount: BigInt(0) }));
        }
      );
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });
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

  const createTask = useMutation({
    mutationFn: async (input: TaskCreateInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTask(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updatedTask }: { id: TaskId; updatedTask: TaskUpdateInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTask(id, updatedTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: TaskId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reorderTask = useMutation({
    mutationFn: async ({ taskId, positionIndex }: { taskId: TaskId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reorderTask(taskId, positionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskContainerAndPosition = useMutation({
    mutationFn: async ({
      taskId,
      newContainerId,
      positionIndex,
    }: {
      taskId: TaskId;
      newContainerId: ListId;
      positionIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskContainerAndPosition(taskId, newContainerId, positionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createList = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createList(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: ListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const ensureQuadrants = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.ensureAllQuadrants();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  return {
    tasks: tasksQuery.data,
    lists: listsQuery.data,
    isLoading: tasksQuery.isLoading || listsQuery.isLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    updateTaskContainerAndPosition,
    createList,
    deleteList,
    ensureQuadrants,
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

  const createRoutine = useMutation({
    mutationFn: async ({ text, section }: { text: string; section: RoutineSection }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMorningRoutine(text, section);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: async ({
      id,
      text,
      section,
    }: {
      id: RoutineId;
      text: string;
      section: RoutineSection;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMorningRoutine(id, text, section);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: RoutineId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMorningRoutine(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const completeRoutine = useMutation({
    mutationFn: async ({ id, completed }: { id: RoutineId; completed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.completeMorningRoutine(id, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const reorderRoutine = useMutation({
    mutationFn: async ({
      routineId,
      positionIndex,
    }: {
      routineId: RoutineId;
      positionIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRoutineItemPosition(routineId, positionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const resetNewDay = useMutation({
    mutationFn: async (completedRoutineIds: RoutineId[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetNewDay(completedRoutineIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  const resetSkippedDay = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetSkippedDay();
    },
    onSuccess: () => {
      queryClient.setQueriesData(
        { queryKey: ['morningRoutines'] },
        (old: MorningRoutine[] | undefined) => {
          if (!old) return old;
          return old.map((r) => ({ ...r, completed: false, streakCount: BigInt(0) }));
        }
      );
      queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
    },
  });

  return {
    routines: routinesQuery.data,
    isLoading: routinesQuery.isLoading,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    completeRoutine,
    reorderRoutine,
    resetNewDay,
    resetSkippedDay,
  };
}
