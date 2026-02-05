# Specification

## Summary
**Goal:** Convert the Admin Dashboard from a modal dialog into a dedicated full-page view with navigation, proper access control messaging, and stable pagination behavior.

**Planned changes:**
- Replace the modal-based Admin Dashboard dialog with a full-screen Admin Dashboard page that preserves existing user list, search, pagination, admin role actions, and tier update functionality.
- Add in-app navigation so admins can open the Admin Dashboard from the main header and return to the main Task Manager screen via a clear Back control without refreshing.
- Add UI access control on the Admin Dashboard page: non-admin users see an English unauthorized message and a way to navigate back (no misleading empty user list).
- Refactor pagination page-clamping to avoid render-time state updates (remove the state-setting `useMemo` pattern and move clamping to an effect-based approach).

**User-visible outcome:** Admin users can open an Admin Dashboard as a normal page (not a popup), scroll and use all existing admin tools, and easily navigate back; non-admin users see a clear unauthorized message with a back option.
