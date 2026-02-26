# Specification

## Summary
**Goal:** Fix drag-and-drop into non-empty lists in the CustomLists component so that tasks are correctly repositioned using 1000-based order calculation and optimistic UI updates.

**Planned changes:**
- Fix the drop handler to correctly calculate the new `order` value between neighbor tasks when dropping into a non-empty list (midpoint between neighbors, or anchored from the nearest neighbor when dropping at the start or end).
- Fix the optimistic local state update so that both `listId` and `order` are immediately applied when a task is dropped into a non-empty destination list, making the task disappear from the source list and appear at the correct position instantly.
- Ensure the backend `updateTask` call is invoked with the updated `listId` and `order` after a successful drop into a non-empty list.
- Implement rollback to the pre-drag snapshot if the backend call fails, and show an error indicator on failure.

**User-visible outcome:** Users can drag and drop tasks into lists that already contain tasks, and the task instantly moves to the correct position in the destination list. If the backend sync fails, the task reverts to its original position.
