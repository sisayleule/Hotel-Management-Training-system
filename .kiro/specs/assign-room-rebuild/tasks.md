# Implementation Plan: Assign Room Rebuild Feature

## Overview

This plan implements the Assign Room Rebuild feature, enabling authorized hotel staff to search for reservations and assign available rooms through a modern grid interface with comprehensive filtering, validation, and confirmation capabilities. The implementation follows the IDS Classic theme design patterns and integrates with the existing Zustand store and RBAC system.

**Implementation Language**: JavaScript (React)

**Key Integration Points**:
- Zustand store (`useHotelStore`) for state management
- RBAC system for permission-based access control
- React Router for navigation and URL parameter handling
- IDS Classic theme for consistent styling

## Tasks

- [ ] 1. Set up component structure and imports
  - Create `src/pages/AssignRoom.jsx` file
  - Import required React hooks (useState, useEffect, useMemo)
  - Import Zustand store hook (useHotelStore)
  - Import navigation hooks (useNavigate, useSearchParams)
  - Import UI components (PageWrapper, ReservationStatusBadge, Modal, Badge)
  - Import custom hooks (useEnterAsTab)
  - Import icons from lucide-react (Home, Search, X, Check, AlertCircle, Filter, Grid, List)
  - Import toast from react-hot-toast
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement component state management
  - [ ] 2.1 Set up local state variables
    - Create `mode` state ("search" | "assigning") for UI control
    - Create `searchCriteria` state object with fields: reservation_no, guest_name, arrival, departure, status
    - Create `searchResults` state array for matching reservations
    - Create `selectedReservation` state for currently loaded reservation
    - Create `selectedRoomNo` state for room selected for assignment
    - Create `roomFilters` state object with fields: floor, type, status, availableOnly
    - Create `viewMode` state ("grid" | "floor") for room display mode
    - Create `showConfirmDialog` state boolean for modal visibility
    - Create `errors` state object for validation error messages
    - _Requirements: 2.1, 2.2, 6.1, 7.1_

  - [ ] 2.2 Connect to Zustand global store
    - Use useHotelStore to access reservations array
    - Use useHotelStore to access rooms array
    - Use useHotelStore to access assignRoomToReservation action
    - Use useHotelStore to access currentUser for role checking
    - _Requirements: 11.1, 11.6, 11.7_

- [ ] 3. Implement RBAC authorization checks
  - Import PERMISSIONS constant from rbac.js
  - Check if currentUser has RESERVATIONS_EDIT permission (component is already wrapped in RequirePermission in route)
  - _Requirements: 1.2, 1.3_

- [ ] 4. Implement multi-field search logic
  - [ ] 4.1 Create search handler function
    - Implement handleSearch function with AND logic for all filled fields
    - Filter reservations by reservation_no (case-insensitive partial match)
    - Filter by guest_name (case-insensitive partial match)
    - Filter by arrival date (exact match)
    - Filter by departure date (exact match)
    - Filter by status (exact match)
    - Update searchResults state with filtered results
    - Auto-load reservation if exactly one match found
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10_

- [ ] 5. Implement search form UI
  - [ ] 5.1 Create search mode layout
    - Render search form card with IDS Classic styling
    - Create responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
    - Add input fields for all search criteria (reservation_no, guest_name, arrival, departure, status)
    - Apply font-mono to reservation_no field
    - Add status dropdown with options: All, Confirmed, Checked In
    - Add Search and Clear buttons with IDS Classic theme colors
    - Set initial focus to reservation_no field
    - _Requirements: 2.1, 14.1, 15.2, 15.3, 15.4, 15.7_

  - [ ] 5.2 Implement keyboard navigation
    - Use useEnterAsTab hook for Enter key navigation
    - Configure Enter key to advance to next field
    - Configure Enter on last field to trigger search
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 5.3 Implement Clear button functionality
    - Reset all searchCriteria fields to empty strings
    - Clear searchResults array
    - Clear errors object
    - _Requirements: 6.10_

- [ ] 6. Implement search results display
  - Display "No reservations found" when searchResults is empty and criteria filled
  - Display instructional message when no criteria entered
  - Render results as clickable cards with hover effects
  - Display reservation_no, guest_name, status badge, room_type, arrival, departure, current assignment in each card
  - Use ReservationStatusBadge component for colored status display
  - Apply IDS Classic card styling (border-ids-border, shadow-3xs)
  - Format dates as DD-MMM-YYYY
  - Add click handler to load selected reservation
  - _Requirements: 2.9, 2.10_

- [ ] 7. Implement reservation loading and summary display
  - [ ] 7.1 Create loadReservation function
    - Find reservation by reservation_no
    - Display error toast if reservation not found
    - Set selectedReservation state
    - Switch mode to "assigning"
    - _Requirements: 2.10, 16.3_

  - [ ] 7.2 Create reservation summary UI layout
    - Render summary card with IDS Classic styling
    - Display reservation header (number, status badge)
    - Display guest & stay information (name, arrival, departure, nights, adults, children, room_type)
    - Display current assignment section (assigned room or "No Room Assigned")
    - Display special requests if present
    - Highlight assigned room with bg-amber-50 border-amber-200 when present
    - Apply read-only styling to all fields
    - Use font-mono for reservation number
    - _Requirements: 3.1-3.11_

  - [ ] 7.3 Add Change Assignment button
    - Display "Change Assignment" button when rooms_assigned array has values
    - Display "Assign Room" message when no room assigned
    - _Requirements: 8.1, 8.2_

- [ ] 8. Implement room filters UI
  - [ ] 8.1 Create room filter bar
    - Render filter controls in horizontal row
    - Add Floor dropdown (dynamically populate from unique floor values in rooms)
    - Add Room Type dropdown (All, DLX, EXEC, SUI, STD, etc.)
    - Add Room Status dropdown (All, Ready, Occupied, Dirty, OOS, Maintenance, Blocked)
    - Add "Available Only" checkbox toggle
    - Add "Clear Filters" button
    - Apply IDS Classic styling
    - _Requirements: 6.1-6.7, 6.10_

  - [ ] 8.2 Implement filter logic with useMemo
    - Create filteredRooms computed value using useMemo
    - Apply floor filter (if set)
    - Apply type filter (if set)
    - Apply status filter (if set)
    - Apply availableOnly filter (show only vacant_clean if enabled)
    - Use AND logic for cumulative filtering
    - _Requirements: 6.8, 6.9_

- [ ] 9. Implement view toggle
  - Create view mode toggle buttons (Grid View / Floor View)
  - Highlight active view with bg-ids-sidebar text-white
  - Set initial view to "grid"
  - _Requirements: 4.4, 4.5, 4.6_

- [ ] 10. Implement room grid display
  - [ ] 10.1 Create grid view rendering
    - Render filteredRooms in responsive grid (1/2/3/4 columns)
    - Highlight rooms matching reservation room_type with ring-2 ring-blue-500
    - Render each room as RoomCard component
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 4.8_

  - [ ] 10.2 Create floor view rendering
    - Group filteredRooms by floor number
    - Render floor headers with "Floor {number}" label
    - Render rooms under each floor in grid layout
    - _Requirements: 4.6, 4.7_

- [ ] 11. Implement room card component
  - [ ] 11.1 Create room card layout
    - Display room_no prominently with font-mono font-black
    - Display Room Status Badge (using existing Badge component or custom)
    - Display room type_code
    - Display floor number
    - Display guest_name if present
    - Display reservation_no if present
    - Display housekeeping status if available
    - Apply IDS Classic card styling
    - _Requirements: 4.2, 4.3, 4.10, 15.1-15.8_

  - [ ] 11.2 Implement room status color coding
    - Apply green badge for vacant_clean/ready (bg-green-100 text-green-800)
    - Apply blue badge for reservation/reserved (bg-blue-100 text-blue-800)
    - Apply orange badge for occupied (bg-orange-100 text-orange-800)
    - Apply yellow badge for dirty (bg-yellow-100 text-yellow-800)
    - Apply red badge for out_of_service (bg-red-100 text-red-800)
    - Apply purple badge for maintenance/under_maintenance (bg-purple-100 text-purple-800)
    - Apply gray badge for blocked (bg-gray-100 text-gray-800)
    - Use uppercase text for status labels
    - _Requirements: 5.1-5.8_

  - [ ] 11.3 Implement room availability logic
    - Disable rooms with status: occupied, out_of_service, blocked, maintenance, under_maintenance
    - Show "Assign Room" button only for available rooms
    - Add opacity-50 styling for unavailable rooms
    - Add hover effects for available rooms
    - _Requirements: 4.9, 7.1, 9.1-9.4_

  - [ ] 11.4 Add assign button click handler
    - Call handleAssignRoom(room.room_no) on button click
    - _Requirements: 7.1, 7.2_

- [ ] 12. Implement room assignment logic
  - [ ] 12.1 Create handleAssignRoom function
    - Find room by room_no
    - Validate room availability (check status and guest_name)
    - Block assignment if room is occupied/OOS/blocked/maintenance
    - Display error toast if room unavailable
    - Set selectedRoomNo state
    - Open confirmation dialog
    - _Requirements: 7.1, 7.2, 9.1-9.7_

  - [ ] 12.2 Implement room type compatibility validation
    - Compare reservation room_type with selected room type_code
    - Detect upgrades (assigning higher tier room to lower tier reservation)
    - Detect downgrades (assigning lower tier room to higher tier reservation)
    - Set validation flags for confirmation dialog
    - _Requirements: 10.1-10.6_

- [ ] 13. Implement confirmation dialog
  - [ ] 13.1 Create confirmation modal UI
    - Use Modal component with showConfirmDialog state
    - Display "Confirm Room Assignment" heading
    - Show guest_name, reservation_no, selected room_no, room type, stay dates
    - Show current room if changing assignment
    - Display upgrade/downgrade warning with checkbox if room type mismatch
    - Display dirty room warning if applicable
    - Add "Confirm Assignment" button (green)
    - Add "Cancel" button (gray)
    - Disable confirm button if room type mismatch and checkbox not checked
    - _Requirements: 7.2-7.4, 8.3, 9.6, 10.2-10.6_

  - [ ] 13.2 Create confirmAssignment function
    - Check if changing existing assignment or new assignment
    - If changing: get current room from rooms_assigned[0]
    - Call assignRoomToReservation(reservation_no, room_no) from store
    - Handle store update
    - Display success toast with appropriate message
    - Close confirmation dialog
    - Refresh selectedReservation with updated data from store
    - Update room grid display
    - _Requirements: 7.5-7.10, 8.4-8.7, 11.1-11.7_

- [ ] 14. Implement navigation controls
  - [ ] 14.1 Add Back to Search button
    - Display button in assigning mode
    - Clear selectedReservation on click
    - Switch mode back to "search"
    - Preserve search results
    - _Requirements: 1.7_

  - [ ] 14.2 Add back arrow navigation using PageWrapper
    - Use PageWrapper backPath prop with "/reservations"
    - Navigate to reservations list page on click

- [ ] 15. Implement URL parameter support
  - [ ] 15.1 Add URL parameter handling
    - Use useSearchParams hook to read "id" parameter
    - Create useEffect to handle auto-loading on mount
    - Call loadReservation with id if parameter present
    - Skip search mode if valid id provided
    - Display error and show search mode if invalid id
    - _Requirements: 13.1-13.4_

- [ ] 16. Implement error handling and feedback
  - Display toast errors for: reservation not found, room not found, assignment failed
  - Configure success toasts: green, checkmark icon, 3s auto-dismiss
  - Configure error toasts: red, warning icon, 4s auto-dismiss
  - _Requirements: 16.1-16.7_

- [ ] 17. Apply responsive design
  - Use grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for search form
  - Use grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 for room grid
  - Use flex-col md:flex-row for button groups
  - Use p-4 md:p-6 for card padding
  - Ensure minimum 44px touch targets on mobile
  - _Requirements: 15.7_

- [ ] 18. Apply IDS Classic theme styling
  - [ ] 18.1 Apply color scheme
    - Use bg-ids-background for page background
    - Use border-ids-border for all borders
    - Use text-ids-sidebar for primary text
    - Use text-gray-400 for labels
    - Use shadow-3xs for cards
    - _Requirements: 15.1, 15.3, 15.4, 15.5_

  - [ ] 18.2 Apply typography styles
    - Use font-black for headings
    - Use uppercase tracking-wider for labels
    - Use font-mono for reservation numbers, room numbers
    - Use text-xs (12px) as base font size
    - _Requirements: 15.2, 15.8_

- [ ] 19. Add store actions if not present
  - [ ] 19.1 Verify assignRoomToReservation exists in store (already exists - SKIP THIS)
  - [ ] 19.2 Add changeRoomAssignment action if needed
    - If not present, add to useHotelStore
    - Release old room (status=vacant_clean, clear guest_name and reservation_no)
    - Assign new room (status=reservation, set guest_name and reservation_no)
    - Update reservation rooms_assigned array
    - _Requirements: 8.4, 8.5, 8.6_

- [ ] 20. Add route definition in App.tsx
  - [ ] 20.1 Import AssignRoom component
    - Add import statement: `import AssignRoom from "./pages/AssignRoom.jsx"`
  
  - [ ] 20.2 Add route BEFORE dynamic :id route
    - Find the line with `<Route path="/reservations/:id" element={<DetailedReservation />} />`
    - Add BEFORE that line: 
      ```jsx
      <Route
        path="/reservations/assign"
        element={
          <RequirePermission permission={PERMISSIONS.RESERVATIONS_EDIT}>
            <AssignRoom />
          </RequirePermission>
        }
      />
      ```
    - _Requirements: 1.1, 1.4, 1.5_

- [ ] 21. Update existing entry points
  - [ ] 21.1 Update Reservations.jsx assign room action
    - Find the "Assign Room" action button/link in Reservations.jsx
    - Change navigation to: `/reservations/assign?id=${reservation.reservation_no}`
    - _Requirements: 12.1_

  - [ ] 21.2 Update DetailedReservation.jsx toolbar assign icon
    - Find the Home icon or assign room button in DetailedReservation.jsx toolbar
    - Change navigation to: `/reservations/assign?id=${reservation.reservation_no}`
    - _Requirements: 12.2_

- [ ] 22. Final checkpoint - Integration testing and verification
  - [ ] 22.1 Manual testing checklist
    - Test complete workflow: search → select → view rooms → filter → assign → confirm
    - Test with different user roles (hotel_manager, front_office)
    - Test URL parameter with valid and invalid reservation IDs
    - Test keyboard navigation in search form
    - Test responsive layout at mobile, tablet, desktop sizes
    - Test room filtering (floor, type, status, available only)
    - Test view toggle (grid / floor)
    - Test change assignment for reservation with existing room
    - Test room type compatibility warnings (upgrade/downgrade)
    - Test dirty room warning
    - Test blocked room validation
    - Verify toast notifications display and auto-dismiss correctly
    - Verify state updates propagate correctly after assignment
    - Verify room grid updates immediately after assignment
    - Verify navigation from Reservations.jsx assign action
    - Verify navigation from DetailedReservation.jsx toolbar icon

  - [ ] 22.2 Final verification
    - Ensure route order in App.tsx: /reservations/assign comes BEFORE /reservations/:id
    - Ensure all entry points navigate to /reservations/assign?id=
    - Ensure color-coded room badges match specification
    - Ensure IDS Classic theme applied consistently
    - Ensure no console errors during workflow

## Notes

- The existing store already has `assignRoomToReservation` action - no store modifications needed for basic assignment
- May need to add `changeRoomAssignment` action to store for changing existing assignments
- UI follows IDS Classic theme established in existing codebase
- Component integrates with existing infrastructure: PageWrapper, ReservationStatusBadge, Modal, useEnterAsTab
- RBAC configuration should already have RESERVATIONS_EDIT permission - only route definition needed
- Responsive design uses Tailwind breakpoints: md (768px), lg (1024px), xl (1280px)
- Base font size is text-xs (12px) matching other PMS pages
- **CRITICAL**: Route /reservations/assign must be placed BEFORE /reservations/:id in App.tsx to prevent routing collision

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3"] },
    { "id": 2, "tasks": ["4.1", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "6"] },
    { "id": 4, "tasks": ["7.1", "7.2", "8.1"] },
    { "id": 5, "tasks": ["7.3", "8.2", "9"] },
    { "id": 6, "tasks": ["10.1", "10.2", "11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 8, "tasks": ["12.1", "12.2"] },
    { "id": 9, "tasks": ["13.1", "13.2"] },
    { "id": 10, "tasks": ["14.1", "14.2", "15.1", "16"] },
    { "id": 11, "tasks": ["17", "18.1", "18.2"] },
    { "id": 12, "tasks": ["19.2", "20.1"] },
    { "id": 13, "tasks": ["20.2", "21.1", "21.2"] },
    { "id": 14, "tasks": ["22.1", "22.2"] }
  ]
}
```
