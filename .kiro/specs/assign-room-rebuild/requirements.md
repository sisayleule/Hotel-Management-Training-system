# Requirements Document

## Introduction

This document specifies the requirements for rebuilding the Assign Room feature in the Fortune Next v6.5 Hotel Management Training PMS. The feature provides a search-first interface for finding reservations and assigning available rooms through an intuitive grid/floor view with comprehensive filtering and validation capabilities. This rebuild replaces the existing AssignRooms.jsx component with a modern, user-friendly interface that follows the same design patterns as the Amend Booking and Cancel Booking modules.

## Glossary

- **Assign_Room_Module**: The dedicated page at /reservations/assign for searching reservations and assigning rooms
- **Reservation_Search**: A multi-field search interface supporting queries by reservation number, guest name, arrival date, departure date, and booking status
- **Reservation_Summary**: A display component showing complete reservation details before room assignment
- **Room_Availability_Grid**: A visual grid or floor view displaying all available rooms with status indicators
- **Room_Status_Badge**: Color-coded visual indicators for room states (Ready, Reserved, Occupied, Dirty, Out of Service, Under Maintenance, Blocked)
- **Assignment_Action**: The process of linking a room to a reservation with validation and confirmation
- **Assignment_Validation**: Rules that prevent invalid assignments (occupied rooms, OOS rooms, type mismatches)
- **Confirmation_Dialog**: A final review step showing assignment details before committing changes
- **Room_Type_Compatibility**: Validation ensuring assigned room matches reservation room type (unless authorized upgrade/downgrade)
- **Availability_Update**: Immediate status change when room is assigned or unassigned
- **Search_First_Pattern**: UI pattern where users search first, then act (matches Amend/Cancel Booking UX)
- **Floor_View**: Grouping of rooms by floor number for easy visual scanning
- **Room_Filter**: UI controls to narrow room selection by floor, type, status, or availability

## Requirements

### Requirement 1: Search-First Landing Page and Routing

**User Story:** As a front office agent, I want a dedicated Assign Room page where I can search for reservations first, so that I can find the right booking before assigning rooms.

#### Acceptance Criteria

1. THE Assign_Room_Module SHALL be accessible at the route path "/reservations/assign"
2. THE route SHALL be wrapped in RBAC ProtectedRoute requiring PERMISSIONS.RESERVATIONS_EDIT
3. WHERE the current role lacks PERMISSIONS.RESERVATIONS_EDIT, THEN THE system SHALL redirect to the role's default dashboard with "Access Denied" toast
4. THE "/reservations/assign" route SHALL be placed BEFORE "/reservations/:id" route in App.tsx
5. THE static route SHALL match before the dynamic :id parameter to prevent routing collision
6. THE existing "/reservations/:id/assign" route MAY remain functional for direct reservation-specific assignment
7. WHEN selecting a reservation from search results, THE system SHALL load that reservation for room assignment in-page

### Requirement 2: Multi-Field Reservation Search

**User Story:** As a front office agent, I want to search for reservations using multiple criteria, so that I can quickly find bookings that need room assignments.

#### Acceptance Criteria

1. THE Reservation_Search interface SHALL provide input fields for: Reservation Number, Guest Name, Arrival Date, Departure Date, Booking Status
2. THE search SHALL filter reservations in real-time as criteria are entered
3. THE search SHALL use AND logic when multiple fields are filled
4. THE search SHALL match reservation_no with partial, case-insensitive matching
5. THE search SHALL match guest_name with partial, case-insensitive matching
6. THE search SHALL match arrival date with exact date matching
7. THE search SHALL match departure date with exact date matching
8. THE search SHALL filter by booking status (Confirmed, Checked In)
9. THE search results SHALL display in a table or card list showing: Res No., Guest Name, Status, Room Type, Arrival, Departure, Current Assignment
10. WHEN a user clicks a search result, THE system SHALL load that reservation's details for room assignment

### Requirement 3: Reservation Summary Display

**User Story:** As a front office agent, I want to see complete reservation details before assigning a room, so that I can verify guest requirements and current assignment status.

#### Acceptance Criteria

1. WHEN a reservation is selected, THE Reservation_Summary SHALL display reservation_no prominently
2. THE Reservation_Summary SHALL display guest_name
3. THE Reservation_Summary SHALL display booking status as a colored badge
4. THE Reservation_Summary SHALL display room_type required for the reservation
5. THE Reservation_Summary SHALL display arrival date and departure date
6. THE Reservation_Summary SHALL display number of nights
7. THE Reservation_Summary SHALL display adults count and children count
8. THE Reservation_Summary SHALL display current assigned room (if any) in a highlighted section
9. THE Reservation_Summary SHALL display special_requests or notes (if any)
10. WHEN no room is currently assigned, THE system SHALL display "No Room Assigned" message
11. THE Reservation_Summary SHALL remain visible while browsing available rooms

### Requirement 4: Room Availability Grid Display

**User Story:** As a front office agent, I want to see all available rooms in a visual grid layout, so that I can quickly identify suitable rooms for assignment.

#### Acceptance Criteria

1. THE Room_Availability_Grid SHALL display all rooms from the rooms array in the store
2. THE grid SHALL show each room as a card or tile with: Room Number, Room Type, Floor, Current Status
3. THE grid SHALL use color-coded Room_Status_Badge for visual status identification
4. THE grid SHALL support grid view AND floor-based view (grouped by floor)
5. WHEN in grid view, THE rooms SHALL be arranged in a responsive grid (3-4 columns desktop, 2 columns tablet, 1 column mobile)
6. WHEN in floor view, THE rooms SHALL be grouped by floor number with floor headers
7. THE grid SHALL update in real-time when filters are applied
8. THE grid SHALL highlight rooms that match the reservation's room_type
9. THE grid SHALL visually disable rooms that are unavailable for assignment
10. THE grid SHALL display housekeeping status for each room

### Requirement 5: Room Status Color-Coding

**User Story:** As a front office agent, I want rooms color-coded by status, so that I can immediately see which rooms are ready for guests.

#### Acceptance Criteria

1. THE Room_Status_Badge SHALL use green color scheme for "vacant_clean" or "ready" status
2. THE Room_Status_Badge SHALL use blue color scheme for "reservation" or "reserved" status
3. THE Room_Status_Badge SHALL use orange color scheme for "occupied" status
4. THE Room_Status_Badge SHALL use yellow color scheme for "dirty" status
5. THE Room_Status_Badge SHALL use red color scheme for "out_of_service" status
6. THE Room_Status_Badge SHALL use purple color scheme for "maintenance" or "under_maintenance" status
7. THE Room_Status_Badge SHALL use gray color scheme for "blocked" status
8. THE Room_Status_Badge SHALL display status text in uppercase with appropriate icon

### Requirement 6: Room Filtering

**User Story:** As a front office agent, I want to filter rooms by floor, type, and status, so that I can narrow down suitable room options quickly.

#### Acceptance Criteria

1. THE Room_Availability_Grid SHALL provide a filter dropdown or bar for Floor selection
2. THE Floor filter SHALL include options for each floor number present in the rooms data
3. THE Room_Availability_Grid SHALL provide a filter dropdown for Room Type selection
4. THE Room Type filter SHALL include all room type codes (DLX, SUI, EXEC, STD, etc.)
5. THE Room_Availability_Grid SHALL provide a filter dropdown for Room Status selection
6. THE Room Status filter SHALL include all status options (Ready, Occupied, Dirty, OOS, etc.)
7. THE Room_Availability_Grid SHALL provide an "Available Only" toggle filter
8. WHEN "Available Only" is enabled, THE grid SHALL show only vacant_clean rooms
9. THE filters SHALL apply cumulatively with AND logic
10. THE system SHALL provide a "Clear Filters" button to reset all filters at once

### Requirement 7: Room Assignment Action

**User Story:** As a front office agent, I want to assign an available room to a reservation, so that guests have accommodations ready upon arrival.

#### Acceptance Criteria

1. WHEN viewing the room grid with a reservation selected, EACH available room card SHALL display an "Assign" button
2. WHEN a user clicks the "Assign" button, THE system SHALL show a Confirmation_Dialog
3. THE Confirmation_Dialog SHALL display: Guest Name, Reservation Number, Selected Room Number, Room Type, Stay Dates (arrival and departure)
4. THE Confirmation_Dialog SHALL have a "Confirm Assignment" button and a "Cancel" button
5. WHEN the user clicks "Confirm Assignment", THE system SHALL call assignRoomToReservation store action
6. THE store action SHALL update the reservation's rooms_assigned array
7. THE store action SHALL update the room's status, guest_name, and reservation_no fields
8. WHEN assignment succeeds, THE system SHALL display success toast notification
9. WHEN assignment succeeds, THE room grid SHALL refresh to show updated availability
10. THE assigned room SHALL appear in the reservation summary "Current Assignment" section

### Requirement 8: Change Existing Assignment

**User Story:** As a front office agent, I want to change a room assignment before check-in, so that I can accommodate guest requests or resolve overbooking.

#### Acceptance Criteria

1. WHEN a reservation already has an assigned room, THE Reservation_Summary SHALL show "Change Assignment" button
2. WHEN the user clicks "Change Assignment", THE system SHALL allow selecting a different room from the grid
3. THE Confirmation_Dialog SHALL show both: "Current Room: [X]" and "New Room: [Y]"
4. WHEN confirmed, THE system SHALL release the old room (set to vacant_clean) and assign the new room
5. THE old room SHALL immediately appear as available in the grid
6. THE new room SHALL immediately show as reserved
7. THE system SHALL display toast: "Room assignment changed from [X] to [Y]"

### Requirement 9: Assignment Validation - Occupied/OOS Rooms

**User Story:** As a system administrator, I want the system to prevent assignment of occupied or out-of-service rooms, so that we maintain data integrity.

#### Acceptance Criteria

1. WHEN a room has status "occupied", THE "Assign" button SHALL be disabled
2. WHEN a room has status "out_of_service", THE "Assign" button SHALL be disabled
3. WHEN a room has status "blocked", THE "Assign" button SHALL be disabled
4. WHEN a room has status "maintenance" or "under_maintenance", THE "Assign" button SHALL be disabled
5. WHEN a room has status "dirty", THE "Assign" button SHALL be enabled with a warning indicator
6. WHEN attempting to assign a dirty room, THE Confirmation_Dialog SHALL display a warning: "⚠️ Room needs cleaning - proceed anyway?"
7. THE system SHALL NOT allow assignment if guest_name is already populated for the room (indicates current occupancy)

### Requirement 10: Assignment Validation - Room Type Compatibility

**User Story:** As a front office agent, I want the system to warn me about room type mismatches, so that I don't accidentally assign a wrong room type to a guest.

#### Acceptance Criteria

1. WHEN a reservation requires room_type "DLX" and user selects a "DLX" room, THE assignment SHALL proceed without warnings
2. WHEN a reservation requires room_type "STD" and user selects a "DLX" room, THE Confirmation_Dialog SHALL display: "⬆️ Upgrade: Assigning DLX to STD reservation"
3. WHEN a reservation requires room_type "DLX" and user selects a "STD" room, THE Confirmation_Dialog SHALL display: "⬇️ Downgrade: Assigning STD to DLX reservation"
4. THE system SHALL allow upgrades and downgrades but require explicit confirmation
5. THE Confirmation_Dialog SHALL have a checkbox: "I confirm this room type change is authorized"
6. THE "Confirm Assignment" button SHALL be disabled until the checkbox is checked (for mismatches only)

### Requirement 11: Immediate Availability Update

**User Story:** As a front office agent, I want room availability to update immediately after assignment, so that I don't accidentally double-book rooms.

#### Acceptance Criteria

1. WHEN a room is assigned, THE room status SHALL update to "reservation" in the store
2. THE room grid SHALL re-render showing the updated status
3. THE newly assigned room SHALL display with "reserved" color badge
4. THE newly assigned room's "Assign" button SHALL be disabled
5. THE room SHALL show reservation_no and guest_name in its card details
6. WHEN viewing the Reservations list, THE assigned room SHALL appear in the "Assigned Room" column
7. THE update SHALL propagate to all components using the rooms store

### Requirement 12: Integration with Existing Entry Points

**User Story:** As a developer, I want all existing assignment entry points to use the new module, so that the user experience is consistent.

#### Acceptance Criteria

1. IN Reservations.jsx table, THE "Assign Room" action link SHALL navigate to "/reservations/assign?id={resvNo}"
2. IN DetailedReservation.jsx toolbar, THE Home icon SHALL navigate to "/reservations/assign?id={resvNo}"
3. IF a check-in workflow auto-redirects to room assignment, IT SHALL redirect to "/reservations/assign?id={resvNo}"
4. THE old AssignRooms.jsx component SHALL be replaced or updated to align with the new interface
5. THE system SHALL maintain consistent assignment UX across all entry points

### Requirement 13: URL Parameter Support

**User Story:** As a developer, I want the assign room page to support URL parameters, so that users can navigate directly to assign a specific reservation.

#### Acceptance Criteria

1. WHEN the Assign_Room_Module receives URL parameter "?id=RES001", THE module SHALL automatically load reservation "RES001"
2. WHEN a valid reservation is auto-loaded, THE module SHALL skip search mode and display the Reservation_Summary
3. WHEN an invalid reservation ID is provided, THE module SHALL display error toast and show search mode
4. WHEN no URL parameter is provided, THE module SHALL start in search mode

### Requirement 14: Keyboard Navigation and Enter-as-Tab

**User Story:** As a front office agent, I want keyboard navigation in the search form, so that I can work efficiently without constantly switching to mouse.

#### Acceptance Criteria

1. WHEN the user presses Enter in any search field, THE focus SHALL move to the next search field
2. WHEN the user presses Enter in the last search field, THE search SHALL execute
3. THE search form SHALL use the useEnterAsTab hook for keyboard navigation
4. THE room grid cards SHALL support keyboard focus for accessibility

### Requirement 15: Visual Design and IDS Classic Theme

**User Story:** As a hotel manager, I want the assign room interface to match our IDS Classic theme, so that the system maintains visual consistency.

#### Acceptance Criteria

1. THE Assign_Room_Module SHALL use IDS Classic beige color scheme
2. THE module SHALL use font-black for headings, uppercase tracking-wider for labels
3. THE module SHALL use border-ids-border for all borders
4. THE module SHALL use shadow-3xs for card elements
5. THE room grid cards SHALL use consistent card styling (border, rounded corners, hover effects)
6. THE Room_Status_Badge SHALL follow the color scheme defined in Requirement 5
7. THE module SHALL be responsive (mobile-first, grid layouts adapt to screen size)
8. THE base font size SHALL be text-xs (12px) matching other PMS pages

### Requirement 16: Error Handling and User Feedback

**User Story:** As a front office agent, I want clear feedback when assignment fails or encounters errors, so that I can understand what went wrong and take appropriate action.

#### Acceptance Criteria

1. WHEN assignment processing fails, THE module SHALL display an error toast describing the failure
2. WHEN a room is not found in the store, THE module SHALL display "Room not found - it may have been removed"
3. WHEN a reservation is not found, THE module SHALL display "Reservation not found - it may have been deleted"
4. WHEN validation fails, THE module SHALL display field-specific error messages
5. THE module SHALL use toast notifications for success and error messages
6. SUCCESS toasts SHALL use green color scheme with checkmark icon, auto-dismiss after 3 seconds
7. ERROR toasts SHALL use red color scheme with warning icon, auto-dismiss after 4 seconds

## Acceptance Criteria Summary

This requirements document defines 16 requirements with 127 acceptance criteria covering:
- Search-first landing page with proper routing
- Multi-field reservation search with real-time filtering
- Comprehensive reservation summary display
- Visual room availability grid with color-coded status badges
- Room filtering by floor, type, status, and availability
- Assignment actions with confirmation dialogs
- Change existing assignments before check-in
- Validation rules for occupied/OOS rooms and room type compatibility
- Immediate availability updates across the system
- Integration with all existing entry points
- URL parameter support for direct navigation
- Keyboard navigation with Enter-as-Tab
- IDS Classic theme styling and responsive design
- Error handling and user feedback
