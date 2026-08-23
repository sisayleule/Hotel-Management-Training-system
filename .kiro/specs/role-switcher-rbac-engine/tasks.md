# Implementation Plan: Role-Based Access Control (RBAC) System with Role Switcher

## Overview

This implementation plan follows the 4-phase integration strategy defined in the design document. The approach prioritizes building the foundation (data layer, state management) before integrating UI components, then adding route protection, and finally enforcing component-level permissions.

**CRITICAL CONSTRAINT - ENFORCED IN EVERY TASK:**
Do NOT modify, redesign, restyle, or rewrite any existing UI, layout, styling, colors, components, or pages that are not directly required by this feature. Only add role-based filtering logic to existing structures. Hotel Manager view must remain 100% identical to current state.

## Tasks

- [ ] 1. Phase 1: Core Infrastructure — Data Layer and State Management
  - [ ] 1.1 Create RBAC configuration file with all data structures
    - Create `src/config/rbac.js` file
    - Define ROLES array with 4 role objects (hotel_manager, front_office, housekeeping, waiter_fnb)
    - Define PERMISSIONS object with all 30+ permission keys using dot-notation format
    - Define ROLE_PERMISSIONS mapping (hotel_manager gets "*", others get explicit arrays)
    - Define NAV_CONFIG mapping (each role → navItems[] + defaultDashboard)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property test for permission key format validation
    - **Property 1: Permission Key Format Validation**
    - **Validates: Requirements 1.5**
    - Use fast-check to verify all PERMISSIONS keys match `/^[a-z_]+\.[a-z_]+$/` pattern
    - Test that category and action parts are lowercase alphanumeric with underscores
    - _Requirements: 1.5_

  - [ ] 1.3 Create Role Context Store using Zustand
    - Create `src/store/useRoleStore.js` file
    - Implement state properties: currentRole, permissions, demoMode
    - Implement initialize() action to restore from localStorage
    - Implement setRole(roleId) action to switch roles and persist to localStorage
    - Implement getRoleMetadata() to return current role object
    - Implement getNavConfig() to return navigation config for current role
    - Implement can(permissionKey) permission checker with wildcard support
    - Implement canAny(permissionKeys[]) permission checker
    - Implement canAll(permissionKeys[]) permission checker
    - Call initialize() on module load to restore role from localStorage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 12.1, 12.2_

  - [ ]* 1.4 Write property test for hotel manager wildcard access
    - **Property 2: Hotel Manager Wildcard Access**
    - **Validates: Requirements 3.2, 6.2**
    - Use fast-check to generate arbitrary permission key strings
    - Set role to hotel_manager and verify can(key) returns true for any key
    - _Requirements: 3.2, 6.2_

  - [ ]* 1.5 Write property test for permission check consistency
    - **Property 3: Permission Check Consistency**
    - **Validates: Requirements 3.1**
    - Use fast-check to generate arbitrary role and permission key pairs
    - Verify can(key) returns true ⟺ permissions includes "*" OR includes key
    - _Requirements: 3.1_

  - [ ]* 1.6 Write property test for canAny disjunction correctness
    - **Property 4: canAny Disjunction Correctness**
    - **Validates: Requirements 3.3**
    - Use fast-check to generate arbitrary role and permission key arrays
    - Verify canAny(keys) returns true ⟺ exists k in keys where can(k) is true
    - _Requirements: 3.3_

  - [ ] 1.7 Create permission helper hook
    - Create `src/hooks/usePermissions.js` file
    - Export usePermissions() hook that subscribes to useRoleStore
    - Return currentRole, permissions, can, canAny, canAll functions
    - Return computed properties: roleName, roleDescription, isManager
    - _Requirements: 2.1, 2.7, 3.1, 3.3_

- [ ] 2. Checkpoint — Core Infrastructure Complete
  - Ensure all tests pass, verify useRoleStore initializes correctly, ask the user if questions arise.

- [ ] 3. Phase 2: Permission Enforcement Components
  - [ ] 3.1 Create RequirePermission wrapper component
    - Create `src/components/auth/RequirePermission.jsx` file
    - Accept props: permission (single), permissions (array), children, fallback
    - Use usePermissions() hook to access can() and canAny() functions
    - Render children only when permission check passes, otherwise render fallback (default: null)
    - _Requirements: 3.4, 3.5, 14.1, 14.2, 14.4_

  - [ ]* 3.2 Write unit tests for RequirePermission component
    - Test that children render when permission is granted
    - Test that fallback renders when permission is denied
    - Test with single permission prop
    - Test with multiple permissions prop (canAny behavior)
    - _Requirements: 3.4, 3.5_

  - [ ] 3.3 Create ProtectedRoute wrapper component
    - Create `src/components/auth/ProtectedRoute.jsx` file
    - Accept props: children, requiredPermissions (array, default: [])
    - Use usePermissions() hook to access canAll() function
    - If permission check fails, display toast notification "Access Denied: You do not have permission to view this page"
    - If permission check fails, redirect to defaultDashboard from NAV_CONFIG
    - Log unauthorized access attempts to console with attempted path and required permissions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 13.3, 13.4_

  - [ ]* 3.4 Write unit tests for ProtectedRoute component
    - Test that children render when all permissions are granted
    - Test that redirect occurs when any permission is missing
    - Test that toast notification displays on access denied
    - Test that console logging occurs with correct details
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.5 Write property test for navigation config completeness
    - **Property 5: Navigation Config Completeness**
    - **Validates: Requirements 1.4, 5.1**
    - Use fast-check to generate all roles from ROLES array
    - Verify NAV_CONFIG[role.id] exists AND has defaultDashboard AND has navItems array
    - _Requirements: 1.4, 5.1_

- [ ] 4. Checkpoint — Permission Enforcement Components Complete
  - Ensure all tests pass, verify RequirePermission and ProtectedRoute work correctly, ask the user if questions arise.

- [ ] 5. Phase 3: UI Integration
  - [ ] 5.1 Update Sidebar component to use role-based navigation
    - Open `src/components/layout/Sidebar.jsx` file
    - Import useRoleStore and getNavConfig function
    - Replace hardcoded navItems array with dynamic `getNavConfig().navItems`
    - Dynamically import Lucide icons using `LucideIcons[item.icon]` pattern
    - Ensure navigation items re-render immediately when role changes
    - DO NOT change any styling, layout, colors, or visual design
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 7.4, 8.4, 9.4_

  - [ ]* 5.2 Write property test for sidebar navigation filtering
    - **Property 6: Sidebar Navigation Filtering**
    - **Validates: Requirements 5.1, 5.2**
    - Use fast-check to generate all roles from ROLES array
    - Render Sidebar component with each role
    - Verify rendered navItems exactly match NAV_CONFIG[role.id].navItems (no extra, no missing)
    - _Requirements: 5.1, 5.2_

  - [ ] 5.3 Create DemoModeBadge component
    - Create `src/components/layout/DemoModeBadge.jsx` file
    - Use usePermissions() hook to get roleName
    - Use useRoleStore to get demoMode flag
    - Return null if demoMode is false
    - Render fixed-position badge (top-16 right-4 z-50) with Shield icon
    - Display text: "Demo Mode — Viewing as: {roleName}"
    - Badge should be clickable link to "/settings?tab=roles"
    - Use amber background (#f59e0b), white text, rounded-full, shadow-lg
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ] 5.4 Integrate DemoModeBadge into AppLayout
    - Open `src/components/layout/AppLayout.jsx` file
    - Import DemoModeBadge component
    - Add <DemoModeBadge /> after TopHeader component
    - DO NOT change any existing layout, styling, or structure
    - _Requirements: 11.1, 11.6_

  - [ ] 5.5 Create RoleSwitcher component for Settings page
    - Create `src/components/settings/RoleSwitcher.jsx` file
    - Import ROLES from rbac.js and useRoleStore
    - Display header: "Role Switcher (Demo Mode)" with helper text
    - Render 4 role cards in 2x2 grid layout (responsive: sm:grid-cols-2)
    - Each card shows: icon, role name, description, capabilities list (top 4), "Switch to this role" button
    - Highlight active role with "Currently Active" indicator and ring border
    - On button click: call setRole(roleId), navigate to defaultDashboard, show success toast
    - Use role.color for left border (border-l-4)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [ ] 5.6 Integrate RoleSwitcher into Settings page
    - Open `src/pages/Settings.jsx` file
    - Import RoleSwitcher component
    - Add new "Role Switcher (Demo)" section to Settings page
    - Place RoleSwitcher component within the section
    - DO NOT change any existing settings UI or styling
    - _Requirements: 10.1_

- [ ] 6. Checkpoint — UI Integration Complete
  - Ensure all UI components render correctly, verify role switching updates all UI elements, ask the user if questions arise.

- [ ] 7. Phase 4: Route Protection and Component-Level Enforcement
  - [ ] 7.1 Update App.tsx to add route protection
    - Open `src/App.tsx` file
    - Import ProtectedRoute component and PERMISSIONS from rbac.js
    - Wrap "/rooms" route with ProtectedRoute requiring PERMISSIONS.ROOMS_VIEW
    - Wrap "/reservations" route with ProtectedRoute requiring PERMISSIONS.RESERVATIONS_VIEW
    - Wrap "/reservations/new" route with ProtectedRoute requiring PERMISSIONS.RESERVATIONS_CREATE
    - Wrap "/reservations/:id" route with ProtectedRoute requiring PERMISSIONS.RESERVATIONS_VIEW
    - Wrap "/reservations/:id/assign" route with ProtectedRoute requiring PERMISSIONS.RESERVATIONS_EDIT
    - Wrap "/checkin" route with ProtectedRoute requiring PERMISSIONS.CHECKIN_PERFORM
    - Wrap "/checkout" route with ProtectedRoute requiring PERMISSIONS.CHECKOUT_PERFORM
    - Wrap "/cashiering" route with ProtectedRoute requiring PERMISSIONS.BILLING_POST_CHARGES
    - Wrap "/housekeeping" route with ProtectedRoute requiring PERMISSIONS.HOUSEKEEPING_VIEW
    - Wrap "/reports" route with ProtectedRoute requiring PERMISSIONS.REPORTS_VIEW
    - Leave "/dashboard" and "/settings" routes unprotected (accessible to all roles)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 7.5, 8.5, 9.5_

  - [ ]* 7.2 Write integration tests for route protection
    - Test hotel_manager can access all routes
    - Test front_office cannot access /reports or /housekeeping
    - Test housekeeping cannot access /reservations or /cashiering
    - Test waiter_fnb cannot access /rooms or /reservations
    - Test that unauthorized route access triggers redirect to defaultDashboard
    - Test that toast notification displays on access denied
    - _Requirements: 4.3, 4.4, 7.5, 8.5, 9.5, 15.2_

  - [ ] 7.3 Add RequirePermission wrappers to Reservations page action buttons
    - Open `src/pages/Reservations.jsx` file
    - Wrap "New Reservation" button with RequirePermission for PERMISSIONS.RESERVATIONS_CREATE
    - Wrap "Edit" action buttons with RequirePermission for PERMISSIONS.RESERVATIONS_EDIT
    - Wrap "Cancel" action buttons with RequirePermission for PERMISSIONS.RESERVATIONS_CANCEL
    - DO NOT change button styling, layout, or existing functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 7.4 Add RequirePermission wrappers to CheckIn page action buttons
    - Open `src/pages/CheckIn.jsx` file
    - Wrap "Check In Guest" button with RequirePermission for PERMISSIONS.CHECKIN_PERFORM
    - DO NOT change button styling, layout, or existing functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 7.5 Add RequirePermission wrappers to CheckOut page action buttons
    - Open `src/pages/CheckOut.jsx` file
    - Wrap "Check Out Guest" button with RequirePermission for PERMISSIONS.CHECKOUT_PERFORM
    - DO NOT change button styling, layout, or existing functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 7.6 Add RequirePermission wrappers to Cashiering page action buttons
    - Open `src/pages/Cashiering.jsx` file
    - Wrap "Post Charge" button with RequirePermission for PERMISSIONS.BILLING_POST_CHARGES
    - Wrap "Process Payment" button with RequirePermission for PERMISSIONS.BILLING_PROCESS_PAYMENTS
    - Wrap "Generate Invoice" button with RequirePermission for PERMISSIONS.BILLING_GENERATE_INVOICE
    - DO NOT change button styling, layout, or existing functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 7.7 Add RequirePermission wrappers to HouseKeeping page action buttons
    - Open `src/pages/HouseKeeping.jsx` file
    - Wrap "Update Room Status" button with RequirePermission for PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS
    - Wrap "Report Maintenance" button with RequirePermission for PERMISSIONS.HOUSEKEEPING_REPORT_MAINTENANCE
    - DO NOT change button styling, layout, or existing functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 7.8 Add RequirePermission wrappers to RoomStatus page action buttons
    - Open `src/pages/RoomStatus.jsx` file
    - Wrap "Change Room Status" button with RequirePermission for PERMISSIONS.ROOMS_CHANGE_STATUS
    - DO NOT change button styling, layout, or existing functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 7.9 Add RequirePermission wrappers to Settings page admin sections
    - Open `src/pages/Settings.jsx` file
    - Wrap "User Management" section with RequirePermission for PERMISSIONS.USERS_MANAGE
    - Wrap "Role Management" section with RequirePermission for PERMISSIONS.ROLES_MANAGE
    - Wrap "System Settings" section with RequirePermission for PERMISSIONS.SETTINGS_MANAGE
    - DO NOT change settings UI styling or layout
    - _Requirements: 14.1, 14.2, 14.4_

  - [ ] 7.10 Hide unauthorized top header action buttons
    - Open `src/components/layout/TopHeader.jsx` file
    - Identify any action buttons that should be permission-protected
    - Wrap "Reset Demo" button with RequirePermission for PERMISSIONS.SETTINGS_MANAGE (if applicable)
    - DO NOT change header styling, layout, or existing functionality
    - _Requirements: 5.4, 14.1, 14.2_

- [ ] 8. Checkpoint — Route Protection and Component Enforcement Complete
  - Ensure all routes are protected, verify action buttons hide/show correctly per role, ask the user if questions arise.

- [ ] 9. Final Testing and Validation
  - [ ] 9.1 Test role switching behavior for all 4 roles
    - Manually test switching to hotel_manager → verify all nav items visible, all routes accessible
    - Manually test switching to front_office → verify limited nav items, cannot access /reports or /housekeeping
    - Manually test switching to housekeeping → verify minimal nav items, cannot access /reservations or /cashiering
    - Manually test switching to waiter_fnb → verify F&B nav items only, cannot access /rooms or /reservations
    - _Requirements: 15.1, 15.6_

  - [ ] 9.2 Test unauthorized route access via direct URL navigation
    - Set role to front_office, manually type /reports in browser → verify redirect to /dashboard with toast
    - Set role to housekeeping, manually type /cashiering in browser → verify redirect to /housekeeping with toast
    - Set role to waiter_fnb, manually type /rooms in browser → verify redirect to /fnb with toast
    - Verify console logs show access denial details
    - _Requirements: 15.2, 13.4_

  - [ ] 9.3 Test session persistence across browser refresh
    - Select front_office role, refresh browser → verify role persists and navigation remains filtered
    - Select housekeeping role, navigate to /housekeeping, refresh → verify role persists
    - Close browser, reopen, navigate to app → verify role restores from localStorage (default: hotel_manager)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 15.5_

  - [ ] 9.4 Test Demo Mode badge visibility and functionality
    - Verify badge displays on all pages when non-manager role selected
    - Verify badge shows correct role name for all roles
    - Verify clicking badge navigates to Settings page with role switcher visible
    - Verify badge positioning does not overlap with other UI elements
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 15.7_

  - [ ] 9.5 Test action button visibility for all roles
    - Set role to housekeeping → verify no billing or reservation action buttons visible anywhere
    - Set role to waiter_fnb → verify no hotel-side action buttons visible
    - Set role to front_office → verify no housekeeping-specific buttons visible
    - Set role to hotel_manager → verify all action buttons visible
    - _Requirements: 14.1, 14.2, 14.3, 15.3_

  - [ ]* 9.6 Run all property-based tests and verify correctness properties
    - Execute all 6 property-based tests with 100 iterations each
    - Verify Property 1: Permission key format validation passes
    - Verify Property 2: Hotel manager wildcard access passes
    - Verify Property 3: Permission check consistency passes
    - Verify Property 4: canAny disjunction correctness passes
    - Verify Property 5: Navigation config completeness passes
    - Verify Property 6: Sidebar navigation filtering passes
    - _Requirements: 15.8_

- [ ] 10. Final Checkpoint — Complete System Validation
  - Ensure all tests pass (unit, integration, property-based), verify all requirements met, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability (see requirements.md)
- Property-based tests use fast-check library for JavaScript/TypeScript
- The implementation uses React 18+ with Zustand for state management
- All route protection must occur BEFORE rendering page content (no flash of unauthorized content)
- The system is designed for demo/training mode only — backend API integration is out of scope
- Console logging for unauthorized access attempts helps students understand access control concepts
- Hotel Manager role must have 100% identical view to current state (wildcard "*" permission)
- DO NOT modify any existing UI, styling, colors, or layouts that are not explicitly required by RBAC logic
- Integration approach: surgical edits to existing files, no full rewrites

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.7"] },
    { "id": 2, "tasks": ["1.4", "1.5", "1.6", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.5"] },
    { "id": 4, "tasks": ["3.4", "5.1", "5.3"] },
    { "id": 5, "tasks": ["5.2", "5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 9, "tasks": ["9.6"] }
  ]
}
```
