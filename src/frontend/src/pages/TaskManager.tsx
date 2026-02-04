import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useTaskQueries, useMorningRoutineQueries, useAppMode, useEarningsEnabled, useMonetarySettings, useSpendRecords, useSpendPresets } from '../hooks/useQueries';
import { toLocalTask, toLocalList, type LocalTask, type LocalList } from '../lib/types';
import { writeDragPayload, readDragPayload } from '../utils/dragPayload';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EisenhowerMatrix from '../components/EisenhowerMatrix';
import CustomLists from '../components/CustomLists';
import MorningRoutine from '../components/MorningRoutine';
import UserProfileSetup from '../components/UserProfileSetup';
import BottomNavigation from '../components/BottomNavigation';
import SettingsDialog from '../components/SettingsDialog';
import TodayEarnsDialog from '../components/TodayEarnsDialog';
import SpendPlanDialog from '../components/SpendPlanDialog';
import InsightsDialog from '../components/InsightsDialog';
import UniversalAddTaskDialog from '../components/UniversalAddTaskDialog';
import CreateListDialog from '../components/CreateListDialog';
import EditTaskDialog from '../components/EditTaskDialog';
import AuthBootstrapLoading from '../components/AuthBootstrapLoading';
import UnauthenticatedScreen from '../components/UnauthenticatedScreen';
import { RoutineSection, type TaskCreateInput, type TaskUpdateInput } from '@/backend';
import { toast } from 'sonner';

export default function TaskManager() {
  const { identity, login, loginStatus, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { 
    tasks, 
    lists, 
    isLoading: dataLoading, 
    quadrantsReady,
    bootstrapQuadrants,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    moveTask,
    updateTaskPosition,
    createList,
    deleteList,
  } = useTaskQueries();
  
  const { 
    routines, 
    resetNewDay,
    createRoutine,
    completeRoutine,
    deleteRoutine,
    updateRoutinePosition,
    displayMode,
    setDisplayMode,
  } = useMorningRoutineQueries();
  
  const { appMode, setAppMode } = useAppMode();
  const { earningsEnabled, toggleEarningsSystem } = useEarningsEnabled();
  const { monetarySettings, saveMonetarySettings, addPayroll } = useMonetarySettings();
  const { spends, createSpend, deleteSpend } = useSpendRecords();
  const { presets, createPreset, updatePreset, deletePreset } = useSpendPresets();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [todayEarnsOpen, setTodayEarnsOpen] = useState(false);
  const [spendPlanOpen, setSpendPlanOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LocalTask | null>(null);
  const [preSelectedListId, setPreSelectedListId] = useState<bigint | null>(null);
  
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(true);
  const [isMorningExpanded, setIsMorningExpanded] = useState(true);
  const [isEveningExpanded, setIsEveningExpanded] = useState(true);
  const [bootstrapState, setBootstrapState] = useState<'idle' | 'running' | 'complete' | 'failed'>('idle');

  // Plan mode subview state: 'lists' shows CustomLists, 'routines' shows Morning/Evening routines
  const [planSubview, setPlanSubview] = useState<'lists' | 'routines'>('lists');

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Bootstrap quadrants and reset new day after profile load
  useEffect(() => {
    // Only run if authenticated, profile loaded, and not already bootstrapped
    if (!isAuthenticated || !userProfile || bootstrapState !== 'idle') return;

    const bootstrap = async () => {
      setBootstrapState('running');
      try {
        // Step 1: Ensure all quadrants exist and wait until confirmed
        await bootstrapQuadrants();
        
        // Step 2: Reset new day (only runs after quadrants are confirmed ready)
        await resetNewDay.mutateAsync();
        
        setBootstrapState('complete');
      } catch (error: any) {
        console.error('Bootstrap error:', error);
        setBootstrapState('failed');
        
        // Show a single user-friendly error toast
        toast.error('Failed to initialize workspace. Please refresh the page to try again.');
      }
    };

    // Only run bootstrap if quadrants are not ready
    if (!quadrantsReady) {
      bootstrap();
    } else {
      // Quadrants already exist, mark as complete
      setBootstrapState('complete');
    }
  }, [isAuthenticated, userProfile, quadrantsReady, bootstrapState, bootstrapQuadrants, resetNewDay]);

  // Reset planSubview to 'lists' when entering Plan mode
  useEffect(() => {
    if (appMode === 1) {
      setPlanSubview('lists');
    }
  }, [appMode]);

  // Show loading screen while Internet Identity is initializing
  if (isInitializing) {
    return <AuthBootstrapLoading />;
  }

  // Show unauthenticated screen with login button
  if (!isAuthenticated) {
    const handleLogin = async () => {
      try {
        await login();
        toast.success('Logged in successfully');
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error('Failed to log in. Please try again.');
      }
    };

    return <UnauthenticatedScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
  }

  if (showProfileSetup) {
    return <UserProfileSetup />;
  }

  // Show loading only while profile/data is loading OR bootstrap is actively running
  const isBootstrapping = bootstrapState === 'running';
  if (profileLoading || dataLoading || isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isBootstrapping ? 'Initializing workspace...' : 'Loading your workspace...'}
          </p>
        </div>
      </div>
    );
  }

  const localTasks: LocalTask[] = (tasks || []).map(toLocalTask);
  const localLists: LocalList[] = (lists || []).map(toLocalList);
  
  const morningRoutines = routines?.filter(r => r.section === RoutineSection.top) || [];
  const eveningRoutines = routines?.filter(r => r.section === RoutineSection.bottom) || [];
  
  const quadrantLists = localLists.filter(l => l.quadrant);
  const customLists = localLists.filter(l => !l.quadrant);

  const isHomeMode = appMode === 0;
  const isPlanMode = appMode === 1;

  const handleDragStart = (e: React.DragEvent, task: LocalTask) => {
    e.dataTransfer.effectAllowed = 'move';
    writeDragPayload(e.dataTransfer, {
      taskId: task.id.toString(),
      sourceListId: task.listId.toString(),
    });
  };

  const handleDrop = async (e: React.DragEvent, targetListId: bigint, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();

    const payload = readDragPayload(e.dataTransfer);
    if (!payload) {
      console.warn('No valid drag payload found');
      return;
    }

    try {
      const taskId = BigInt(payload.taskId);
      const sourceListId = BigInt(payload.sourceListId);

      if (sourceListId !== targetListId) {
        await moveTask.mutateAsync({ taskId, destinationListId: targetListId });
      }

      if (targetIndex !== undefined) {
        await updateTaskPosition.mutateAsync({ taskId, positionIndex: BigInt(targetIndex) });
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const handleTouchDrop = async (task: LocalTask, targetListId: bigint, targetIndex?: number) => {
    try {
      if (task.listId !== targetListId) {
        await moveTask.mutateAsync({ taskId: task.id, destinationListId: targetListId });
      }

      if (targetIndex !== undefined) {
        await updateTaskPosition.mutateAsync({ taskId: task.id, positionIndex: BigInt(targetIndex) });
      }
    } catch (error) {
      console.error('Touch drop error:', error);
    }
  };

  const handleReorder = async (taskId: bigint, listId: bigint, newIndex: number) => {
    try {
      await updateTaskPosition.mutateAsync({ taskId, positionIndex: BigInt(newIndex) });
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  const handleToggleComplete = async (taskId: bigint, updates: Partial<LocalTask>) => {
    try {
      await toggleTaskCompletion.mutateAsync({ 
        id: taskId, 
        completed: updates.completed ?? false 
      });
    } catch (error) {
      console.error('Toggle complete error:', error);
    }
  };

  const handleCreateTask = async (title: string, description: string, listId: bigint, urgent: boolean, important: boolean, isLongTask: boolean) => {
    const input: TaskCreateInput = {
      title,
      description,
      urgent,
      important,
      isLongTask,
      listId,
      order: BigInt(1000),
    };

    try {
      await createTask.mutateAsync(input);
      setAddTaskOpen(false);
    } catch (error) {
      console.error('Create task error:', error);
    }
  };

  const handleCreateList = async (name: string) => {
    try {
      await createList.mutateAsync(name);
      setCreateListOpen(false);
    } catch (error) {
      console.error('Create list error:', error);
    }
  };

  const handleUpdateTask = async (taskId: bigint, updates: Partial<LocalTask>) => {
    const task = localTasks.find(t => t.id === taskId);
    if (!task) return;

    const input: TaskUpdateInput = {
      title: updates.title ?? task.title,
      description: updates.description ?? task.description,
      completed: updates.completed ?? task.completed,
      urgent: updates.urgent ?? task.urgent,
      important: updates.important ?? task.important,
      isLongTask: updates.isLongTask ?? task.isLongTask,
      listId: updates.listId ?? task.listId,
      order: updates.order ?? task.order,
    };

    try {
      await updateTask.mutateAsync({ id: taskId, input });
    } catch (error) {
      console.error('Update task error:', error);
    }
  };

  const handleToggleEarnings = async (enabled: boolean) => {
    try {
      await toggleEarningsSystem.mutateAsync(enabled);
    } catch (error) {
      console.error('Toggle earnings error:', error);
      throw error;
    }
  };

  const handleSubmitPayroll = async (dailyIncome: bigint) => {
    try {
      await addPayroll.mutateAsync(dailyIncome);
    } catch (error) {
      console.error('Submit payroll error:', error);
      throw error;
    }
  };

  const handleOpenAddTask = (listId?: bigint) => {
    if (listId) {
      setPreSelectedListId(listId);
    } else {
      setPreSelectedListId(null);
    }
    setAddTaskOpen(true);
  };

  const handleSwitchToPlanMode = () => {
    setAppMode.mutate(1);
  };

  const handlePlanModeX = () => {
    // In Plan mode, X button toggles between 'lists' and 'routines' subview
    // When showing lists, X switches to routines
    // When showing routines, X switches back to lists
    setPlanSubview(prev => prev === 'lists' ? 'routines' : 'lists');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      {isHomeMode && <Header />}

      <main className="flex-1 flex flex-col overflow-hidden">
        {isHomeMode && (
          <MorningRoutine
            section={RoutineSection.top}
            routines={morningRoutines}
            onCreateRoutine={async (text, section) => {
              await createRoutine.mutateAsync({ text, section });
            }}
            onToggleComplete={async (id, completed) => {
              await completeRoutine.mutateAsync({ id, completed });
            }}
            onDeleteRoutine={async (id) => {
              await deleteRoutine.mutateAsync(id);
            }}
            onReorderRoutine={async (routineId, positionIndex) => {
              await updateRoutinePosition.mutateAsync({ routineId, positionIndex });
            }}
            displayMode={Number(displayMode || BigInt(0))}
            onToggleDisplayMode={(mode) => setDisplayMode.mutate(mode)}
            isExpanded={isMorningExpanded}
            onToggleExpand={() => setIsMorningExpanded(!isMorningExpanded)}
          />
        )}

        {isPlanMode && planSubview === 'routines' && (
          <MorningRoutine
            section={RoutineSection.top}
            routines={morningRoutines}
            onCreateRoutine={async (text, section) => {
              await createRoutine.mutateAsync({ text, section });
            }}
            onToggleComplete={async (id, completed) => {
              await completeRoutine.mutateAsync({ id, completed });
            }}
            onDeleteRoutine={async (id) => {
              await deleteRoutine.mutateAsync(id);
            }}
            onReorderRoutine={async (routineId, positionIndex) => {
              await updateRoutinePosition.mutateAsync({ routineId, positionIndex });
            }}
            displayMode={Number(displayMode || BigInt(0))}
            onToggleDisplayMode={(mode) => setDisplayMode.mutate(mode)}
            isExpanded={isMorningExpanded}
            onToggleExpand={() => setIsMorningExpanded(!isMorningExpanded)}
          />
        )}

        <EisenhowerMatrix
          tasks={localTasks}
          quadrantLists={quadrantLists}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onTouchDrop={handleTouchDrop}
          onReorder={handleReorder}
          onEditTask={setEditingTask}
          onDeleteTask={(id) => deleteTask.mutate(id)}
          onToggleComplete={handleToggleComplete}
          isExpanded={isMatrixExpanded}
          onToggleExpand={() => setIsMatrixExpanded(!isMatrixExpanded)}
          isPlanMode={isPlanMode}
          onSwitchToPlanMode={handleSwitchToPlanMode}
        />

        {isHomeMode && (
          <MorningRoutine
            section={RoutineSection.bottom}
            routines={eveningRoutines}
            onCreateRoutine={async (text, section) => {
              await createRoutine.mutateAsync({ text, section });
            }}
            onToggleComplete={async (id, completed) => {
              await completeRoutine.mutateAsync({ id, completed });
            }}
            onDeleteRoutine={async (id) => {
              await deleteRoutine.mutateAsync(id);
            }}
            onReorderRoutine={async (routineId, positionIndex) => {
              await updateRoutinePosition.mutateAsync({ routineId, positionIndex });
            }}
            displayMode={Number(displayMode || BigInt(0))}
            onToggleDisplayMode={(mode) => setDisplayMode.mutate(mode)}
            isExpanded={isEveningExpanded}
            onToggleExpand={() => setIsEveningExpanded(!isEveningExpanded)}
          />
        )}

        {isPlanMode && planSubview === 'routines' && (
          <MorningRoutine
            section={RoutineSection.bottom}
            routines={eveningRoutines}
            onCreateRoutine={async (text, section) => {
              await createRoutine.mutateAsync({ text, section });
            }}
            onToggleComplete={async (id, completed) => {
              await completeRoutine.mutateAsync({ id, completed });
            }}
            onDeleteRoutine={async (id) => {
              await deleteRoutine.mutateAsync(id);
            }}
            onReorderRoutine={async (routineId, positionIndex) => {
              await updateRoutinePosition.mutateAsync({ routineId, positionIndex });
            }}
            displayMode={Number(displayMode || BigInt(0))}
            onToggleDisplayMode={(mode) => setDisplayMode.mutate(mode)}
            isExpanded={isEveningExpanded}
            onToggleExpand={() => setIsEveningExpanded(!isEveningExpanded)}
          />
        )}

        {isPlanMode && planSubview === 'lists' && (
          <CustomLists
            tasks={localTasks}
            lists={customLists}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onTouchDrop={handleTouchDrop}
            onReorder={handleReorder}
            onEditTask={setEditingTask}
            onDeleteTask={(id) => deleteTask.mutate(id)}
            onDeleteList={(id) => deleteList.mutate(id)}
            onToggleComplete={handleToggleComplete}
            onCreateTask={() => handleOpenAddTask()}
            onCreateList={() => setCreateListOpen(true)}
            onQuickAddTask={(listId) => handleOpenAddTask(listId)}
            isHidden={false}
            isPlanMode={isPlanMode}
          />
        )}
      </main>

      <BottomNavigation
        isPlanMode={isPlanMode}
        onSwitchMode={(mode) => setAppMode.mutate(mode)}
        onPlanModeX={handlePlanModeX}
        onAddTask={() => handleOpenAddTask()}
        onAddList={() => setCreateListOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTodayEarns={() => setTodayEarnsOpen(true)}
        onOpenSpendPlan={() => setSpendPlanOpen(true)}
        onOpenInsights={() => setInsightsOpen(true)}
        earningsEnabled={earningsEnabled}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        monetarySettings={monetarySettings}
        onSaveSettings={saveMonetarySettings.mutateAsync}
        isSaving={saveMonetarySettings.isPending}
        earningsEnabled={earningsEnabled}
        onToggleEarnings={handleToggleEarnings}
        isTogglingEarnings={toggleEarningsSystem.isPending}
      />

      {earningsEnabled && (
        <TodayEarnsDialog
          open={todayEarnsOpen}
          onOpenChange={setTodayEarnsOpen}
          monetarySettings={monetarySettings}
          tasks={tasks}
          routines={routines}
          onSubmitPayroll={handleSubmitPayroll}
          isSubmitting={addPayroll.isPending}
        />
      )}

      <SpendPlanDialog
        open={spendPlanOpen}
        onOpenChange={setSpendPlanOpen}
        spends={spends}
        monetarySettings={monetarySettings}
        presets={presets}
        onCreateSpend={createSpend.mutateAsync}
        onDeleteSpend={deleteSpend.mutateAsync}
        onCreatePreset={createPreset.mutateAsync}
        onUpdatePreset={(id, preset) => updatePreset.mutateAsync({ id, preset })}
        onDeletePreset={deletePreset.mutateAsync}
        isCreating={createSpend.isPending || createPreset.isPending || updatePreset.isPending}
        isDeleting={deleteSpend.isPending || deletePreset.isPending}
      />

      <InsightsDialog
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        spends={spends}
        monetarySettings={monetarySettings}
      />

      <UniversalAddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        lists={localLists}
        onCreateTask={handleCreateTask}
        isLoading={createTask.isPending}
        preSelectedListId={preSelectedListId}
        quadrantsReady={quadrantsReady}
      />

      <CreateListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        onCreateList={handleCreateList}
        isLoading={createList.isPending}
      />

      {editingTask && (
        <EditTaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          lists={localLists}
          onUpdateTask={handleUpdateTask}
          isLoading={updateTask.isPending}
        />
      )}

      <Footer />
    </div>
  );
}
