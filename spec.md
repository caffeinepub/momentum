# Specification

## Summary
**Goal:** Fix drag-and-drop cross-list task movement by applying optimistic UI updates instantly on drop, with background backend sync and rollback on failure.

**Planned changes:**
- On task drop (cross-list or reorder within list), immediately update the task's `listId` and `order` in local state using the 1000-based ordering method:
  - Insert at top: `order = lowestNeighborOrder - 1000`
  - Insert at bottom: `order = highestNeighborOrder + 1000`
  - Insert between two tasks: `order = (prevOrder + nextOrder) / 2`
- After the optimistic update, sync the new `listId` and `order` to the backend asynchronously in the background
- If the backend call fails, roll back the task to its previous `listId` and `order` in local state
- No loading spinners or visual delays introduced during background sync

**User-visible outcome:** Tasks dropped into a new list or reordered within a list instantly reflect their new position and list assignment without any visible delay, and silently revert if the backend sync fails — with zero visual changes to the existing UI.
