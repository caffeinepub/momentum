# Task Completion Toggle Latency Audit

## Current Control Flow

When a user clicks a task checkbox, the following sequence occurs:

1. **TaskCard.tsx** (line 29): `onToggleComplete` callback is invoked
2. **TaskManager.tsx** (line 177-197): `handleToggleComplete` is called
   - Finds the task in local state
   - Constructs a full `TaskInput` object with all task properties
   - Calls `updateTask.mutateAsync({ id, input })`
   - **Awaits** the backend response before UI updates
3. **useQueries.ts** (line 358-366): `updateTaskMutation` executes
   - Calls `actor.updateTask(id, input)` (network round-trip to backend)
   - On success: `invalidateQueries({ queryKey: ['tasks'] })`
   - This triggers a **full refetch** of all tasks from the backend
4. **Backend validation** runs (title length, list existence, weight recalculation)
5. **React Query refetch** pulls the entire task list again
6. **React re-renders** the entire task list/quadrant

## Identified Latency Sources

### 1. **Synchronous Backend Wait** (Primary Issue)
- The UI waits for `mutateAsync` to resolve before updating the checkbox
- Network latency (ICP canister call) is directly visible to the user
- Typical delay: 200-800ms depending on network conditions

### 2. **Blanket Query Invalidation**
- `invalidateQueries({ queryKey: ['tasks'] })` refetches **all tasks**
- Even though only one task's `completed` flag changed
- Causes unnecessary network traffic and processing

### 3. **List-Wide Re-renders**
- Entire quadrant/list components re-render when the tasks array reference changes
- TaskCard memoization helps but parent components still recalculate

### 4. **Heavy Backend Logic for Simple Toggle**
- `updateTask` runs full validation (title length, list existence)
- Recalculates task weight (even though completion doesn't affect weight)
- More work than necessary for a simple boolean flip

## Why Routines Feel Instant

**Routines use optimistic updates** (useQueries.ts lines 554-584):
- `onMutate`: Immediately patches the routine in cache
- Backend call happens in background
- `onError`: Rolls back only on failure
- `onSettled`: Reconciles with backend (optional refetch)

Result: Checkbox flips in <50ms, backend sync is invisible.

## Conclusion

Task completion toggles feel slow because:
1. UI blocks on backend confirmation (no optimistic update)
2. Full task list invalidation/refetch (not single-task patch)
3. Unnecessary validation overhead for a simple boolean change

The fix: Apply the same optimistic mutation pattern used for routines to task completion toggles.
