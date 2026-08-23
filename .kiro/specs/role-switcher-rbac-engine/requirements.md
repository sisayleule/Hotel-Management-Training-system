# Requirements Document

## Introduction

This document specifies the requirements for implementing a fully functional Role-Based Access Control (RBAC) system with a Role Switcher interface for the Fortune Next v6.5 Hotel Management Training PMS. The system transforms the existing cosmetic role selector in the Demo panel into an application-wide RBAC engine that controls navigation, routing, and action permissions based on the currently selected role. The system supports four distinct roles: Hotel Manager, Front Office, Housekeeping, and Waiter/F&B staff.

## Glossary

- **RBAC_System**: The Role-Based Access Control system that manages roles, permissions, and access enforcement
- **Role**: A named staff position (hotel_manager, front_office, housekeeping, waiter_fnb) with a specific set of permissions
- **Permission**: A granular access right identified by a key (e.g., "reservations.view", "billing.post_charges")
- **Role_Context**: The global application state store that tracks the currently active role and resolved permissions
- **Demo_Mode**: A training simulation mode where users can switch between roles to preview different staff experiences
- **Protected_Route**: A route component that enforces permission checks before rendering content
- **Permission_Helper**: A utility function (can, canAny) that evaluates whether the current role has specific permissions
- **NAV_CONFIG**: A mapping that defines which navigation items appear in the sidebar for each role
- **ROLE_PERMISSIONS**: A data structure that maps each role to its array of allowed permissions
- **Default_Dashboard**: The landing page automatically displayed when a user switches to a specific role
- **Session_Persistence**: The ability of the role selection to survive browser refresh
- **Unauthorized_Access**: An attempt to access a route or perform an action without the required permission
- **Permission_Wildcard**: The "*" symbol indicating full system access (hotel_manager only)

## Requirements

### Requirement 1: Role and Permission Data Model

**User Story:** As a system architect, I want a well-defined role and permission data model, so that the RBAC system has a single source of truth for access control rules.

#### Acceptance Criteria

1. THE RBAC_System SHALL define exactly four Role entities: hotel_manager, front_office, housekeeping, and waiter_fnb
2. THE RBAC_System SHALL define granular Permission keys covering: reservations (view/create/edit/cancel), guests (view/edit), rooms (view/change_status/configure), housekeeping (view/update_status/report_maintenance), checkin operations, checkout operations, billing (post_charges/process_payments/generate_invoice), F&B operations (create_order/manage_tables/send_to_kitchen/print_bill/process_payment), reports, analytics, user management, role management, settings management, and inventory management
3. THE RBAC_System SHALL store ROLE_PERMISSIONS as a mapping where hotel_manager receives Permission_Wildcard "*" and all other Role entities receive explicit Permission arrays
4. THE RBAC_System SHALL store NAV_CONFIG as a mapping where each Role maps to an array of visible navigation items and a Default_Dashboard path
5. FOR ALL Permission keys, THE RBAC_System SHALL use dot-notation format (category.action) to enable hierarchical permission checks

### Requirement 2: Global Role Context

**User Story:** As a frontend developer, I want an app-wide role state manager, so that all components can read the current role and permissions consistently.

#### Acceptance Criteria

1. THE Role_Context SHALL expose a currentRole property identifying the active Role
2. THE Role_Context SHALL expose a permissions property containing the resolved Permission array for the currentRole
3. THE Role_Context SHALL expose a setRole(roleId) method that updates currentRole and resolves permissions
4. WHEN setRole is invoked, THE Role_Context SHALL persist the new Role selection to browser storage to enable Session_Persistence
5. WHEN the application loads, THE Role_Context SHALL restore the previously selected Role from browser storage if available
6. THE Role_Context SHALL include a demoMode boolean flag indicating Demo_Mode is active
7. THE Role_Context SHALL expose a roleName property containing the human-readable display name of the currentRole

### Requirement 3: Permission Evaluation System

**User Story:** As a component developer, I want simple permission checking functions, so that I can conditionally render UI elements and protect actions based on user permissions.

#### Acceptance Criteria

1. THE RBAC_System SHALL provide a Permission_Helper function "can(permissionKey)" that returns true if the currentRole has the specified Permission
2. WHEN currentRole is hotel_manager, THE can function SHALL return true for any Permission key (Permission_Wildcard behavior)
3. THE RBAC_System SHALL provide a Permission_Helper function "canAny(permissionKeys)" that returns true if the currentRole has at least one Permission from the provided array
4. THE RBAC_System SHALL provide a RequirePermission wrapper component that renders children only when can(permission) returns true
5. WHEN RequirePermission receives a permission that evaluates to false, THE component SHALL render nothing (not greyed-out, not disabled — completely absent)

### Requirement 4: Route Protection and Enforcement

**User Story:** As a security-conscious developer, I want all routes to enforce permissions at navigation time, so that unauthorized users cannot access restricted pages even by typing URLs directly.

#### Acceptance Criteria

1. THE RBAC_System SHALL provide a Protected_Route wrapper component that accepts a requiredPermissions prop
2. WHEN a user navigates to a Protected_Route, THE component SHALL evaluate whether the currentRole has all requiredPermissions
3. IF the currentRole lacks any required Permission, THEN THE Protected_Route SHALL redirect the user to the role's Default_Dashboard
4. WHEN Unauthorized_Access occurs via Protected_Route, THE RBAC_System SHALL display a toast notification stating "Access Denied: You do not have permission to view this page"
5. THE RBAC_System SHALL re-evaluate permissions on all navigation events including: sidebar clicks, URL entry, browser refresh, and browser back/forward actions
6. THE RBAC_System SHALL enforce route protection before rendering any page content (no flash of unauthorized content)

### Requirement 5: Navigation Menu Filtering

**User Story:** As a training user, I want to see only the navigation items relevant to my current role, so that I am not confused or tempted by options I cannot use.

#### Acceptance Criteria

1. WHEN the sidebar renders, THE RBAC_System SHALL display only the navigation items defined in NAV_CONFIG for the currentRole
2. THE sidebar SHALL NOT display unauthorized navigation items in any state (not greyed-out, not disabled — completely absent)
3. WHEN a user switches Role entities, THE sidebar SHALL immediately re-render with the new Role's navigation items without requiring page reload
4. WHEN the top header renders action buttons, THE RBAC_System SHALL hide buttons that require Permission keys not held by the currentRole
5. FOR ALL navigation filtering, THE RBAC_System SHALL use the can() Permission_Helper to evaluate visibility

### Requirement 6: Hotel Manager Full Access

**User Story:** As a hotel manager, I want unrestricted access to all system features, so that I can oversee and manage all hotel operations.

#### Acceptance Criteria

1. THE RBAC_System SHALL assign Permission_Wildcard "*" to the hotel_manager Role
2. WHEN currentRole is hotel_manager, THE can(permissionKey) function SHALL return true for any Permission key
3. WHEN currentRole is hotel_manager, THE sidebar SHALL display all available navigation items
4. WHEN currentRole is hotel_manager, THE Default_Dashboard SHALL be "/dashboard"
5. THE hotel_manager Role SHALL have access to settings management, user management, and role management features

### Requirement 7: Front Office Role Permissions

**User Story:** As a front office receptionist, I want access to reservation, check-in, check-out, and billing functions, so that I can serve guests without accessing housekeeping or management areas.

#### Acceptance Criteria

1. THE RBAC_System SHALL assign the following Permission keys to the front_office Role: reservations.view, reservations.create, reservations.edit, checkin.perform, checkout.perform, rooms.view, rooms.change_status, guests.view, guests.edit, billing.post_charges, billing.process_payments, billing.generate_invoice
2. THE RBAC_System SHALL deny the following Permission keys to the front_office Role: settings.manage, users.manage, roles.manage, reports.view, analytics.view, housekeeping.*, inventory.manage
3. WHEN currentRole is front_office, THE Default_Dashboard SHALL be "/operations/today" (or equivalent operational view)
4. WHEN currentRole is front_office, THE sidebar SHALL display navigation items for: Dashboard, Room Status, Reservations, Check In, Check Out, Cashiering
5. WHEN a front_office user attempts to access /reports, /settings/admin, or /housekeeping routes, THE RBAC_System SHALL trigger Unauthorized_Access handling

### Requirement 8: Housekeeping Role Permissions

**User Story:** As a housekeeping staff member, I want access only to room status and housekeeping tasks, so that I can focus on cleaning and maintenance without accessing guest financial information.

#### Acceptance Criteria

1. THE RBAC_System SHALL assign the following Permission keys to the housekeeping Role: rooms.view, housekeeping.update_status, housekeeping.view, housekeeping.report_maintenance
2. THE RBAC_System SHALL deny the following Permission keys to the housekeeping Role: reservations.*, checkin.perform, checkout.perform, billing.*, reports.view, analytics.view, settings.manage, users.manage
3. WHEN currentRole is housekeeping, THE Default_Dashboard SHALL be "/housekeeping"
4. WHEN currentRole is housekeeping, THE sidebar SHALL display navigation items for: Housekeeping, Room Status (filtered to assigned rooms only)
5. WHEN a housekeeping user attempts to access /reservations, /cashiering, or /settings routes, THE RBAC_System SHALL trigger Unauthorized_Access handling
6. WHEN a housekeeping user views rooms, THE RBAC_System SHALL filter the display to show only rooms assigned to the current housekeeping staff member

### Requirement 9: Waiter/F&B Role Permissions

**User Story:** As a restaurant waiter, I want access only to F&B ordering and billing functions, so that I can serve restaurant guests without accessing hotel room operations.

#### Acceptance Criteria

1. THE RBAC_System SHALL assign the following Permission keys to the waiter_fnb Role: fnb.create_order, fnb.manage_tables, fnb.send_to_kitchen, fnb.print_bill, fnb.process_payment
2. THE RBAC_System SHALL deny the following Permission keys to the waiter_fnb Role: reservations.*, rooms.*, housekeeping.*, settings.manage, users.manage
3. WHEN currentRole is waiter_fnb, THE Default_Dashboard SHALL be "/fnb"
4. WHEN currentRole is waiter_fnb, THE sidebar SHALL display navigation items for: F&B Orders, Table Management
5. WHEN a waiter_fnb user attempts to access /rooms, /reservations, /housekeeping, or /settings routes, THE RBAC_System SHALL trigger Unauthorized_Access handling

### Requirement 10: Role Switch UI and Behavior

**User Story:** As a training user, I want a clear and intuitive role switcher interface, so that I can easily preview how the system looks and behaves for different staff roles.

#### Acceptance Criteria

1. WHEN the user navigates to Settings → Demo, THE RBAC_System SHALL display a "Role Switcher (Demo)" panel
2. THE Role Switcher panel SHALL display helper text: "Preview how the system looks and behaves for each staff role. This is for demonstration only — no real user accounts are affected."
3. FOR ALL four Role entities, THE Role Switcher SHALL display a role card containing: role icon, role name, one-line description, a "You'll be able to…" bulleted list of top 3-4 Permission keys, and a [Switch to this role] button
4. WHEN a Role card represents the currentRole, THE card SHALL be visually highlighted with a "Currently Active" indicator
5. WHEN the user clicks [Switch to this role], THE Role_Context SHALL invoke setRole(selectedRole) to update the currentRole
6. WHEN setRole is invoked, THE RBAC_System SHALL immediately update the global Role_Context without requiring page reload
7. WHEN setRole is invoked, THE RBAC_System SHALL redirect the user to the new role's Default_Dashboard
8. WHEN setRole is invoked, THE sidebar SHALL re-render with the new role's NAV_CONFIG items
9. IF the user is currently viewing a page that the new Role lacks Permission to access, THEN THE RBAC_System SHALL redirect to the Default_Dashboard and display an "Access Denied" toast notification

### Requirement 11: Demo Mode Badge Display

**User Story:** As a training user, I want a persistent visual indicator showing my current role, so that I always know which staff perspective I am viewing.

#### Acceptance Criteria

1. WHEN Demo_Mode is active and currentRole is not hotel_manager, THE RBAC_System SHALL display a persistent badge on all pages
2. THE Demo_Mode badge SHALL display the text: "Demo Mode — Viewing as: [Role_Name]"
3. THE Demo_Mode badge SHALL include a clickable link to Settings → Demo
4. THE Demo_Mode badge SHALL be positioned in a non-intrusive location (e.g., top-right corner, below header)
5. WHEN currentRole is hotel_manager, THE Demo_Mode badge SHALL display "Demo Mode — Viewing as: Hotel Manager" or may be hidden (implementation choice)
6. THE Demo_Mode badge SHALL persist across page navigation and browser refresh

### Requirement 12: Session Persistence and Refresh Handling

**User Story:** As a training user, I want my role selection to survive page refreshes, so that I don't have to re-select my role after every navigation or reload.

#### Acceptance Criteria

1. WHEN a user selects a Role via setRole, THE Role_Context SHALL store the selected Role identifier in browser localStorage
2. WHEN the application initializes, THE Role_Context SHALL read the stored Role identifier from localStorage and restore the currentRole
3. WHEN a user refreshes the browser on a Protected_Route, THE RBAC_System SHALL re-evaluate permissions using the restored currentRole
4. IF the restored currentRole lacks Permission for the current route, THEN THE RBAC_System SHALL redirect to the Default_Dashboard for that Role
5. WHEN no stored Role is found in localStorage, THE Role_Context SHALL default to hotel_manager Role

### Requirement 13: Security and Server-Side Verification

**User Story:** As a security architect, I want the RBAC system to treat role checks as real security boundaries, so that the system models production-grade access control for training purposes.

#### Acceptance Criteria

1. THE RBAC_System SHALL check Permission keys before both rendering UI elements and executing actions
2. FOR ALL API or service-layer calls, THE application SHALL include the currentRole in the request context for server-side verification (even in demo/training mode)
3. THE RBAC_System SHALL re-evaluate permissions on all navigation events: direct URL entry, browser back/forward, page refresh, and programmatic navigation
4. THE RBAC_System SHALL log all Unauthorized_Access attempts to the browser console for educational audit purposes
5. THE RBAC_System SHALL NOT rely solely on frontend permission checks — all security-critical operations SHALL be verified at the API/service layer

### Requirement 14: Action Button Permission Enforcement

**User Story:** As a component developer, I want action buttons to automatically hide or disable based on permissions, so that users never see options they cannot execute.

#### Acceptance Criteria

1. WHEN an action button requires a specific Permission, THE button component SHALL evaluate can(permission) before rendering
2. IF can(permission) returns false, THEN THE button SHALL NOT render (not disabled, not greyed-out — completely absent)
3. WHEN a Role switch occurs, THE RBAC_System SHALL trigger re-evaluation of all visible action buttons
4. THE RBAC_System SHALL provide a consistent pattern for wrapping action buttons in RequirePermission components
5. FOR ALL forms and modals that include action buttons, THE RBAC_System SHALL enforce Permission checks before displaying submit/save actions

### Requirement 15: Testing and Validation Requirements

**User Story:** As a QA engineer, I want a comprehensive test checklist for the RBAC system, so that I can verify all roles and permissions work correctly across all scenarios.

#### Acceptance Criteria

1. THE RBAC_System SHALL support testing where switching to each Role displays only the correct navigation items defined in NAV_CONFIG
2. THE RBAC_System SHALL support testing where manually typing a restricted URL (e.g., front_office typing /settings/admin) results in redirect to Default_Dashboard and displays a toast notification
3. THE RBAC_System SHALL support testing where a housekeeping user sees no billing or reservation action buttons anywhere in the application
4. THE RBAC_System SHALL support testing where a waiter_fnb user cannot access any hotel-side pages (rooms, reservations, housekeeping)
5. THE RBAC_System SHALL support testing where refreshing the browser on a restricted route maintains role persistence and enforces protection
6. THE RBAC_System SHALL support testing where switching to hotel_manager role restores full access immediately
7. THE RBAC_System SHALL support testing where the Demo_Mode badge is visible on every page when a non-manager role is active
8. FOR ALL testing scenarios, THE RBAC_System SHALL provide clear console logs indicating which permission check failed during Unauthorized_Access attempts

