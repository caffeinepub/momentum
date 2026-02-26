# Specification

## Summary
**Goal:** Add a visual drop indicator line to task drag-and-drop reordering in all task containers, matching the existing behavior already present in MorningRoutine.tsx for routine items.

**Planned changes:**
- Add a drop indicator line to task drag-and-drop reordering in Eisenhower Matrix quadrants, mirroring the pattern used in MorningRoutine.tsx.
- Add the same drop indicator line to task drag-and-drop reordering in Custom Lists.
- Ensure the indicator line appears between task items at the insertion position, updates dynamically during drag, and disappears on drag end.

**User-visible outcome:** When dragging tasks to reorder them in the Eisenhower Matrix or Custom Lists, users will see a visible indicator line showing where the task will be dropped, consistent with the existing routine item drag-and-drop experience.
