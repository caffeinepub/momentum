import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Task,
  List,
  TaskId,
  ListId,
  RoutineId,
  MorningRoutine,
  RoutineSection,
  MonetarySettings,
  PayrollRecord,
  SpendRecord,
  SpendPreset,
  SpendInput,
  UserProfile,
  UserMetadata,
  TierLimitsConfig,
  TierLimits,
  UserTier,
} from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { toLocalTask, toLocalList } from '../lib/types';
import type { LocalTask, LocalList } from '../lib/types';
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
      if (!actor) throw new Error('Actor not available');
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

export function useTaskQueries() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();

  const tasksQuery = useQuery<Task[]>({
    queryKey: ['tasks', testDate?.toISOString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !actorFetching,
  });

  const listsQuery = useQuery<List[]>({
    queryKey: ['lists', testDate?.toISOString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLists();
    },
    enabled: !!actor && !actorFetching,
  });

  const tasks: LocalTask[] = (tasksQuery.data || []).map(toLocalTask);
  const lists: LocalList[] = (listsQuery.data || []).map(toLocalList);

  const quadrantLists = lists.filter((list) => list.quadrant);
  const quadrantsReady = quadrantLists.length === 4;

  const createTask = useMutation({
    mutationFn: async ({
      title,
      description,
      listId,
      urgent,
      important,
      isLongTask,
    }: {
      title: string;
      description: string;
      listId: ListId;
      urgent: boolean;
      important: boolean;
      isLongTask: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const defaultOrder = await actor.getDefaultOrder();
      return actor.createTask({
        title,
        description,
        listId,
        urgent,
        important,
        isLongTask,
        order: defaultOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: TaskId;
      updates: Partial<LocalTask>;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const task = await actor.getTask(taskId);
      return actor.updateTask(taskId, {
        title: updates.title ?? task.title,
        description: updates.description ?? task.description,
        listId: updates.listId ?? task.listId,
        urgent: updates.urgent ?? task.urgent,
        important: updates.important ?? task.important,
        isLongTask: updates.isLongTask ?? task.isLongTask,
        completed: updates.completed ?? task.completed,
        order: task.order,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: TaskId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTask(taskId);
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
    mutationFn: async (listId: ListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteList(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const moveTask = useMutation({
    mutationFn: async ({ taskId, destinationListId }: { taskId: TaskId; destinationListId: ListId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveTask(taskId, destinationListId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskPosition = useMutation({
    mutationFn: async ({ taskId, positionIndex }: { taskId: TaskId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskPosition(taskId, positionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bootstrapQuadrants = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.ensureAllQuadrants();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  return {
    tasks,
    lists,
    quadrantsReady,
    createTask,
    updateTask,
    deleteTask,
    createList,
    deleteList,
    moveTask,
    updateTaskPosition,
    bootstrapQuadrants,
  };
}

export function useMorningRoutineQueries() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { testDate } = useTestDate();

  const routinesQuery = useQuery<MorningRoutine[]>({
    queryKey: ['routines', testDate?.toISOString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMorningRoutines();
    },
    enabled: !!actor && !actorFetching,
  });

  const createRoutine = useMutation({
    mutationFn: async ({ text, section }: { text: string; section: RoutineSection }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMorningRoutine(text, section);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: RoutineId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMorningRoutine(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });

  const updateRoutinePosition = useMutation({
    mutationFn: async ({ routineId, positionIndex }: { routineId: RoutineId; positionIndex: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRoutineItemPosition(routineId, positionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });

  const manualResetRoutines = useMutation({
    mutationFn: async (completedRoutineIds: RoutineId[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.manualResetRoutines(completedRoutineIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });

  return {
    routines: routinesQuery.data || [],
    createRoutine,
    deleteRoutine,
    updateRoutinePosition,
    manualResetRoutines,
  };
}

export function usePayrollHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const historyQuery = useQuery<PayrollRecord[]>({
    queryKey: ['payrollHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPayrollHistory();
    },
    enabled: !!actor && !actorFetching,
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
    payrollHistory: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    submitPayrollLog,
    editPayrollLog,
  };
}

export function useAdminUserList() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<UserMetadata[]>({
    queryKey: ['adminUserList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserMetadataWithRoles();
    },
    enabled: !!actor && !actorFetching && !!isAdmin,
  });
}

export function usePromoteToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
      return actor.setUserTier(targetUser, newTier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserList'] });
    },
  });
}

export function useGetAllTierLimits() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<TierLimitsConfig>({
    queryKey: ['tierLimits'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllTierLimits();
    },
    enabled: !!actor && !actorFetching && !!isAdmin,
  });
}

export function useUpdateTierLimits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tier, limits }: { tier: UserTier; limits: TierLimits }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTierLimits(tier, limits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits'] });
    },
  });
}
