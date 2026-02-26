import React, { useState, useCallback } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  useTaskQueries,
  useMorningRoutineQueries,
  useAppMode,
  useEarningsEnabled,
  useMonetarySettings,
  useSpendRecords,
  useSpendPresets,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { LocalTask, LocalList, toLocalTask, toLocalList } from '@/lib/types';
import {
  RoutineSection,
  UserProfile,
  SpendInput,
  SpendPreset,
  MonetarySettings,
  TaskCreateInput,
} from '../backend';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EisenhowerMatrix from '../components/EisenhowerMatrix';
import CustomLists from '../components/CustomLists';
import MorningRoutine from '../components/MorningRoutine';
import BottomNavigation from '../components/BottomNavigation';
import UniversalAddTaskDialog from '../components/UniversalAddTaskDialog';
import CreateListDialog from '../components/CreateListDialog';
import EditTaskDialog from '../components/EditTaskDialog';
import SettingsDialog from '../components/SettingsDialog';
import TodayEarnsDialog from '../components/TodayEarnsDialog';
import SpendPlanDialog from '../components/SpendPlanDialog';
import InsightsDialog from '../components/InsightsDialog';
import UserInfoDialog from '../components/UserInfoDialog';
import UserProfileSetup from '../components/UserProfileSetup';
import AuthBootstrapLoading from '../components/AuthBootstrapLoading';
import UnauthenticatedScreen from '../components/UnauthenticatedScreen';
import PlanModeTipDialog from '../components/PlanModeTipDialog';
import { usePlanModeTip } from '../hooks/usePlanModeTip';
import { toast } from 'sonner';
import { normalizeError } from '../utils/tierErrors';

interface TaskManagerProps {
  onOpenAdminDashboard: () => void;
}

const MORNING_SEEDS = [
  { text: '🌅 Wake up & drink water', section: RoutineSection.top },
  { text: '🧘 5-min stretch or breathe', section: RoutineSection.top },
  { text: '📓 Write 3 intentions', section: RoutineSection.top },
  { text: '🚫 No phone first 30 min', section: RoutineSection.top },
];

const EVENING_SEEDS = [
  { text: "📋 Review today's tasks", section: RoutineSection.bottom },
  { text: "📝 Plan tomorrow's top 3", section: RoutineSection.bottom },
  { text: '📵 Screen-free 1hr before bed', section: RoutineSection.bottom },
  { text: '🙏 Note 3 things grateful for', section: RoutineSection.bottom },
  { text: '😴 Sleep by target time', section: RoutineSection.bottom },
];

const TaskManager: React.FC<TaskManagerProps> = ({ onOpenAdminDashboard }) => {
  const { identity, isInitializing, login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { actor } = useActor();

  const isAuthenticated = !!identity;

  // Profile
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  // App mode
  const { data: appMode } = useAppMode();
  const isPlanMode = appMode === 'plan';

  // Plan mode tip — use markAsShown (the actual returned key)
  const planModeTip = usePlanModeTip(identity?.getPrincipal().toString());
  const showPlanTip = planModeTip.shouldShow;
  const dismissPlanTip = planModeTip.markAsShown;

  // Task queries
  const {
    tasks: rawTasks,
    lists: rawLists,
    isLoading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    updateTaskContainerAndPosition,
    createList,
    deleteList,
  } = useTaskQueries();

  // Routine queries
  const {
    routines,
    isLoading: routinesLoading,
    createRoutine,
    deleteRoutine,
    reorderRoutine,
    resetNewDay,
  } = useMorningRoutineQueries();

  // Monetary
  const { data: earningsEnabled } = useEarningsEnabled();
  const { data: monetarySettings } = useMonetarySettings();
  const { data: spendRecords } = useSpendRecords();
  const { data: spendPresets } = useSpendPresets();

  // Local state
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTodayEarnsOpen, setIsTodayEarnsOpen] = useState(false);
  const [isSpendPlanOpen, setIsSpendPlanOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [preSelectedListId, setPreSelectedListId] = useState<bigint | null | undefined>(undefined);
  const [isTogglingEarnings, setIsTogglingEarnings] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSubmittingPayroll, setIsSubmittingPayroll] = useState(false);
  const [isCreatingSpend, setIsCreatingSpend] = useState(false);
  const [isDeletingSpend, setIsDeletingSpend] = useState(false);

  // Routine UI state (lifted here since MorningRoutine needs them)
  const [morningDisplayMode, setMorningDisplayMode] = useState(0);
  const [eveningDisplayMode, setEveningDisplayMode] = useState(0);
  const [isMorningExpanded, setIsMorningExpanded] = useState(true);
  const [isEveningExpanded, setIsEveningExpanded] = useState(true);
  const [checkedRoutineIds, setCheckedRoutineIds] = useState<Set<bigint>>(new Set());

  // Convert to local types
  const tasks: LocalTask[] = (rawTasks ?? []).map(toLocalTask);
  const lists: LocalList[] = (rawLists ?? []).map(toLocalList);

  const quadrantsReady = lists.some((l) => l.quadrant);

  const morningRoutines = (routines ?? []).filter((r) => r.section === RoutineSection.top);
  const eveningRoutines = (routines ?? []).filter((r) => r.section === RoutineSection.bottom);

  // Seeding routines for new users
  const hasSeeded = React.useRef(false);
  React.useEffect(() => {
    if (
      !hasSeeded.current &&
      isAuthenticated &&
      !routinesLoading &&
      routines !== undefined &&
      routines.length === 0 &&
      actor
    ) {
      hasSeeded.current = true;
      const seedRoutines = async () => {
        try {
          for (const seed of MORNING_SEEDS) {
            await actor.createMorningRoutine(seed.text, seed.section);
          }
          for (const seed of EVENING_SEEDS) {
            await actor.createMorningRoutine(seed.text, seed.section);
          }
          queryClient.invalidateQueries({ queryKey: ['morningRoutines'] });
        } catch {
          // Silently fail seeding
        }
      };
      seedRoutines();
    }
  }, [isAuthenticated, routinesLoading, routines, actor, queryClient]);

  // Handlers
  const handleToggleComplete = useCallback(
    async (localId: string) => {
      const task = tasks.find((t) => t.localId === localId);
      if (!task) return;
      try {
        await updateTask.mutateAsync({
          id: task.id,
          updatedTask: {
            title: task.title,
            description: task.description,
            completed: !task.completed,
            urgent: task.urgent,
            important: task.important,
            isLongTask: task.isLongTask,
            listId: task.listId,
            order: task.order,
          },
        });
      } catch (err) {
        toast.error(normalizeError(err));
      }
    },
    [tasks, updateTask]
  );

  const handleEditTask = useCallback((localId: string) => {
    setEditTaskId(localId);
  }, []);

  const handleUpdateTaskContainerAndPosition = useCallback(
    async (taskId: bigint, newContainerId: bigint, positionIndex: bigint) => {
      await updateTaskContainerAndPosition.mutateAsync({
        taskId,
        newContainerId,
        positionIndex,
      });
    },
    [updateTaskContainerAndPosition]
  );

  const handleReorderTask = useCallback(
    async (taskId: bigint, positionIndex: bigint) => {
      await reorderTask.mutateAsync({ taskId, positionIndex });
    },
    [reorderTask]
  );

  const handleAddTask = useCallback((listId?: bigint | null) => {
    setPreSelectedListId(listId ?? undefined);
    setIsAddTaskOpen(true);
  }, []);

  const handleAddList = useCallback(() => {
    setIsCreateListOpen(true);
  }, []);

  const handleDeleteTask = useCallback(
    async (localId: string) => {
      const task = tasks.find((t) => t.localId === localId);
      if (!task) return;
      try {
        await deleteTask.mutateAsync(task.id);
        setEditTaskId(null);
      } catch (err) {
        toast.error(normalizeError(err));
      }
    },
    [tasks, deleteTask]
  );

  const handleDeleteList = useCallback(
    async (localId: string) => {
      const list = lists.find((l) => l.localId === localId);
      if (!list) return;
      try {
        await deleteList.mutateAsync(list.id);
      } catch (err) {
        toast.error(normalizeError(err));
      }
    },
    [lists, deleteList]
  );

  const handleCreateRoutine = useCallback(
    async (text: string, section: RoutineSection): Promise<void> => {
      await createRoutine.mutateAsync({ text, section });
    },
    [createRoutine]
  );

  const handleDeleteRoutine = useCallback(
    async (id: bigint): Promise<void> => {
      await deleteRoutine.mutateAsync(id);
    },
    [deleteRoutine]
  );

  const handleReorderRoutine = useCallback(
    async (routineId: bigint, positionIndex: bigint): Promise<void> => {
      await reorderRoutine.mutateAsync({ routineId, positionIndex });
    },
    [reorderRoutine]
  );

  const handleToggleRoutineChecked = useCallback((id: bigint) => {
    setCheckedRoutineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Header's onResetNewDay expects () => void — it calls this then closes dialog
  const handleResetNewDay = useCallback((): void => {
    const completedIds = Array.from(checkedRoutineIds);
    resetNewDay.mutateAsync(completedIds).then(() => {
      setCheckedRoutineIds(new Set());
      toast.success('New day started! All routines have been reset.');
    }).catch((err) => {
      toast.error(normalizeError(err));
    });
  }, [checkedRoutineIds, resetNewDay]);

  const handleSaveProfile = useCallback(
    async (profile: UserProfile): Promise<void> => {
      setIsSavingProfile(true);
      try {
        await actor?.saveCallerUserProfile(profile);
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        toast.success('Profile saved!');
      } catch {
        toast.error('Failed to save profile');
      } finally {
        setIsSavingProfile(false);
      }
    },
    [actor, queryClient]
  );

  const handleCreateSpend = useCallback(
    async (input: SpendInput): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      setIsCreatingSpend(true);
      try {
        const result = await actor.createSpend(input);
        queryClient.invalidateQueries({ queryKey: ['spendRecords'] });
        queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
        return result;
      } finally {
        setIsCreatingSpend(false);
      }
    },
    [actor, queryClient]
  );

  const handleDeleteSpend = useCallback(
    async (spendId: bigint): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      setIsDeletingSpend(true);
      try {
        await actor.deleteSpend(spendId);
        queryClient.invalidateQueries({ queryKey: ['spendRecords'] });
        queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
      } finally {
        setIsDeletingSpend(false);
      }
    },
    [actor, queryClient]
  );

  const handleCreatePreset = useCallback(
    async (preset: SpendPreset): Promise<bigint> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createPreset(preset);
      queryClient.invalidateQueries({ queryKey: ['spendPresets'] });
      return result;
    },
    [actor, queryClient]
  );

  const handleUpdatePreset = useCallback(
    async (id: bigint, preset: SpendPreset): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePreset(id, preset);
      queryClient.invalidateQueries({ queryKey: ['spendPresets'] });
    },
    [actor, queryClient]
  );

  const handleDeletePreset = useCallback(
    async (id: bigint): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePreset(id);
      queryClient.invalidateQueries({ queryKey: ['spendPresets'] });
    },
    [actor, queryClient]
  );

  const handleSubmitPayroll = useCallback(
    async (date: bigint): Promise<void> => {
      setIsSubmittingPayroll(true);
      try {
        if (!actor) throw new Error('Actor not available');
        await actor.submitPayrollLog(date);
        queryClient.invalidateQueries({ queryKey: ['payrollHistory'] });
        queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
      } finally {
        setIsSubmittingPayroll(false);
      }
    },
    [actor, queryClient]
  );

  const handleToggleEarnings = useCallback(
    async (enabled: boolean): Promise<void> => {
      setIsTogglingEarnings(true);
      try {
        await actor?.toggleEarningsSystem(enabled);
        queryClient.invalidateQueries({ queryKey: ['earningsEnabled'] });
      } finally {
        setIsTogglingEarnings(false);
      }
    },
    [actor, queryClient]
  );

  const handleSaveMonetarySettings = useCallback(
    async (settings: MonetarySettings): Promise<void> => {
      setIsSavingSettings(true);
      try {
        if (!actor) throw new Error('Actor not available');
        await actor.saveMonetarySettings(settings);
        queryClient.invalidateQueries({ queryKey: ['monetarySettings'] });
      } finally {
        setIsSavingSettings(false);
      }
    },
    [actor, queryClient]
  );

  // UniversalAddTaskDialog expects (title, description, listId, urgent, important, isLongTask)
  const handleCreateTask = useCallback(
    (
      title: string,
      description: string,
      listId: bigint,
      urgent: boolean,
      important: boolean,
      isLongTask: boolean
    ): void => {
      const input: TaskCreateInput = {
        title,
        description,
        urgent,
        important,
        isLongTask,
        listId,
        order: BigInt(1000),
      };
      createTask.mutateAsync(input).then(() => {
        setIsAddTaskOpen(false);
      }).catch((err) => {
        toast.error(normalizeError(err));
      });
    },
    [createTask]
  );

  // Loading / auth states
  if (isInitializing) return <AuthBootstrapLoading />;
  if (!isAuthenticated)
    return (
      <UnauthenticatedScreen
        onLogin={login}
        isLoggingIn={loginStatus === 'logging-in'}
      />
    );
  if (showProfileSetup) {
    return <UserProfileSetup />;
  }

  const editingTask = editTaskId ? tasks.find((t) => t.localId === editTaskId) ?? null : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header uses its own internal reset logic; we pass a simple () => void callback */}
      <Header
        onOpenAdminDashboard={onOpenAdminDashboard}
        onResetNewDay={handleResetNewDay}
        isResettingDay={resetNewDay.isPending}
      />

      <main className="flex-1 px-3 pt-3 pb-32 space-y-4 max-w-2xl mx-auto w-full">
        {/* Morning Routine */}
        <MorningRoutine
          section={RoutineSection.top}
          routines={morningRoutines}
          onCreateRoutine={handleCreateRoutine}
          onDeleteRoutine={handleDeleteRoutine}
          onReorderRoutine={handleReorderRoutine}
          isLoading={routinesLoading}
          displayMode={morningDisplayMode}
          onToggleDisplayMode={setMorningDisplayMode}
          isExpanded={isMorningExpanded}
          onToggleExpand={() => setIsMorningExpanded((v) => !v)}
          checkedRoutineIds={checkedRoutineIds}
          onToggleChecked={handleToggleRoutineChecked}
        />

        {/* Daily Priorities (Eisenhower Matrix) */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
            Daily Priorities
          </h2>
          <EisenhowerMatrix
            tasks={tasks}
            lists={lists}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            editTaskId={editTaskId}
            setEditTaskId={setEditTaskId}
            onUpdateTaskContainerAndPosition={handleUpdateTaskContainerAndPosition}
            onReorderTask={handleReorderTask}
          />
        </section>

        {/* Evening Routine */}
        <MorningRoutine
          section={RoutineSection.bottom}
          routines={eveningRoutines}
          onCreateRoutine={handleCreateRoutine}
          onDeleteRoutine={handleDeleteRoutine}
          onReorderRoutine={handleReorderRoutine}
          isLoading={routinesLoading}
          displayMode={eveningDisplayMode}
          onToggleDisplayMode={setEveningDisplayMode}
          isExpanded={isEveningExpanded}
          onToggleExpand={() => setIsEveningExpanded((v) => !v)}
          checkedRoutineIds={checkedRoutineIds}
          onToggleChecked={handleToggleRoutineChecked}
        />

        {/* Custom Lists */}
        {lists.filter((l) => !l.quadrant).length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Other Lists</h2>
            <CustomLists
              tasks={tasks}
              lists={lists}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              editTaskId={editTaskId}
              setEditTaskId={setEditTaskId}
              onDeleteList={handleDeleteList}
              onUpdateTaskContainerAndPosition={handleUpdateTaskContainerAndPosition}
              onReorderTask={handleReorderTask}
            />
          </section>
        )}
      </main>

      <Footer />

      <BottomNavigation
        isPlanMode={isPlanMode}
        onSwitchMode={() => {}}
        onAddTask={() => handleAddTask()}
        onAddList={handleAddList}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTodayEarns={() => setIsTodayEarnsOpen(true)}
        onOpenSpendPlan={() => setIsSpendPlanOpen(true)}
        onOpenInsights={() => setIsInsightsOpen(true)}
        earningsEnabled={earningsEnabled ?? false}
        onOpenUserInfo={() => setIsUserInfoOpen(true)}
      />

      {/* Dialogs */}
      <UniversalAddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        lists={lists}
        onCreateTask={handleCreateTask}
        isLoading={createTask.isPending}
        quadrantsReady={quadrantsReady}
        preSelectedListId={preSelectedListId}
      />

      <CreateListDialog
        open={isCreateListOpen}
        onOpenChange={setIsCreateListOpen}
        onCreateList={async (name) => {
          try {
            await createList.mutateAsync(name);
            setIsCreateListOpen(false);
          } catch (err) {
            toast.error(normalizeError(err));
          }
        }}
        isLoading={createList.isPending}
      />

      {editingTask && (
        <EditTaskDialog
          open={!!editTaskId}
          onOpenChange={(open) => {
            if (!open) setEditTaskId(null);
          }}
          task={editingTask}
          lists={lists}
          onUpdateTask={async (taskId, updates) => {
            const task = tasks.find((t) => t.id === taskId);
            if (!task) return;
            try {
              await updateTask.mutateAsync({
                id: taskId,
                updatedTask: {
                  title: updates.title ?? task.title,
                  description: updates.description ?? task.description,
                  completed: updates.completed ?? task.completed,
                  urgent: updates.urgent ?? task.urgent,
                  important: updates.important ?? task.important,
                  isLongTask: updates.isLongTask ?? task.isLongTask,
                  listId: updates.listId ?? task.listId,
                  order: updates.order ?? task.order,
                },
              });
              setEditTaskId(null);
            } catch (err) {
              toast.error(normalizeError(err));
            }
          }}
          onDeleteTask={async (taskId) => {
            const task = tasks.find((t) => t.id === taskId);
            if (!task) return;
            await handleDeleteTask(task.localId);
          }}
          isLoading={updateTask.isPending}
        />
      )}

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        monetarySettings={monetarySettings}
        earningsEnabled={earningsEnabled ?? false}
        onToggleEarnings={handleToggleEarnings}
        onSaveSettings={handleSaveMonetarySettings}
        isSaving={isSavingSettings}
        isTogglingEarnings={isTogglingEarnings}
      />

      {earningsEnabled && (
        <>
          <TodayEarnsDialog
            open={isTodayEarnsOpen}
            onOpenChange={setIsTodayEarnsOpen}
            tasks={tasks}
            routines={routines ?? []}
            monetarySettings={monetarySettings}
            onSubmitPayroll={handleSubmitPayroll}
            isSubmitting={isSubmittingPayroll}
          />

          <SpendPlanDialog
            open={isSpendPlanOpen}
            onOpenChange={setIsSpendPlanOpen}
            spends={spendRecords ?? []}
            presets={spendPresets ?? []}
            monetarySettings={monetarySettings}
            onCreateSpend={handleCreateSpend}
            onDeleteSpend={handleDeleteSpend}
            onCreatePreset={handleCreatePreset}
            onUpdatePreset={handleUpdatePreset}
            onDeletePreset={handleDeletePreset}
            isCreating={isCreatingSpend}
            isDeleting={isDeletingSpend}
          />

          <InsightsDialog
            open={isInsightsOpen}
            onOpenChange={setIsInsightsOpen}
            spends={spendRecords ?? []}
            monetarySettings={monetarySettings}
          />
        </>
      )}

      <UserInfoDialog
        open={isUserInfoOpen}
        onOpenChange={setIsUserInfoOpen}
        userProfile={userProfile ?? null}
        onSaveProfile={handleSaveProfile}
        isSavingProfile={isSavingProfile}
      />

      {showPlanTip && isPlanMode && (
        <PlanModeTipDialog
          open={showPlanTip}
          onOpenChange={(open) => {
            if (!open) dismissPlanTip();
          }}
          onDismiss={dismissPlanTip}
        />
      )}
    </div>
  );
};

export default TaskManager;
