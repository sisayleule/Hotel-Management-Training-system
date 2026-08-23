# Implementation Plan: Cancel Booking Feature

## Overview

This plan implements the Cancel Booking feature, enabling authorized hotel staff to search for reservations, validate their cancellability, capture cancellation reasons, and process cancellations with atomic updates to both reservation and room statuses. The implementation follows the IDS Classic theme design patterns and integrates with the existing Zustand store and RBAC system.

**Implementation Language**: JavaScript (React)

**Key Integration Points**:
- Zustand store (`useHotelStore`) for state management
- RBAC system for permission-based access control
- React Router for navigation and URL parameter handling
- IDS Classic theme for consistent styling

## Tasks

- [ ] 1. Set up component structure and imports
  - Create `src/components/housekeeping/CancelBooking.jsx` file
  - Import required React hooks (useState, useEffect, useMemo)
  - Import Zustand store hook (useHotelStore)
  - Import navigation hooks (useNavigate, useSearchParams)
  - Import UI components (PageWrapper, ReservationStatusBadge, Modal)
  - Import custom hooks (useEnterAsTab)
  - Import icons from lucide-react (Ban, Search, X, Check, AlertCircle)
  - Import toast from react-hot-toast
  - _Requirements: 1.3, 15.1_

- [ ] 2. Implement component state management
  - [ ] 2.1 Set up local state variables
    - Create `mode` state ("search" | "cancelling") for UI control
    - Create `searchCriteria` state object with fields: reservation_no, guest_name, phone, email, arrival, departure, room_no
    - Create `searchResults` state array for matching reservations
    - Create `selectedReservation` state for currently loaded reservation
    - Create `cancellationReason` state for user-entered reason text
    - Create `showConfirmDialog` state boolean for modal visibility
    - Create `errors` state object for validation error messages
    - _Requirements: 2.1, 2.2, 4.1, 6.1_

  - [ ] 2.2 Connect to Zustand global store
    - Use useHotelStore to access reservations array
    - Use useHotelStore to access rooms array
    - Use useHotelStore to access guests array
    - Use useHotelStore to access cancelReservation action
    - Use useHotelStore to access currentUser for role checking
    - _Requirements: 15.1, 15.2, 15.4, 15.5_

- [ ] 3. Implement RBAC authorization checks
  - [ ] 3.1 Create permission validation logic
    - Import PERMISSIONS constant from rbac.js
    - Check if currentUser has RESERVATIONS_CANCEL permission
    - Redirect to /unauthorized if permission check fails
    - Add manager-level indicator when role is hotel_manager
    - _Requirements: 1.3, 1.4, 1.5_

- [ ] 4. Implement multi-field search logic
  - [ ] 4.1 Create search handler function
    - Implement handleSearch function with AND logic for all filled fields
    - Filter reservations by reservation_no (case-insensitive partial match)
    - Filter by guest_name (case-insensitive partial match)
    - Filter by phone using guest database lookup
    - Filter by email using guest database lookup
    - Filter by arrival date (exact match)
    - Filter by departure date (exact match)
    - Filter by room_no (check rooms_assigned array)
    - Update searchResults state with filtered results
    - Auto-load reservation if exactly one match found
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 Write property test for multi-field search AND logic
    - **Property 2: Multi-field search applies AND logic**
    - **Validates: Requirements 2.2**
    - Generate random search criteria with multiple filled fields
    - Verify all results match ALL filled criteria
    - Run 100 iterations with different criteria combinations

- [ ] 5. Implement guest contact lookup functionality
  - [ ] 5.1 Create guest database query functions
    - Implement getGuestPhoneByName function
    - Implement getGuestEmailByName function
    - Use case-insensitive name matching
    - Return empty string if no matching guest found
    - Use first match when multiple guests share same name
    - Memoize guest lookup cache for performance
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

  - [ ]* 5.2 Write property test for guest contact lookup
    - **Property 19: Guest contact information populates from guest database**
    - **Validates: Requirements 12.2, 12.3**
    - Generate random guest records and reservations
    - Verify phone and email populate correctly from guest database
    - Verify empty fields when no matching guest

- [ ] 6. Implement reservation status validation
  - [ ] 6.1 Create status validation logic
    - Implement validateCancellableStatus function
    - Allow cancellation for "confirmed" and "checked_in" statuses
    - Block cancellation for "checked_out" status with warning message
    - Block cancellation for "cancelled" status with warning message
    - Disable cancel button for non-cancellable reservations
    - Display status-specific warning messages in UI
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.2 Write property test for status validation
    - **Property 4: Non-cancellable reservations disable cancel action**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Generate reservations with different statuses
    - Verify cancel button disabled for checked_out and cancelled
    - Verify appropriate warning messages displayed

- [ ] 7. Implement search form UI
  - [ ] 7.1 Create search mode layout
    - Render search form card with IDS Classic styling
    - Create responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
    - Add input fields for all search criteria (reservation_no, guest_name, phone, email, arrival, departure, room_no)
    - Apply font-mono to reservation_no, arrival, departure, room_no fields
    - Add Search and Clear buttons with IDS Classic theme colors
    - Set initial focus to reservation_no field
    - _Requirements: 2.1, 8.7, 14.2, 14.3, 14.4_

  - [ ] 7.2 Implement keyboard navigation
    - Use useEnterAsTab hook for Enter key navigation
    - Configure Enter key to advance to next field
    - Configure Enter on last field to trigger search
    - _Requirements: 8.1, 8.2_

  - [ ] 7.3 Implement Clear button functionality
    - Reset all searchCriteria fields to empty strings
    - Clear searchResults array
    - Clear errors object
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 7.4 Write property test for Enter key navigation
    - **Property 13: Enter key advances focus through search fields**
    - **Validates: Requirements 8.1**
    - Simulate Enter key press in different fields
    - Verify focus moves to next field
    - Verify last field triggers search

  - [ ]* 7.5 Write property test for Clear button
    - **Property 14: Clear button resets all search state**
    - **Validates: Requirements 8.4, 8.5**
    - Set various search criteria and results
    - Click Clear button
    - Verify all fields empty and results cleared

- [ ] 8. Implement search results display
  - [ ] 8.1 Create search results UI
    - Display "No reservations found" when searchResults is empty and criteria filled
    - Display instructional message when no criteria entered
    - Render results as clickable cards with hover effects
    - Display reservation_no, guest_name, status badge, arrival date, assigned rooms in each card
    - Use ReservationStatusBadge component for colored status display
    - Apply IDS Classic card styling (border-ids-border, shadow-3xs)
    - Format dates as DD-MMM-YYYY
    - Display rooms_assigned as comma-separated list with font-mono
    - Add click handler to load selected reservation
    - _Requirements: 2.3, 2.4, 2.6, 2.7, 2.8_

  - [ ]* 8.2 Write property test for search results display
    - **Property 3: Search results display required information**
    - **Validates: Requirements 2.6, 2.7**
    - Generate random search results
    - Verify each result card contains all required fields
    - Verify correct formatting applied

- [ ] 9. Implement reservation loading and detail display
  - [ ] 9.1 Create loadReservation function
    - Find reservation by reservation_no
    - Display error toast if reservation not found
    - Query guest database for contact information
    - Set selectedReservation state
    - Switch mode to "cancelling"
    - Run status validation
    - Update errors state with validation results
    - _Requirements: 2.8, 10.3, 12.1_

  - [ ] 9.2 Create reservation detail UI layout
    - Render detail card with IDS Classic styling
    - Create two-column grid on desktop, single column on mobile
    - Display reservation header (number, status badge, manager indicator)
    - Display guest information section (name, phone, email)
    - Display stay details section (arrival, departure, nights, adults, children)
    - Display room & billing section (room_type, assigned rooms, pay_mode, rate, total_amount)
    - Highlight assigned rooms with bg-amber-50 border-amber-200
    - Apply read-only styling to all fields
    - Use font-mono for numbers, dates, and IDs
    - Use uppercase tracking-wider for section labels
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 13.1-13.10_

  - [ ]* 9.3 Write property test for reservation detail display
    - **Property 11: Reservation details display all required fields**
    - **Validates: Requirements 7.1-7.7**
    - Generate random reservations
    - Verify all required fields rendered in detail view
    - Verify correct formatting and styling

  - [ ]* 9.4 Write property test for read-only fields
    - **Property 12: All reservation fields are read-only during cancellation**
    - **Validates: Requirements 3.6, 7.8**
    - Verify no editable input elements in detail display
    - Verify all fields rendered as read-only text

- [ ] 10. Implement cancellation reason input
  - [ ] 10.1 Create cancellation reason UI
    - Render reason card with red emphasis styling (bg-red-50, border-red-200)
    - Add textarea input with validation
    - Create suggested reason chips array
    - Render suggestion chips with IDS Classic styling
    - Add click handler to populate textarea with selected suggestion
    - Allow editing of suggested reasons
    - Display validation error message below textarea
    - _Requirements: 4.1, 4.5, 4.6, 4.7, 13.9_

  - [ ] 10.2 Implement cancellation reason validation
    - Create validateCancellationReason function
    - Check for empty reason (after trim)
    - Check for minimum 10 characters
    - Return appropriate error messages
    - Update errors state on validation failure
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 10.3 Write property test for reason validation
    - **Property 5: Cancellation reason validation enforces minimum length**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Generate random strings of various lengths
    - Verify validation accepts only strings with trimmed length >= 10
    - Verify appropriate error messages for failures

- [ ] 11. Implement confirmation dialog
  - [ ] 11.1 Create confirmation modal UI
    - Use Modal component with showConfirmDialog state
    - Display "Confirm Cancellation" heading
    - Show reservation_no, guest_name, rooms_assigned, cancellation_reason
    - Add "Confirm Cancel" button (red styling)
    - Add "Go Back" button (gray styling)
    - Handle backdrop click and ESC key to close without action
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

  - [ ] 11.2 Create handleCancelReservation function
    - Validate cancellation reason before showing dialog
    - Display validation error if reason invalid
    - Set showConfirmDialog to true if validation passes
    - _Requirements: 4.2, 6.1_

  - [ ]* 11.3 Write property test for confirmation dialog content
    - **Property 10: Confirmation dialog displays complete reservation context**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
    - Generate random reservations and reasons
    - Verify dialog displays all required information
    - Verify correct formatting

- [ ] 12. Checkpoint - Ensure all UI components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement cancellation processing
  - [ ] 13.1 Create confirmCancellation function
    - Call cancelReservation(reservation_no, cancellation_reason) from store
    - Wrap in try-catch for error handling
    - Display success toast on completion
    - Reset to search mode
    - Clear selectedReservation, cancellationReason, searchCriteria, searchResults
    - Close confirmation dialog
    - _Requirements: 5.1, 5.2, 5.7, 5.8, 6.6, 9.7, 15.2_

  - [ ]* 13.2 Write property test for reservation status update
    - **Property 6: Cancellation updates reservation status**
    - **Validates: Requirements 5.1**
    - Generate cancellable reservations
    - Call cancellation with valid reason
    - Verify status updated to "cancelled" in store

  - [ ]* 13.3 Write property test for reason storage
    - **Property 7: Cancellation stores reason with reservation**
    - **Validates: Requirements 5.2**
    - Generate various valid reasons
    - Call cancellation with each reason
    - Verify exact reason string stored in reservation record

  - [ ]* 13.4 Write property test for room status updates
    - **Property 8: Room status updates atomically with cancellation**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6**
    - Generate reservations with various room assignments
    - Cancel reservation
    - Verify all assigned rooms have status="vacant_clean"
    - Verify guest_name cleared to empty string
    - Verify reservation_no cleared to empty string

  - [ ]* 13.5 Write property test for success feedback
    - **Property 9: Successful cancellation displays confirmation and resets UI**
    - **Validates: Requirements 5.7, 5.8**
    - Cancel reservation
    - Verify success message displayed
    - Verify UI returned to search mode
    - Verify search fields cleared

  - [ ]* 13.6 Write property test for store integration
    - **Property 20: Store integration uses correct parameters**
    - **Validates: Requirements 15.2**
    - Mock cancelReservation action
    - Call cancellation
    - Verify action called with correct reservation_no and reason

  - [ ]* 13.7 Write property test for state propagation
    - **Property 21: Cancellation updates propagate to component state**
    - **Validates: Requirements 15.4, 15.5**
    - Cancel reservation
    - Verify component reflects updated store state
    - Verify both reservations and rooms arrays updated

- [ ] 14. Implement error handling
  - [ ] 14.1 Add error display components
    - Create inline field error display for validation errors
    - Create status warning display for non-cancellable reservations
    - Use red color scheme for error messages (text-red-600)
    - Add AlertCircle icon to error messages
    - _Requirements: 10.1, 10.4, 10.7_

  - [ ] 14.2 Add toast notifications
    - Configure success toasts with green color and checkmark icon
    - Configure error toasts with red color and warning icon
    - Set success toast auto-dismiss to 3 seconds
    - Add error messages for network failures, not found errors
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.8_

  - [ ]* 14.3 Write property test for validation error display
    - **Property 15: Validation failures display appropriate error messages**
    - **Validates: Requirements 10.1, 10.4**
    - Trigger various validation failures
    - Verify correct error message displayed for each failure
    - Verify field-specific error placement

- [ ] 15. Implement navigation controls
  - [ ] 15.1 Add Back to Search button
    - Display button in cancellation mode
    - Clear selectedReservation on click
    - Switch mode back to "search"
    - Preserve search results
    - Clear errors
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 15.2 Add back arrow navigation
    - Use PageWrapper backPath prop with "/reservations"
    - Navigate to reservations list page on click
    - _Requirements: 9.5, 9.6_

- [ ] 16. Implement URL parameter support
  - [ ] 16.1 Add URL parameter handling
    - Use useSearchParams hook to read "id" parameter
    - Create useEffect to handle auto-loading on mount
    - Call loadReservation with id if parameter present
    - Skip search mode if valid id provided
    - Display error and show search mode if invalid id
    - Apply same status validation for URL-loaded reservations
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 16.2 Write property test for valid URL parameter
    - **Property 16: Valid URL parameter bypasses search mode**
    - **Validates: Requirements 11.2**
    - Generate valid reservation IDs
    - Simulate URL parameter with valid ID
    - Verify search mode skipped
    - Verify reservation loaded directly

  - [ ]* 16.3 Write property test for invalid URL parameter
    - **Property 17: Invalid URL parameter shows error and search mode**
    - **Validates: Requirements 11.3**
    - Generate invalid/non-existent IDs
    - Simulate URL parameter with invalid ID
    - Verify error message displayed
    - Verify search mode presented

  - [ ]* 16.4 Write property test for URL parameter validation
    - **Property 18: URL parameter loading applies status validation**
    - **Validates: Requirements 11.5**
    - Load various reservation statuses via URL
    - Verify same validation rules applied
    - Verify appropriate warnings for non-cancellable statuses

- [ ] 17. Implement responsive design
  - [ ] 17.1 Apply responsive layout classes
    - Use grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for search form
    - Use flex-col md:flex-row for button groups
    - Use p-4 md:p-6 for card padding
    - Ensure minimum 44px touch targets on mobile (py-3 px-4 for buttons)
    - Test layout at breakpoints: mobile (<768px), tablet (768-1023px), desktop (≥1024px)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 18. Apply IDS Classic theme styling
  - [ ] 18.1 Apply color scheme
    - Use bg-ids-background for page background
    - Use border-ids-border for all borders
    - Use text-ids-sidebar for primary text
    - Use text-gray-400 for labels
    - Use shadow-3xs for cards
    - _Requirements: 13.1, 13.4, 13.5, 13.6, 13.7_

  - [ ] 18.2 Apply typography styles
    - Use font-black for headings
    - Use uppercase tracking-wider for labels
    - Use font-mono for reservation numbers, dates, room numbers
    - Use text-xs (12px) as base font size
    - _Requirements: 13.2, 13.3, 13.8_

- [ ] 19. Implement authorization property test
  - [ ]* 19.1 Write property test for authorization
    - **Property 1: Authorization gates cancellation interface access**
    - **Validates: Requirements 1.3**
    - Generate users with different roles and permissions
    - Verify interface accessible only with RESERVATIONS_CANCEL permission
    - Verify redirect for unauthorized users

- [ ] 20. Add route definition and RBAC integration
  - [ ] 20.1 Add route in App.tsx
    - Import CancelBooking component
    - Import RequirePermission guard
    - Import PERMISSIONS constant
    - Add route: /reservations/cancel
    - Wrap route with RequirePermission(RESERVATIONS_CANCEL)
    - _Requirements: 1.3, 1.4_

  - [ ] 20.2 Verify navigation menu configuration
    - Confirm menu item exists in rbac.js NAV_CONFIG
    - Verify menu item visible for hotel_manager and front_office
    - Verify menu item hidden for housekeeping and waiter_fnb
    - _Requirements: 1.1, 1.2_

- [ ] 21. Final checkpoint - Integration testing and verification
  - [ ] 21.1 Run all property-based tests
    - Verify all 21 properties pass with 100 iterations each
    - Verify property tags present in all property tests
    - Fix any failing properties

  - [ ] 21.2 Run all unit tests
    - Verify UI component rendering tests pass
    - Verify integration tests pass
    - Verify RBAC permission tests pass

  - [ ] 21.3 Manual testing checklist
    - Test complete workflow: search → select → validate → enter reason → confirm → cancel
    - Test with different user roles (hotel_manager, front_office, housekeeping)
    - Test URL parameter with valid and invalid reservation IDs
    - Test keyboard navigation in search form
    - Test responsive layout at mobile, tablet, desktop sizes
    - Test all error scenarios (not found, invalid status, validation failures)
    - Verify toast notifications display and auto-dismiss correctly
    - Verify state updates propagate correctly after cancellation

  - [ ] 21.4 Final verification
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- The existing Zustand store already has the `cancelReservation` action implemented - no store modifications needed
- All 21 correctness properties from the design document have corresponding property test sub-tasks
- Property tests should use fast-check library with minimum 100 iterations
- Each property test must include tags: `**Feature: cancel-booking-feature, Property {number}: {property_text}**`
- UI follows IDS Classic theme established in existing codebase
- Component integrates with existing infrastructure: PageWrapper, ReservationStatusBadge, Modal, useEnterAsTab
- RBAC configuration is already set up in rbac.js - only route definition needed
- Responsive design uses Tailwind breakpoints: md (768px), lg (1024px)
- Base font size is text-xs (12px) matching other PMS pages

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["4.1", "5.1", "6.1", "7.1"] },
    { "id": 3, "tasks": ["4.2", "5.2", "6.2", "7.2", "7.3", "8.1"] },
    { "id": 4, "tasks": ["7.4", "7.5", "8.2", "9.1"] },
    { "id": 5, "tasks": ["9.2", "10.1"] },
    { "id": 6, "tasks": ["9.3", "9.4", "10.2", "11.1"] },
    { "id": 7, "tasks": ["10.3", "11.2"] },
    { "id": 8, "tasks": ["11.3", "13.1"] },
    { "id": 9, "tasks": ["13.2", "13.3", "13.4", "13.5", "13.6", "13.7", "14.1", "14.2"] },
    { "id": 10, "tasks": ["14.3", "15.1", "15.2", "16.1"] },
    { "id": 11, "tasks": ["16.2", "16.3", "16.4", "17.1", "18.1", "18.2"] },
    { "id": 12, "tasks": ["19.1", "20.1", "20.2"] },
    { "id": 13, "tasks": ["21.1", "21.2", "21.3", "21.4"] }
  ]
}
```
