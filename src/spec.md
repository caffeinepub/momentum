# Specification

## Summary
**Goal:** Adjust the Plan mode X button to hide/show specific sections without switching modes, eliminating flicker.

**Planned changes:**
- Update the Plan mode X button handler to stop triggering the existing Plan→Home mode switch.
- In Plan mode, make the X button only hide the “My Lists” (CustomLists) section.
- In Plan mode, make the X button only show/unhide the “Morning Routine” and “Evening Routine” sections, keeping Plan mode active to prevent mount/unmount flicker.

**User-visible outcome:** In Plan mode, tapping X no longer exits Plan mode; it simply hides “My Lists” and shows “Morning Routine” and “Evening Routine” with no flicker.
