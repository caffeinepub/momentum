import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EisenhowerMatrix from '../components/EisenhowerMatrix';
import CustomLists from '../components/CustomLists';
import MorningRoutine from '../components/MorningRoutine';
import BottomNavigation from '../components/BottomNavigation';
import EditTaskDialog from '../components/EditTaskDialog';
import UniversalAddTaskDialog from '../components/UniversalAddTaskDialog';
import CreateListDialog from '../components/CreateListDialog';
import UserInfoDialog from '../components/UserInfoDialog';
import PlanModeTipDialog from '../components/PlanModeTipDialog';
import { useTaskQueries, useMorningRoutineQueries, useGetCallerUserProfile, useSaveCallerUserProfile, usePayrollHistory } from '../hooks/useQueries';
import { useTestDate } from '../hooks/useTestDate';
import { usePlanModeTip } from '../hooks/usePlanModeTip';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { RoutineSection } from '../backend';
import type { LocalTask } from '../lib/types';
import type { ListId, TaskId, RoutineId, UserProfile } from '../backend';

interface TaskManagerProps {
  onOpenAdminDashboard?: () => void;
}

export default function TaskManager({ onOpenAdminDashboard }: TaskManagerProps) {
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isUniversalAddOpen, setIsUniversalAddOpen] = useState(false);
  const [preSelectedListId, setPreSelectedListId] = useState<ListId | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<LocalTask | null>(null);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [isMorningReorderMode, setIsMorningReorderMode] = useState(false);
  const [isEveningReorderMode, setIsEveningReorderMode] = useState(false);
  const [appMode, setAppMode] = useState(0); // 0 = home, 1 = plan
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(true);
  const [draggedTask, setDraggedTask] = useState<LocalTask | null>(null);

  const { testDate, setTestDate } = useTestDate();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() || null;
  const { shouldShow, markAsShown } = usePlanModeTip(principalId);
  const [showPlanModeTip, setShowPlanModeTip] = useState(false);

  const {
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
  } = useTaskQueries();

  const {
    routines,
    createRoutine,
    deleteRoutine,
    updateRoutinePosition,
    manualResetRoutines,
  } = useMorningRoutineQueries();

  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [checkedMorningRoutines, setCheckedMorningRoutines] = useState<RoutineId[]>([]);
  const [checkedEveningRoutines, setCheckedEveningRoutines] = useState<RoutineId[]>([]);

  const morningRoutines = routines.filter((r) => r.section === RoutineSection.top);
  const eveningRoutines = routines.filter((r) => r.section === RoutineSection.bottom);

  const quadrantLists = lists.filter((list) => list.quadrant);
  const customLists = lists.filter((list) => !list.quadrant);

  const isPlanMode = appMode === 1;

  const handleToggleComplete = (taskId: TaskId, updates: Partial<LocalTask>) => {
    updateTask.mutate({ taskId, updates });
  };

  const handleCreateTask = async (
    title: string,
    description: string,
    listId: ListId,
    urgent: boolean,
    important: boolean,
    isLongTask: boolean
  ) => {
    try {
      await createTask.mutateAsync({ title, description, listId, urgent, important, isLongTask });
      setIsUniversalAddOpen(false);
      toast.success('Task created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = (taskId: TaskId, updates: Partial<LocalTask>) => {
    updateTask.mutate({ taskId, updates }, {
      onSuccess: () => {
        setEditingTask(null);
        toast.success('Task updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update task');
      }
    });
  };

  const handleDeleteTask = (taskId: TaskId) => {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        setEditingTask(null);
        toast.success('Task deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete task');
      }
    });
  };

  const handleCreateList = async (name: string) => {
    try {
      await createList.mutateAsync(name);
      setIsCreateListOpen(false);
      toast.success('List created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create list');
    }
  };

  const handleDeleteList = (listId: ListId) => {
    deleteList.mutate(listId, {
      onSuccess: () => {
        toast.success('List deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete list');
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, task: LocalTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetListId: bigint, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask) return;

    try {
      if (draggedTask.listId !== targetListId) {
        await moveTask.mutateAsync({ taskId: draggedTask.id, destinationListId: targetListId });
      }
      
      if (targetIndex !== undefined) {
        await updateTaskPosition.mutateAsync({ taskId: draggedTask.id, positionIndex: BigInt(targetIndex) });
      }
    } catch (error: any) {
      toast.error('Failed to move task');
    } finally {
      setDraggedTask(null);
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
    } catch (error: any) {
      toast.error('Failed to move task');
    }
  };

  const handleReorder = async (taskId: bigint, listId: bigint, newIndex: number) => {
    try {
      await updateTaskPosition.mutateAsync({ taskId, positionIndex: BigInt(newIndex) });
    } catch (error: any) {
      toast.error('Failed to reorder task');
    }
  };

  const handleCreateRoutine = async (text: string, section: RoutineSection) => {
    try {
      await createRoutine.mutateAsync({ text, section });
      toast.success('Routine created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create routine');
    }
  };

  const handleDeleteRoutine = async (id: RoutineId) => {
    try {
      await deleteRoutine.mutateAsync(id);
      toast.success('Routine deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete routine');
    }
  };

  const handleUpdateRoutinePosition = async (routineId: RoutineId, positionIndex: bigint) => {
    try {
      await updateRoutinePosition.mutateAsync({ routineId, positionIndex });
    } catch (error: any) {
      toast.error('Failed to update routine position');
    }
  };

  const handleResetNewDay = async () => {
    try {
      const allCheckedRoutines = [...checkedMorningRoutines, ...checkedEveningRoutines];
      await manualResetRoutines.mutateAsync(allCheckedRoutines);
      
      // Clear local checked state
      setCheckedMorningRoutines([]);
      setCheckedEveningRoutines([]);
      
      toast.success('New day reset successfully! Strike counts updated.');
    } catch (error: any) {
      toast.error('Failed to reset new day');
    }
  };

  const handleOpenUniversalAdd = useCallback((listId?: ListId) => {
    setPreSelectedListId(listId);
    setIsUniversalAddOpen(true);
  }, []);

  const handleBootstrapQuadrants = async () => {
    try {
      await bootstrapQuadrants.mutateAsync();
    } catch (error: any) {
      toast.error('Failed to initialize quadrants');
    }
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      await saveProfile.mutateAsync(profile);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
    }
  };

  const handleSwitchMode = (mode: number) => {
    setAppMode(mode);
    if (mode === 1 && shouldShow) {
      setShowPlanModeTip(true);
    }
  };

  const handleDismissPlanModeTip = () => {
    markAsShown();
    setShowPlanModeTip(false);
  };

  const handleSwitchToPlanMode = () => {
    handleSwitchMode(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        testDate={testDate}
        onTestDateChange={setTestDate}
        onResetNewDay={handleResetNewDay}
        isResetting={manualResetRoutines.isPending}
        onOpenUserInfo={() => setIsUserInfoOpen(true)}
        onOpenAdminDashboard={onOpenAdminDashboard}
      />

      <main className="container flex-1 space-y-6 px-4 py-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <MorningRoutine
            title="Morning Routine"
            section={RoutineSection.top}
            routines={morningRoutines}
            isReorderMode={isMorningReorderMode}
            onToggleReorder={() => setIsMorningReorderMode(!isMorningReorderMode)}
            onCreate={handleCreateRoutine}
            onDelete={handleDeleteRoutine}
            onUpdatePosition={handleUpdateRoutinePosition}
            testDate={testDate}
            onCheckedRoutinesChange={setCheckedMorningRoutines}
          />

          <MorningRoutine
            title="Evening Routine"
            section={RoutineSection.bottom}
            routines={eveningRoutines}
            isReorderMode={isEveningReorderMode}
            onToggleReorder={() => setIsEveningReorderMode(!isEveningReorderMode)}
            onCreate={handleCreateRoutine}
            onDelete={handleDeleteRoutine}
            onUpdatePosition={handleUpdateRoutinePosition}
            testDate={testDate}
            onCheckedRoutinesChange={setCheckedEveningRoutines}
          />
        </div>

        <EisenhowerMatrix
          tasks={tasks}
          quadrantLists={quadrantLists}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onTouchDrop={handleTouchDrop}
          onReorder={handleReorder}
          onEditTask={setEditingTask}
          onDeleteTask={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          isExpanded={isMatrixExpanded}
          onToggleExpand={() => setIsMatrixExpanded(!isMatrixExpanded)}
          isPlanMode={isPlanMode}
          onSwitchToPlanMode={handleSwitchToPlanMode}
        />

        <CustomLists
          tasks={tasks}
          lists={customLists}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onTouchDrop={handleTouchDrop}
          onReorder={handleReorder}
          onEditTask={setEditingTask}
          onDeleteTask={handleDeleteTask}
          onDeleteList={handleDeleteList}
          onToggleComplete={handleToggleComplete}
          onCreateTask={() => setIsUniversalAddOpen(true)}
          onCreateList={() => setIsCreateListOpen(true)}
          onQuickAddTask={handleOpenUniversalAdd}
          isPlanMode={isPlanMode}
        />
      </main>

      <BottomNavigation
        isPlanMode={isPlanMode}
        onSwitchMode={handleSwitchMode}
        onPlanModeX={() => setAppMode(0)}
        onAddTask={() => setIsUniversalAddOpen(true)}
        onAddList={() => setIsCreateListOpen(true)}
        onOpenSettings={() => {}}
        onOpenTodayEarns={() => {}}
        onOpenSpendPlan={() => {}}
        onOpenInsights={() => {}}
        onOpenUserInfo={() => setIsUserInfoOpen(true)}
        earningsEnabled={false}
      />

      <Footer />

      <CreateListDialog
        open={isCreateListOpen}
        onOpenChange={setIsCreateListOpen}
        onCreateList={handleCreateList}
        isLoading={createList.isPending}
      />

      {editingTask && (
        <EditTaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          lists={lists}
          onUpdateTask={handleUpdateTask}
          isLoading={updateTask.isPending}
        />
      )}

      <UniversalAddTaskDialog
        open={isUniversalAddOpen}
        onOpenChange={setIsUniversalAddOpen}
        onCreateTask={handleCreateTask}
        lists={lists}
        preSelectedListId={preSelectedListId}
        isLoading={createTask.isPending}
        quadrantsReady={quadrantsReady}
      />

      <UserInfoDialog
        open={isUserInfoOpen}
        onOpenChange={setIsUserInfoOpen}
        userProfile={userProfile || null}
        onSaveProfile={handleSaveProfile}
        isSavingProfile={saveProfile.isPending}
      />

      <PlanModeTipDialog
        open={showPlanModeTip}
        onOpenChange={setShowPlanModeTip}
        onDismiss={handleDismissPlanModeTip}
      />
    </div>
  );
}
