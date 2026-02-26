# Specification

## Summary
**Goal:** Add a visual drop indicator line to task drag-and-drop and enable cross-container dragging of tasks between Eisenhower Matrix quadrants and custom lists, while keeping all existing routine features intact.

**Planned changes:**
- Add a thin horizontal drop indicator line between task cards during drag, matching the style of the existing routine drop indicator in MorningRoutine.tsx; the line updates in real time and disappears on drop or cancel
- Enable cross-container drag-and-drop for tasks between any quadrant and any custom list (in any combination)
- On cross-container drop, update the task's container identity (quadrantId or listId) and recalculate its order value using 1000-based sparse indexing based on new neighbors
- Apply optimistic update immediately on drop; roll back task to its original container and position if the backend call fails
- Same-container drops continue to reorder in place using the same indicator line and optimistic logic
- Exclude routine sections entirely from all task drag scopes (no dragging into or out of routines)
- No task fields other than container identity and order change on drop
- Preserve all existing routine features (drag-and-drop, streak badge/preview/reset, Start New Day logic, onboarding seeds, test date dropdown) without modification

**User-visible outcome:** Users can drag tasks freely between quadrants and custom lists, seeing a live drop indicator line showing exactly where the task will land, with instant placement and automatic rollback on failure. All routine functionality remains unchanged.
