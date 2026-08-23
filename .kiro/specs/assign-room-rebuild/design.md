# Design Document: Assign Room Rebuild Feature

## 1. Overview

The Assign Room Rebuild feature enables authorized hotel staff to search for reservations and assign available rooms through a modern, intuitive grid interface with comprehensive filtering and validation capabilities. This feature integrates with the existing Zustand store-based state management system and follows the IDS Classic theme design patterns established in the Fortune Next v6.5 Hotel Management Training PMS.

### 1.1 Feature Scope

- **Primary Component**: `AssignRoom.jsx` - A full-page React component providing room assignment functionality
- **Integration Points**: Zustand store (`useHotelStore`), RBAC system, React Router navigation
- **User Roles**: Hotel Manager, Front Office Agent (users with `RESERVATIONS_EDIT` permission)
- **Core Workflows**: 
  1. Multi-criteria reservation search
  2. Reservation summary display with current assignment status
  3. Room availability grid with floor/grid view toggle
  4. Multi-dimensional room filtering (floor, type, status, availability)
  5. Assignment actions with confirmation dialogs
  6. Room type compatibility validation
  7. Change existing assignments

### 1.2 Design Principles

- **Authorization-First**: All functionality gated behind RBAC permission checks
- **Search-First Pattern**: Consistent UX with AmendBooking and CancelBooking modules
- **Visual Clarity**: Color-coded room status badges for instant recognition
- **Data Integrity**: Validation prevents invalid assignments
- **Immediate Feedback**: Real-time updates after assignment actions
- **Responsive Design**: Mobile-first UI following IDS Classic theme patterns

## 2. Architecture

### 2.1 Component Structure

```
AssignRoom (Main Component)
├── SearchMode
│   ├── SearchForm (multi-field search with keyboard navigation)
│   └── SearchResultsList (displays matching reservations)
├── AssignmentMode
│   ├── ReservationSummary (read-only reservation details)
│   ├── RoomFilters (floor, type, status, availability toggles)
│   ├── ViewToggle (grid view / floor view)
│   ├── RoomGrid (responsive grid of room cards)
│   │   └── RoomCard (individual room display with assign button)
│   └── ConfirmationDialog (modal confirming assignment action)
└── Navigation (Back to Search, Return to Reservations List)
```

### 2.2 State Management

The component uses React's `useState` for local UI state and integrates with Zustand global store for data operations.

#### Local State (React useState)
- `mode`: `"search" | "assigning"` - Controls UI view
- `searchCriteria`: Object containing search field values
- `searchResults`: Array of matching reservations
- `selectedReservation`: Currently loaded reservation object
- `selectedRoomNo`: Room selected for assignment
- `roomFilters`: Object with floor, type, status, availableOnly filters
- `viewMode`: `"grid" | "floor"` - Room display mode
- `showConfirmDialog`: Boolean controlling confirmation modal visibility
- `errors`: Validation error messages object

#### Global State (Zustand useHotelStore)
- `reservations`: Array of all reservation records
- `rooms`: Array of all room records
- `assignRoomToReservation(reservationNo, roomNo)`: Action to assign room
- `changeRoomAssignment(reservationNo, oldRoomNo, newRoomNo)`: Action to change assignment

### 2.3 Data Flow

```
User Input (Search) 
  → Multi-field AND search logic 
    → Filter reservations array 
      → Display results / Load single match

User Selection (Reservation) 
  → Load reservation details 
    → Display current assignment status
      → Show room availability grid

User Input (Room Filters)
  → Apply cumulative AND logic
    → Update displayed room list

User Selection (Room)
  → Validate room availability
    → Validate room type compatibility
      → Show confirmation dialog

User Action (Confirm Assignment) 
  → Call assignRoomToReservation(reservationNo, roomNo) 
    → Update reservation.rooms_assigned array
    → Update room.status = "reservation"
    → Update room.guest_name and room.reservation_no
  → Display success toast 
    → Refresh room grid
```

## 3. Component Design

### 3.1 AssignRoom Component

**File**: `src/pages/AssignRoom.jsx`

**Purpose**: Main component orchestrating the entire room assignment workflow

**Props**: None (full-page component accessed via React Router)

**Hooks Used**:
- `useHotelStore()` - Access global state and actions
- `useState()` - Local UI state management
- `useNavigate()` - Navigation control
- `useSearchParams()` - Read URL parameters (for direct reservation loading)
- `useEffect()` - Handle URL parameter auto-loading
- `useEnterAsTab()` - Keyboard navigation in search form
- `useMemo()` - Optimize room filtering and search operations

**Key Functions**:

```javascript
// Search Logic
const handleSearch = () => {
  const results = reservations.filter(res => {
    const checks = [];
    
    if (searchCriteria.reservation_no) {
      checks.push(res.reservation_no.toLowerCase().includes(searchCriteria.reservation_no.toLowerCase()));
    }
    
    if (searchCriteria.guest_name) {
      checks.push(res.guest_name.toLowerCase().includes(searchCriteria.guest_name.toLowerCase()));
    }
    
    if (searchCriteria.arrival) {
      checks.push(res.arrival === searchCriteria.arrival);
    }
    
    if (searchCriteria.departure) {
      checks.push(res.departure === searchCriteria.departure);
    }
    
    if (searchCriteria.status) {
      checks.push(res.status === searchCriteria.status);
    }
    
    return checks.every(check => check === true);
  });
  
  setSearchResults(results);
  
  if (results.length === 1) {
    loadReservation(results[0].reservation_no);
  }
};

// Reservation Loading
const loadReservation = (reservationNo) => {
  const reservation = reservations.find(r => r.reservation_no === reservationNo);
  if (!reservation) {
    toast.error("Reservation not found");
    return;
  }
  
  setSelectedReservation(reservation);
  setMode("assigning");
};

// Room Filtering
const filteredRooms = useMemo(() => {
  return rooms.filter(room => {
    if (roomFilters.floor && room.floor !== parseInt(roomFilters.floor)) return false;
    if (roomFilters.type && room.type_code !== roomFilters.type) return false;
    if (roomFilters.status && room.status !== roomFilters.status) return false;
    if (roomFilters.availableOnly && room.status !== "vacant_clean") return false;
    return true;
  });
}, [rooms, roomFilters]);

// Room Assignment
const handleAssignRoom = (roomNo) => {
  const room = rooms.find(r => r.room_no === roomNo);
  
  // Validation
  if (room.status === "occupied" || room.status === "out_of_service" || 
      room.status === "blocked" || room.status === "maintenance") {
    toast.error("This room is not available for assignment");
    return;
  }
  
  setSelectedRoomNo(roomNo);
  setShowConfirmDialog(true);
};

const confirmAssignment = () => {
  try {
    if (selectedReservation.rooms_assigned && selectedReservation.rooms_assigned.length > 0) {
      // Change existing assignment
      changeRoomAssignment(
        selectedReservation.reservation_no,
        selectedReservation.rooms_assigned[0],
        selectedRoomNo
      );
      toast.success(`Room changed from ${selectedReservation.rooms_assigned[0]} to ${selectedRoomNo}`);
    } else {
      // New assignment
      assignRoomToReservation(selectedReservation.reservation_no, selectedRoomNo);
      toast.success(`Room ${selectedRoomNo} assigned successfully`);
    }
    
    setShowConfirmDialog(false);
    setSelectedRoomNo(null);
    
    // Refresh reservation data
    const updatedReservation = reservations.find(r => r.reservation_no === selectedReservation.reservation_no);
    setSelectedReservation(updatedReservation);
  } catch (error) {
    toast.error("Assignment failed - please try again");
  }
};
```

### 3.2 Search Form Component

**Rendering Pattern**: Responsive grid layout with conditional columns

**Fields**:
1. **Reservation Number** (text input, font-mono)
2. **Guest Name** (text input)
3. **Arrival Date** (date input)
4. **Departure Date** (date input)
5. **Booking Status** (select dropdown: Confirmed, Checked In)

**Keyboard Navigation**:
- Enter key advances to next field
- Enter on last field triggers search
- useEnterAsTab hook manages focus flow

**Actions**:
- **Search Button**: Executes search with current criteria
- **Clear Button**: Resets all fields and clears results

### 3.3 Reservation Summary Display

**Layout**: Single card with read-only fields

**Section 1: Reservation Header**
- Reservation Number (font-mono, font-black)
- Status Badge (ReservationStatusBadge component)

**Section 2: Guest & Stay Information**
```javascript
{
  "Guest Name": selectedReservation.guest_name,
  "Arrival": formatDate(selectedReservation.arrival),
  "Departure": formatDate(selectedReservation.departure),
  "Nights": selectedReservation.nights,
  "Adults": selectedReservation.adults,
  "Children": selectedReservation.children,
  "Room Type": selectedReservation.room_type
}
```

**Section 3: Current Assignment**
```javascript
{
  "Assigned Room": selectedReservation.rooms_assigned?.[0] || "No Room Assigned",
  "Special Requests": selectedReservation.special_requests || "None"
}
```

**Conditional Display**:
- If room assigned: Show "Change Assignment" button
- If no room assigned: Show "No Room Assigned" message

### 3.4 Room Filters Component

**Filter Bar Layout**: Horizontal row of filter controls

**Filter Controls**:
1. **Floor Dropdown**: Options dynamically generated from unique floor values in rooms array
2. **Room Type Dropdown**: Options: All, DLX, EXEC, SUI, STD, etc.
3. **Room Status Dropdown**: Options: All, Ready, Occupied, Dirty, OOS, Maintenance, Blocked
4. **Available Only Toggle**: Checkbox to show only vacant_clean rooms
5. **Clear Filters Button**: Reset all filters to default

**Filter Logic**:
```javascript
const applyFilters = (rooms, filters) => {
  return rooms.filter(room => {
    if (filters.floor && room.floor !== parseInt(filters.floor)) return false;
    if (filters.type && room.type_code !== filters.type) return false;
    if (filters.status && room.status !== filters.status) return false;
    if (filters.availableOnly && room.status !== "vacant_clean") return false;
    return true;
  });
};
```

### 3.5 View Toggle Component

**Toggle Options**:
- **Grid View**: Responsive grid layout (3-4 cols desktop, 2 cols tablet, 1 col mobile)
- **Floor View**: Rooms grouped by floor with floor headers

**Implementation**:
```javascript
<div className="flex gap-2 border border-ids-border rounded p-1">
  <button 
    onClick={() => setViewMode("grid")}
    className={viewMode === "grid" ? "bg-ids-sidebar text-white" : "bg-white"}
  >
    Grid View
  </button>
  <button 
    onClick={() => setViewMode("floor")}
    className={viewMode === "floor" ? "bg-ids-sidebar text-white" : "bg-white"}
  >
    Floor View
  </button>
</div>
```

### 3.6 Room Grid Component

**Grid View Rendering**:
```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
  {filteredRooms.map(room => (
    <RoomCard 
      key={room.room_no}
      room={room}
      isHighlighted={room.type_code === selectedReservation?.room_type}
      onAssign={() => handleAssignRoom(room.room_no)}
    />
  ))}
</div>
```

**Floor View Rendering**:
```javascript
{groupedByFloor.map(([floor, roomsOnFloor]) => (
  <div key={floor} className="mb-6">
    <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-ids-sidebar">
      Floor {floor}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {roomsOnFloor.map(room => (
        <RoomCard key={room.room_no} room={room} onAssign={handleAssignRoom} />
      ))}
    </div>
  </div>
))}
```

### 3.7 Room Card Component

**Card Layout**:
```javascript
<div className={`
  border border-ids-border rounded p-3 shadow-3xs
  ${isAvailable ? 'hover:shadow-sm cursor-pointer' : 'opacity-50'}
  ${isHighlighted ? 'ring-2 ring-blue-500' : ''}
`}>
  <div className="flex justify-between items-start mb-2">
    <span className="font-mono font-black text-lg">{room.room_no}</span>
    <RoomStatusBadge status={room.status} />
  </div>
  
  <div className="text-xs space-y-1 text-gray-600">
    <p>Type: {room.type_code}</p>
    <p>Floor: {room.floor}</p>
    {room.guest_name && <p>Guest: {room.guest_name}</p>}
    {room.reservation_no && <p>Res: {room.reservation_no}</p>}
  </div>
  
  {isAvailable && (
    <button 
      onClick={() => onAssign(room.room_no)}
      className="w-full mt-3 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
    >
      Assign Room
    </button>
  )}
</div>
```

**Availability Logic**:
```javascript
const isAvailable = room.status === "vacant_clean" || 
                    (room.status === "dirty" && allowDirty);

const isBlocked = room.status === "occupied" || 
                  room.status === "out_of_service" || 
                  room.status === "blocked" || 
                  room.status === "maintenance";
```

**Color Coding** (via RoomStatusBadge):
- Green: vacant_clean, ready
- Blue: reservation, reserved
- Orange: occupied
- Yellow: dirty
- Red: out_of_service
- Purple: maintenance, under_maintenance
- Gray: blocked

### 3.8 Confirmation Dialog

**Purpose**: Final confirmation before assignment with full context display

**Dialog Content**:
```javascript
<Modal isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
  <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6">
    <h2 className="text-lg font-black text-ids-sidebar uppercase tracking-wider mb-4">
      Confirm Room Assignment
    </h2>
    
    <div className="space-y-2 mb-6 text-sm">
      <p><span className="text-gray-400">Guest:</span> {selectedReservation.guest_name}</p>
      <p><span className="text-gray-400">Reservation:</span> <span className="font-mono">{selectedReservation.reservation_no}</span></p>
      
      {isChangingAssignment && (
        <p><span className="text-gray-400">Current Room:</span> <span className="font-mono">{currentRoom}</span></p>
      )}
      
      <p><span className="text-gray-400">New Room:</span> <span className="font-mono font-bold text-green-600">{selectedRoomNo}</span></p>
      <p><span className="text-gray-400">Room Type:</span> {selectedRoom.type_code}</p>
      <p><span className="text-gray-400">Stay:</span> {formatDate(selectedReservation.arrival)} - {formatDate(selectedReservation.departure)}</p>
      
      {roomTypeMismatch && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
          <p className="text-yellow-800 text-xs">
            {isUpgrade ? "⬆️ Upgrade" : "⬇️ Downgrade"}: 
            Assigning {selectedRoom.type_code} to {selectedReservation.room_type} reservation
          </p>
          <label className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              checked={confirmMismatch}
              onChange={(e) => setConfirmMismatch(e.target.checked)}
            />
            <span className="text-xs">I confirm this room type change is authorized</span>
          </label>
        </div>
      )}
      
      {isDirtyRoom && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
          <p className="text-yellow-800 text-xs">
            ⚠️ Room needs cleaning - proceed anyway?
          </p>
        </div>
      )}
    </div>
    
    <div className="flex gap-3">
      <button 
        onClick={confirmAssignment}
        disabled={roomTypeMismatch && !confirmMismatch}
        className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Assignment
      </button>
      <button 
        onClick={() => setShowConfirmDialog(false)}
        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
</Modal>
```

## 4. Data Models

### 4.1 Reservation Entity

```javascript
{
  reservation_no: string,
  guest_name: string,
  room_type: string,
  arrival: string,
  departure: string,
  nights: number,
  adults: number,
  children: number,
  status: string,
  rooms_assigned: string[],
  special_requests?: string
}
```

### 4.2 Room Entity

```javascript
{
  room_no: string,
  type_code: string,
  floor: number,
  status: string,
  guest_name: string,
  reservation_no: string,
  housekeeper_id?: string,
  note?: string
}
```

## 5. Business Logic

### 5.1 Room Type Compatibility Validation

```javascript
function validateRoomTypeCompatibility(reservationRoomType, assignedRoomType) {
  if (reservationRoomType === assignedRoomType) {
    return { compatible: true };
  }
  
  const roomTypeHierarchy = {
    "STD": 1,
    "DLX": 2,
    "EXEC": 3,
    "SUI": 4
  };
  
  const reservationLevel = roomTypeHierarchy[reservationRoomType] || 0;
  const assignedLevel = roomTypeHierarchy[assignedRoomType] || 0;
  
  if (assignedLevel > reservationLevel) {
    return {
      compatible: true,
      mismatch: true,
      isUpgrade: true,
      message: `⬆️ Upgrade: Assigning ${assignedRoomType} to ${reservationRoomType} reservation`
    };
  } else if (assignedLevel < reservationLevel) {
    return {
      compatible: true,
      mismatch: true,
      isUpgrade: false,
      message: `⬇️ Downgrade: Assigning ${assignedRoomType} to ${reservationRoomType} reservation`
    };
  }
  
  return { compatible: true };
}
```

### 5.2 Room Availability Validation

```javascript
function validateRoomAvailability(room) {
  const blockedStatuses = ["occupied", "out_of_service", "blocked", "maintenance", "under_maintenance"];
  
  if (blockedStatuses.includes(room.status)) {
    return {
      available: false,
      reason: `Room is ${room.status}`
    };
  }
  
  if (room.guest_name && room.guest_name.trim() !== "") {
    return {
      available: false,
      reason: "Room is currently occupied"
    };
  }
  
  if (room.status === "dirty") {
    return {
      available: true,
      warning: "⚠️ Room needs cleaning - proceed anyway?"
    };
  }
  
  return { available: true };
}
```

## 6. Store Actions

### 6.1 Assign Room Action

```javascript
assignRoomToReservation: (reservationNo, roomNo) => set((state) => {
  const room = state.rooms.find(r => r.room_no === roomNo);
  const reservation = state.reservations.find(r => r.reservation_no === reservationNo);
  
  if (!room || !reservation) return state;
  
  return {
    reservations: state.reservations.map(res =>
      res.reservation_no === reservationNo
        ? { ...res, rooms_assigned: [roomNo] }
        : res
    ),
    rooms: state.rooms.map(r =>
      r.room_no === roomNo
        ? { 
            ...r, 
            status: "reservation",
            guest_name: reservation.guest_name,
            reservation_no: reservationNo
          }
        : r
    )
  };
}),
```

### 6.2 Change Room Assignment Action

```javascript
changeRoomAssignment: (reservationNo, oldRoomNo, newRoomNo) => set((state) => {
  const reservation = state.reservations.find(r => r.reservation_no === reservationNo);
  if (!reservation) return state;
  
  return {
    reservations: state.reservations.map(res =>
      res.reservation_no === reservationNo
        ? { ...res, rooms_assigned: [newRoomNo] }
        : res
    ),
    rooms: state.rooms.map(r => {
      if (r.room_no === oldRoomNo) {
        return { ...r, status: "vacant_clean", guest_name: "", reservation_no: "" };
      }
      if (r.room_no === newRoomNo) {
        return { 
          ...r, 
          status: "reservation",
          guest_name: reservation.guest_name,
          reservation_no: reservationNo
        };
      }
      return r;
    })
  };
}),
```

## 7. Integration Points

### 7.1 RBAC Integration

```javascript
import { PERMISSIONS } from "../../config/rbac.js";

// Route protection in App.tsx
<Route
  path="/reservations/assign"
  element={
    <RequirePermission permission={PERMISSIONS.RESERVATIONS_EDIT}>
      <AssignRoom />
    </RequirePermission>
  }
/>
```

### 7.2 Entry Point Updates

**Reservations.jsx**:
```javascript
// Update assign room action link
<button onClick={() => navigate(`/reservations/assign?id=${reservation.reservation_no}`)}>
  Assign Room
</button>
```

**DetailedReservation.jsx**:
```javascript
// Update toolbar assign icon
<button onClick={() => navigate(`/reservations/assign?id=${reservation.reservation_no}`)}>
  <Home className="w-4 h-4" />
</button>
```

## 8. Styling Specifications

### 8.1 IDS Classic Theme

**Colors**:
- Background: `bg-ids-background` (#f5f1e8)
- Sidebar: `bg-ids-sidebar` (#2c2416)
- Border: `border-ids-border` (#d4c5a9)
- Text: `text-ids-sidebar` (#2c2416)

**Typography**:
- Headings: `font-black uppercase tracking-wider`
- Labels: `text-xs uppercase tracking-wider text-gray-400`
- Values: `font-mono`
- Body: `text-xs` (12px base)

**Components**:
- Cards: `border border-ids-border rounded shadow-3xs p-3`
- Buttons: Primary=green-600, Secondary=gray-200

### 8.2 Responsive Breakpoints

```javascript
// Mobile: < 768px (1 column)
// Tablet: 768-1023px (2 columns)
// Desktop: ≥ 1024px (3-4 columns)

grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

## 9. Error Handling

**Error Types**:
- Reservation not found → Toast error
- Room not found → Toast error
- Assignment failed → Toast error with retry suggestion
- Validation failed → Field-specific error messages

**Toast Configuration**:
- Success: Green, 3s auto-dismiss
- Error: Red, 4s auto-dismiss

## 10. Testing Strategy

Property-based tests will validate:
- Search AND logic
- Room filtering logic
- Availability validation
- Room type compatibility
- Assignment state updates
- URL parameter handling

## Document Version

**Version**: 1.0  
**Date**: 2026-08-10  
**Status**: Design Complete  
**Next Phase**: Task Breakdown
