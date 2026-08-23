# Design Document: Cancel Booking Feature

## 1. Overview

The Cancel Booking feature enables authorized hotel staff to cancel existing reservations through a comprehensive search, validation, and cancellation workflow. This feature integrates with the existing Zustand store-based state management system and follows the IDS Classic theme design patterns established in the Fortune Next v6.5 Hotel Management Training PMS.

### 1.1 Feature Scope

- **Primary Component**: `CancelBooking.jsx` - A full-page React component providing cancellation functionality
- **Integration Points**: Zustand store (`useHotelStore`), RBAC system, React Router navigation
- **User Roles**: Hotel Manager, Front Office Agent (users with `RESERVATIONS_CANCEL` permission)
- **Core Workflows**: 
  1. Multi-criteria reservation search
  2. Reservation status validation
  3. Cancellation reason capture with validation
  4. Atomic cancellation processing (reservation + room status updates)
  5. Confirmation dialog with full reservation details

### 1.2 Design Principles

- **Authorization-First**: All functionality gated behind RBAC permission checks
- **Data Integrity**: Atomic updates to both reservation and room entities
- **User Safety**: Confirmation dialogs and validation prevent accidental cancellations
- **Audit Trail**: Mandatory cancellation reasons stored with each cancellation
- **Responsive Design**: Mobile-first UI following IDS Classic theme patterns


## 2. Architecture

### 2.1 Component Structure

```
CancelBooking (Main Component)
├── SearchMode
│   ├── SearchForm (multi-field search with keyboard navigation)
│   └── SearchResultsList (displays matching reservations)
├── CancellationMode
│   ├── ReservationDetailDisplay (read-only view of reservation)
│   ├── CancellationReasonInput (validated text area with suggestions)
│   └── ConfirmationDialog (modal confirming cancellation action)
└── Navigation (Back to Search, Return to Reservations List)
```

### 2.2 State Management

The component uses React's `useState` for local UI state and integrates with Zustand global store for data operations.

#### Local State (React useState)
- `mode`: `"search" | "cancelling"` - Controls UI view
- `searchCriteria`: Object containing search field values
- `searchResults`: Array of matching reservations
- `selectedReservation`: Currently loaded reservation object
- `cancellationReason`: User-entered cancellation reason text
- `showConfirmDialog`: Boolean controlling confirmation modal visibility
- `errors`: Validation error messages object

#### Global State (Zustand useHotelStore)
- `reservations`: Array of all reservation records
- `rooms`: Array of all room records
- `guests`: Array of all guest records
- `cancelReservation(reservationNo, reason)`: Action to cancel a reservation


### 2.3 Data Flow

```
User Input (Search) 
  → Multi-field AND search logic 
    → Filter reservations array 
      → Display results / Load single match

User Selection (Reservation) 
  → Load reservation details 
    → Query guest database for contact info 
      → Validate cancellable status 
        → Enable/disable cancel button

User Input (Cancellation Reason) 
  → Validate length ≥ 10 chars 
    → Enable cancel button

User Action (Confirm Cancel) 
  → Display confirmation dialog 
    → User confirms 
      → Call cancelReservation(reservationNo, reason) 
        → Update reservation.status = "cancelled" 
        → Store cancellation_reason 
        → Update all assigned rooms:
          - status = "vacant_clean"
          - guest_name = ""
          - reservation_no = ""
      → Display success toast 
        → Return to search mode
```


## 3. Component Design

### 3.1 CancelBooking Component

**File**: `src/components/housekeeping/CancelBooking.jsx`

**Purpose**: Main component orchestrating the entire cancellation workflow

**Props**: None (full-page component accessed via React Router)

**Hooks Used**:
- `useHotelStore()` - Access global state and actions
- `useState()` - Local UI state management
- `useNavigate()` - Navigation control
- `useSearchParams()` - Read URL parameters (for direct reservation loading)
- `useEffect()` - Handle URL parameter auto-loading
- `useEnterAsTab()` - Keyboard navigation in search form

**Key Functions**:

```javascript
// Search Logic
const handleSearch = () => {
  const results = reservations.filter(res => {
    // Apply AND logic to all filled search fields
    if (searchCriteria.reservation_no && !res.reservation_no.includes(searchCriteria.reservation_no)) return false;
    if (searchCriteria.guest_name && !res.guest_name.toLowerCase().includes(searchCriteria.guest_name.toLowerCase())) return false;
    if (searchCriteria.phone && !getGuestPhone(res.guest_name).includes(searchCriteria.phone)) return false;
    if (searchCriteria.email && !getGuestEmail(res.guest_name).toLowerCase().includes(searchCriteria.email.toLowerCase())) return false;
    if (searchCriteria.arrival && res.arrival !== searchCriteria.arrival) return false;
    if (searchCriteria.departure && res.departure !== searchCriteria.departure) return false;
    if (searchCriteria.room_no && !res.rooms_assigned.includes(searchCriteria.room_no)) return false;
    return true;
  });
  
  setSearchResults(results);
  
  // Auto-load if exactly one match
  if (results.length === 1) {
    loadReservation(results[0].reservation_no);
  }
};

// Reservation Loading
const loadReservation = (reservationNo) => {
  const reservation = reservations.find(r => r.reservation_no === reservationNo);
  if (!reservation) {
    toast.error("Reservation not found - it may have been deleted");
    return;
  }
  
  setSelectedReservation(reservation);
  setMode("cancelling");
  
  // Validate if cancellable
  if (reservation.status === "checked_out" || reservation.status === "cancelled") {
    setErrors(prev => ({ ...prev, status: `Cannot cancel ${reservation.status} reservations` }));
  }
};

// Cancellation Processing
const handleCancelReservation = () => {
  // Validation
  if (cancellationReason.trim().length < 10) {
    setErrors(prev => ({ ...prev, reason: "Please provide a detailed reason (minimum 10 characters)" }));
    return;
  }
  
  // Show confirmation dialog
  setShowConfirmDialog(true);
};

const confirmCancellation = () => {
  try {
    cancelReservation(selectedReservation.reservation_no, cancellationReason);
    toast.success(`Reservation ${selectedReservation.reservation_no} cancelled successfully ✓`);
    
    // Reset to search mode
    setMode("search");
    setSelectedReservation(null);
    setCancellationReason("");
    setSearchCriteria({});
    setSearchResults([]);
    setShowConfirmDialog(false);
  } catch (error) {
    toast.error("Cancellation failed - please try again");
  }
};
```


### 3.2 Search Form Component

**Rendering Pattern**: Responsive grid layout with conditional columns

**Fields**:
1. **Reservation Number** (text input, font-mono)
2. **Guest Name** (text input)
3. **Phone Number** (text input)
4. **Email Address** (email input)
5. **Arrival Date** (date input)
6. **Departure Date** (date input)
7. **Room Number** (text input, font-mono)

**Keyboard Navigation**:
- Enter key advances to next field
- Enter on last field triggers search
- useEnterAsTab hook manages focus flow

**Actions**:
- **Search Button**: Executes search with current criteria (styled in IDS Classic primary theme)
- **Clear Button**: Resets all fields and clears results (styled in IDS Classic secondary theme)

**Responsive Behavior**:
```javascript
// Mobile (< 768px): Single column
// Tablet (768px - 1023px): Two columns
// Desktop (≥ 1024px): Three columns
const gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3";
```


### 3.3 Search Results Display

**Empty State**: 
- No criteria entered: Display instructional message "Enter search criteria to find reservations"
- No matches found: Display "No reservations found" with suggestion to adjust criteria

**Results List**: 
- Each result rendered as a clickable card with hover effect
- **Card Contents**:
  - Reservation number (font-mono, prominent)
  - Guest name
  - Status badge (colored by status: confirmed=blue, checked_in=green, cancelled=red, checked_out=gray)
  - Arrival date (formatted as DD-MMM-YYYY)
  - Assigned rooms (comma-separated, font-mono)

**Card Styling** (IDS Classic Theme):
```javascript
className="border border-ids-border bg-white p-3 rounded shadow-3xs hover:shadow-sm transition-shadow cursor-pointer"
```

**Click Handler**: Loads selected reservation into cancellation mode


### 3.4 Reservation Detail Display

**Layout**: Two-column grid on desktop, single column on mobile

**Section 1: Reservation Header**
- Reservation Number (font-mono, font-black)
- Status Badge (ReservationStatusBadge component)
- Manager indicator (if user role is hotel_manager)

**Section 2: Guest Information**
```javascript
{
  "Guest Name": selectedReservation.guest_name,
  "Phone": guestPhone || "—",
  "Email": guestEmail || "—"
}
```

**Section 3: Stay Details**
```javascript
{
  "Arrival": formatDate(selectedReservation.arrival),
  "Departure": formatDate(selectedReservation.departure),
  "Nights": selectedReservation.nights,
  "Adults": selectedReservation.adults,
  "Children": selectedReservation.children
}
```

**Section 4: Room & Billing**
```javascript
{
  "Room Type": selectedReservation.room_type,
  "Assigned Rooms": selectedReservation.rooms_assigned.join(", ") || "Not assigned",
  "Payment Mode": selectedReservation.pay_mode,
  "Rate/Night": `₹ ${selectedReservation.rate}`,
  "Total Amount": `₹ ${selectedReservation.total_amount}`
}
```

**Styling Notes**:
- All fields read-only (no input elements)
- Label text: `text-gray-400 text-xs uppercase tracking-wider`
- Value text: `text-ids-sidebar font-mono`
- Assigned rooms highlighted with `bg-amber-50 border-amber-200` when present


### 3.5 Cancellation Reason Input

**Component**: Textarea with suggestion chips

**Validation Rules**:
- Required field
- Minimum 10 characters
- Real-time validation on change

**Suggested Reasons** (rendered as clickable chips):
```javascript
const suggestedReasons = [
  "Guest request",
  "Emergency",
  "Duplicate booking",
  "Payment failure",
  "Change of plans",
  "No-show"
];
```

**Chip Styling** (IDS Classic):
```javascript
className="px-3 py-1 bg-ids-background border border-ids-border rounded text-xs hover:bg-ids-sidebar hover:text-white transition-colors cursor-pointer"
```

**Textarea Styling**:
```javascript
// Emphasis styling for critical input
className="w-full p-3 border-2 border-red-200 bg-red-50 rounded focus:border-red-400 focus:outline-none font-mono text-sm"
```

**Error Display**:
```javascript
{errors.reason && (
  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
    <Ban className="w-3 h-3" />
    {errors.reason}
  </p>
)}
```


### 3.6 Confirmation Dialog

**Purpose**: Final safeguard before processing irreversible cancellation

**Trigger**: User clicks "Cancel Reservation" button with valid reason

**Dialog Implementation**: React modal overlay with backdrop

**Dialog Content**:

```javascript
<Modal isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
  <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6">
    <h2 className="text-lg font-black text-ids-sidebar uppercase tracking-wider mb-4">
      Confirm Cancellation
    </h2>
    
    <div className="space-y-2 mb-6 text-sm">
      <p><span className="text-gray-400">Reservation:</span> <span className="font-mono font-bold">{selectedReservation.reservation_no}</span></p>
      <p><span className="text-gray-400">Guest:</span> {selectedReservation.guest_name}</p>
      <p><span className="text-gray-400">Rooms:</span> <span className="font-mono">{selectedReservation.rooms_assigned.join(", ") || "Not assigned"}</span></p>
      <p><span className="text-gray-400">Reason:</span> {cancellationReason}</p>
    </div>
    
    <div className="flex gap-3">
      <button 
        onClick={confirmCancellation}
        className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Confirm Cancel
      </button>
      <button 
        onClick={() => setShowConfirmDialog(false)}
        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
</Modal>
```

**UX Notes**:
- Dialog requires explicit "Confirm Cancel" click - no accidental confirmations
- Backdrop click and ESC key close dialog without action
- "Go Back" button allows user to revise cancellation reason


## 4. Data Models

### 4.1 Reservation Entity

```javascript
{
  reservation_no: string,        // e.g., "RES001" (primary key)
  guest_name: string,            // Guest full name
  company_code: string,          // Optional company booking code
  room_type: string,             // e.g., "DLX", "EXEC"
  arrival: string,               // ISO date "YYYY-MM-DD"
  departure: string,             // ISO date "YYYY-MM-DD"
  nights: number,                // Calculated stay duration
  adults: number,                // Number of adult guests
  children: number,              // Number of child guests
  pay_mode: string,              // e.g., "Cash", "Credit Card", "Company"
  status: string,                // "confirmed" | "checked_in" | "checked_out" | "cancelled"
  rooms_assigned: string[],      // Array of room numbers
  rate: number,                  // Per night rate
  total_amount: number,          // Total billing amount
  payments: object[],            // Payment transaction records
  cancellation_reason?: string   // Populated when status = "cancelled"
}
```

### 4.2 Room Entity

```javascript
{
  room_no: string,               // e.g., "201" (primary key)
  type_code: string,             // Room type code
  floor: number,                 // Floor number
  status: string,                // "vacant_clean" | "occupied" | "dirty" | "reservation" | "out_of_order" | "out_of_service"
  guest_name: string,            // Current guest (empty for vacant)
  reservation_no: string,        // Linked reservation (empty for vacant)
  housekeeper_id?: string,       // Assigned housekeeper
  note?: string,                 // Housekeeping notes
  condition?: string             // Room condition status
}
```

### 4.3 Guest Entity

```javascript
{
  guest_id: string,              // e.g., "G001" (primary key)
  guest_name: string,            // Full name (matches reservation.guest_name)
  email: string,                 // Contact email
  phone: string,                 // Contact phone
  city: string,                  // City
  state: string,                 // State/Province
  country: string,               // Country
  identity_type: string,         // ID document type
  identity_no: string,           // ID document number
  rating: string                 // Guest rating/category
}
```


## 5. Business Logic

### 5.1 Search Algorithm

**Multi-Field AND Logic**:

```javascript
function searchReservations(criteria, reservations) {
  return reservations.filter(reservation => {
    // Only check fields that have values
    const checks = [];
    
    if (criteria.reservation_no) {
      checks.push(reservation.reservation_no.toLowerCase().includes(criteria.reservation_no.toLowerCase()));
    }
    
    if (criteria.guest_name) {
      checks.push(reservation.guest_name.toLowerCase().includes(criteria.guest_name.toLowerCase()));
    }
    
    if (criteria.phone) {
      const guestPhone = getGuestPhoneByName(reservation.guest_name);
      checks.push(guestPhone.includes(criteria.phone));
    }
    
    if (criteria.email) {
      const guestEmail = getGuestEmailByName(reservation.guest_name);
      checks.push(guestEmail.toLowerCase().includes(criteria.email.toLowerCase()));
    }
    
    if (criteria.arrival) {
      checks.push(reservation.arrival === criteria.arrival);
    }
    
    if (criteria.departure) {
      checks.push(reservation.departure === criteria.departure);
    }
    
    if (criteria.room_no) {
      checks.push(reservation.rooms_assigned.includes(criteria.room_no));
    }
    
    // All checks must pass (AND logic)
    return checks.every(check => check === true);
  });
}
```

**Guest Contact Lookup**:

```javascript
function getGuestPhoneByName(guestName, guests) {
  const guest = guests.find(g => g.guest_name.toLowerCase() === guestName.toLowerCase());
  return guest ? guest.phone : "";
}

function getGuestEmailByName(guestName, guests) {
  const guest = guests.find(g => g.guest_name.toLowerCase() === guestName.toLowerCase());
  return guest ? guest.email : "";
}
```


### 5.2 Status Validation Logic

**Cancellable Statuses**: 
- `"confirmed"` - Reservation made but guest not checked in
- `"checked_in"` - Guest currently staying (allows early checkout cancellation)

**Non-Cancellable Statuses**:
- `"checked_out"` - Guest has completed stay (historical record)
- `"cancelled"` - Already cancelled (prevents duplicate cancellation)

**Validation Function**:

```javascript
function validateCancellableStatus(reservation) {
  const cancellableStatuses = ["confirmed", "checked_in"];
  const nonCancellableStatuses = ["checked_out", "cancelled"];
  
  if (nonCancellableStatuses.includes(reservation.status)) {
    return {
      cancellable: false,
      reason: reservation.status === "checked_out" 
        ? "Cannot cancel checked-out reservations"
        : "Reservation is already cancelled"
    };
  }
  
  if (cancellableStatuses.includes(reservation.status)) {
    return { cancellable: true };
  }
  
  // Unknown status - default to non-cancellable
  return { cancellable: false, reason: "Invalid reservation status" };
}
```


### 5.3 Cancellation Reason Validation

**Validation Rules**:

```javascript
function validateCancellationReason(reason) {
  const trimmed = reason.trim();
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: "Cancellation reason is required"
    };
  }
  
  if (trimmed.length < 10) {
    return {
      valid: false,
      error: "Please provide a detailed reason (minimum 10 characters)"
    };
  }
  
  return { valid: true };
}
```

**Suggested Reasons**: Pre-defined text options that meet minimum length requirement
- "Guest request" ✗ (too short)
- "Guest requested cancellation" ✓
- "Emergency situation" ✓
- "Duplicate booking found" ✓
- "Payment failure occurred" ✓
- "Change of travel plans" ✓
- "No-show confirmed" ✓


### 5.4 Cancellation Processing Logic

The cancellation operation is **atomic** - both reservation and room updates occur together in the Zustand store.

**Existing Store Implementation** (no modifications needed):

```javascript
// From useHotelStore.js - cancelReservation action
cancelReservation: (reservationNo, reason = "") => set((state) => {
  // Find reservation and get assigned rooms
  const res = state.reservations.find(r => r.reservation_no === reservationNo);
  const assignedRooms = res ? res.rooms_assigned : [];

  return {
    // Update reservation status and store reason
    reservations: state.reservations.map((res) =>
      res.reservation_no === reservationNo 
        ? { ...res, status: "cancelled", cancellation_reason: reason } 
        : res
    ),
    
    // Update all assigned rooms to vacant_clean and clear guest data
    rooms: state.rooms.map((room) =>
      assignedRooms.includes(room.room_no) && 
      (room.status === "reservation" || room.reservation_no === reservationNo)
        ? { ...room, status: "vacant_clean", guest_name: "", reservation_no: "" }
        : room
    )
  };
}),
```

**Transaction Semantics**:
- Both updates occur in single Zustand state update (atomic)
- If reservation has no assigned rooms, only reservation is updated
- Room updates only affect rooms that were assigned to this reservation
- Preserves rooms assigned to other reservations (prevents accidental updates)


## 6. User Interface Specifications

### 6.1 IDS Classic Theme Patterns

**Color Palette**:
```javascript
{
  background: "bg-ids-background",      // #f5f1e8 (beige)
  sidebar: "bg-ids-sidebar",            // #2c2416 (dark brown)
  border: "border-ids-border",          // #d4c5a9 (light brown)
  text_primary: "text-ids-sidebar",     // #2c2416
  text_secondary: "text-gray-400",
  accent_red: "bg-red-600",
  accent_green: "bg-green-600",
  accent_blue: "bg-blue-600"
}
```

**Typography**:
```javascript
{
  heading: "font-black uppercase tracking-wider",
  label: "text-xs uppercase tracking-wider text-gray-400",
  value: "text-ids-sidebar font-mono",
  body: "text-xs"  // 12px base as per PMS standard
}
```

**Spacing & Layout**:
```javascript
{
  card_padding: "p-4 md:p-6",
  gap_small: "gap-2",
  gap_medium: "gap-4",
  gap_large: "gap-6",
  shadow: "shadow-3xs"
}
```


### 6.2 Responsive Breakpoints

**Mobile First Approach**:

```javascript
// Tailwind breakpoints used:
// sm: 640px  - Not used
// md: 768px  - Tablet layout
// lg: 1024px - Desktop layout
// xl: 1280px - Large desktop (not used)

// Layout examples:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {/* Search form fields */}
</div>

<div className="flex flex-col md:flex-row gap-4">
  {/* Button groups */}
</div>

<div className="p-4 md:p-6">
  {/* Content padding */}
</div>
```

**Touch Target Sizing**: Minimum 44px height for interactive elements on mobile

```javascript
className="py-3 px-4"  // Button padding = 44px+ height
```


### 6.3 Page Layout Structure

```jsx
<PageWrapper 
  title="Cancel Booking" 
  icon={Ban}
  backPath="/reservations"
  description="Search and cancel existing reservations"
>
  {mode === "search" ? (
    <div className="space-y-6">
      {/* Search Form Card */}
      <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
        <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider mb-4">
          Search Reservations
        </h2>
        {/* Search fields grid */}
        {/* Search/Clear buttons */}
      </div>
      
      {/* Search Results Card */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
          <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider mb-4">
            Search Results ({searchResults.length})
          </h2>
          {/* Results list */}
        </div>
      )}
    </div>
  ) : (
    <div className="space-y-6">
      {/* Reservation Details Card */}
      <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
        {/* Reservation details sections */}
      </div>
      
      {/* Cancellation Reason Card */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-3xs p-4 md:p-6">
        <h2 className="text-sm font-black text-red-700 uppercase tracking-wider mb-4">
          Cancellation Reason *
        </h2>
        {/* Reason textarea and suggestions */}
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={handleBackToSearch}>Back to Search</button>
        <button onClick={handleCancelReservation} disabled={!isCancellable}>
          Cancel Reservation
        </button>
      </div>
    </div>
  )}
</PageWrapper>
```


## 7. Integration Points

### 7.1 RBAC Integration

**Permission Check**:

```javascript
import { PERMISSIONS } from "../../config/rbac.js";

// In component or route guard
function canCancelReservations(userRole) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check for wildcard or specific permission
  return rolePermissions.includes("*") || 
         rolePermissions.includes(PERMISSIONS.RESERVATIONS_CANCEL);
}

// Usage in component
const currentUser = useHotelStore(state => state.currentUser);
const canCancel = canCancelReservations(currentUser.role);

if (!canCancel) {
  navigate("/unauthorized");
}
```

**Navigation Menu Visibility**:

The navigation item is already configured in `rbac.js`:

```javascript
NAV_CONFIG: {
  hotel_manager: {
    navItems: [
      { path: "/reservations/cancel", label: "Cancel Booking", icon: "Ban" }
    ]
  },
  front_office: {
    navItems: [
      { path: "/reservations/cancel", label: "Cancel Booking", icon: "Ban" }
    ]
  }
  // Not present in housekeeping or waiter_fnb
}
```


### 7.2 React Router Integration

**Route Definition** (in App.tsx):

```javascript
import { CancelBooking } from "./components/housekeeping/CancelBooking.jsx";
import { RequirePermission } from "./components/auth/RequirePermission.jsx";
import { PERMISSIONS } from "./config/rbac.js";

// In Routes
<Route
  path="/reservations/cancel"
  element={
    <RequirePermission permission={PERMISSIONS.RESERVATIONS_CANCEL}>
      <CancelBooking />
    </RequirePermission>
  }
/>
```

**URL Parameter Support**:

```javascript
// In CancelBooking component
const [searchParams] = useSearchParams();

useEffect(() => {
  const reservationId = searchParams.get("id");
  if (reservationId) {
    loadReservation(reservationId);
  }
}, [searchParams]);

// Usage from other pages:
// navigate("/reservations/cancel?id=RES001");
```

### 7.3 Toast Notifications

**Implementation** (using react-hot-toast):

```javascript
import toast from "react-hot-toast";

// Success
toast.success(`Reservation ${reservationNo} cancelled successfully ✓`, {
  duration: 3000,
  icon: "✓",
  style: {
    background: "#10b981",
    color: "#fff"
  }
});

// Error
toast.error("Cancellation failed - please try again", {
  duration: 4000,
  icon: "⚠️",
  style: {
    background: "#ef4444",
    color: "#fff"
  }
});
```


## 8. Error Handling

### 8.1 Error Categories

**Validation Errors** (User Correctable):
- Empty cancellation reason → "Cancellation reason is required"
- Short cancellation reason → "Please provide a detailed reason (minimum 10 characters)"
- Invalid status → "Cannot cancel {status} reservations"

**Not Found Errors**:
- Reservation not found → "Reservation not found - it may have been deleted"
- Guest not found → Display empty fields (graceful degradation)

**Permission Errors**:
- Unauthorized access → Redirect to `/unauthorized` page
- Role without permission → Navigation item hidden

**System Errors** (Unexpected):
- Store update failure → "Cancellation failed - please try again"
- Network connectivity loss → "Connection error - please try again"

### 8.2 Error Display Patterns

**Inline Field Errors**:
```javascript
{errors.reason && (
  <p className="text-red-600 text-xs mt-1">{errors.reason}</p>
)}
```

**Status Warnings** (Non-blocking):
```javascript
<div className="bg-red-50 border-l-4 border-red-600 p-3 text-sm text-red-700">
  <Ban className="w-4 h-4 inline mr-2" />
  {statusWarning}
</div>
```

**Toast Notifications** (Transient):
```javascript
toast.error(errorMessage);  // Auto-dismiss after 4s
```


## 9. Performance Considerations

### 9.1 Search Optimization

**Strategy**: Client-side filtering (suitable for training PMS with limited dataset)

```javascript
// Efficient filter with early returns
const filteredResults = useMemo(() => {
  if (!hasSearchCriteria(searchCriteria)) return [];
  
  return reservations.filter(res => {
    // Early return pattern for performance
    if (searchCriteria.reservation_no && 
        !res.reservation_no.includes(searchCriteria.reservation_no)) {
      return false;
    }
    // ... additional checks
    return true;
  });
}, [searchCriteria, reservations]);
```

**Justification**: 
- Demo dataset contains ~20-50 reservations
- Client-side filtering < 1ms for this scale
- Real-time search feedback
- No server round-trip delays

### 9.2 Guest Lookup Caching

```javascript
// Memoize guest lookups to avoid repeated array scans
const guestContactCache = useMemo(() => {
  const cache = new Map();
  guests.forEach(guest => {
    cache.set(guest.guest_name.toLowerCase(), {
      phone: guest.phone,
      email: guest.email
    });
  });
  return cache;
}, [guests]);

// Lookup function
function getGuestContacts(guestName) {
  return guestContactCache.get(guestName.toLowerCase()) || { phone: "", email: "" };
}
```


## 10. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all requirements, I identified the following groups of properties that can be consolidated:

**Redundancy Analysis**:
1. **Status validation properties** (3.3, 3.4, 3.5, 3.6): These can be unified into a single comprehensive property about button enablement based on status
2. **Confirmation dialog content properties** (6.2, 6.3, 6.4, 6.5): All test that specific data is present in dialog - can be combined into one property
3. **Reservation detail display properties** (7.1-7.8): Multiple properties testing individual fields can be consolidated into comprehensive display validation
4. **Room update properties** (5.3, 5.4, 5.5, 5.6): These describe different aspects of the same atomic operation - can be unified
5. **Search result validation** (2.6, 2.7): Can be combined into single property about result rendering
6. **Guest contact display** (12.2, 12.3, 12.5): Similar properties about displaying guest information

After consolidation, the unique properties that provide distinct validation value are:


### Property 1: Authorization gates cancellation interface access

*For any* user, the Cancel_Booking_Module interface SHALL be accessible if and only if the user has the RESERVATIONS_CANCEL permission.

**Validates: Requirements 1.3**

---

### Property 2: Multi-field search applies AND logic

*For any* combination of search criteria where multiple fields are filled, the search results SHALL only include reservations that match ALL filled criteria fields.

**Validates: Requirements 2.2**

---

### Property 3: Search results display required information

*For any* search result in the results list, the rendered output SHALL contain reservation number, guest name, status badge, arrival date, and assigned room information.

**Validates: Requirements 2.6, 2.7**

---

### Property 4: Non-cancellable reservations disable cancel action

*For any* reservation with status "checked_out" or "cancelled", the cancel button SHALL be disabled and a warning message SHALL be displayed.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Cancellation reason validation enforces minimum length

*For any* string provided as a cancellation reason, it SHALL be accepted if and only if its trimmed length is at least 10 characters.

**Validates: Requirements 4.2, 4.3, 4.4**

---


### Property 6: Cancellation updates reservation status

*For any* cancellable reservation, when cancelled with a valid reason, the reservation status SHALL be updated to "cancelled" in the system state.

**Validates: Requirements 5.1**

---

### Property 7: Cancellation stores reason with reservation

*For any* cancellation with a valid reason string, after processing, the reservation record SHALL contain that exact reason string in its cancellation_reason field.

**Validates: Requirements 5.2**

---

### Property 8: Room status updates atomically with cancellation

*For any* cancelled reservation with assigned rooms, all assigned rooms SHALL have their status updated to "vacant_clean", guest_name cleared to empty string, and reservation_no cleared to empty string.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6**

---

### Property 9: Successful cancellation displays confirmation and resets UI

*For any* successful cancellation operation, a success message SHALL be displayed and the UI SHALL return to search mode with cleared search fields.

**Validates: Requirements 5.7, 5.8**

---

### Property 10: Confirmation dialog displays complete reservation context

*For any* cancellation confirmation dialog, the dialog SHALL display the reservation number, guest name, assigned room numbers, and the entered cancellation reason.

**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

---


### Property 11: Reservation details display all required fields

*For any* loaded reservation in cancellation mode, the reservation detail display SHALL render all of: reservation number, status, guest name, contact information, arrival date, departure date, nights count, adults count, children count, room type, assigned rooms, payment mode, rate per night, and total amount.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

---

### Property 12: All reservation fields are read-only during cancellation

*For any* reservation displayed in cancellation mode, all displayed fields SHALL be in read-only format without editable input elements.

**Validates: Requirements 3.6, 7.8**

---

### Property 13: Enter key advances focus through search fields

*For any* search field except the last, pressing Enter key SHALL move focus to the next search field in the form.

**Validates: Requirements 8.1**

---

### Property 14: Clear button resets all search state

*For any* state of the search form, clicking the Clear button SHALL empty all search input fields and clear the search results list.

**Validates: Requirements 8.4, 8.5**

---

### Property 15: Validation failures display appropriate error messages

*For any* validation failure condition (empty reason, short reason, invalid status), the system SHALL display a field-specific error message describing the validation constraint.

**Validates: Requirements 10.1, 10.4**

---


### Property 16: Valid URL parameter bypasses search mode

*For any* valid reservation ID provided as a URL parameter, the system SHALL skip search mode and directly load the reservation into cancellation interface.

**Validates: Requirements 11.2**

---

### Property 17: Invalid URL parameter shows error and search mode

*For any* invalid or non-existent reservation ID provided as a URL parameter, the system SHALL display an error message and present the search mode interface.

**Validates: Requirements 11.3**

---

### Property 18: URL parameter loading applies status validation

*For any* reservation loaded via URL parameter, the same status validation rules SHALL be applied as for manually searched reservations.

**Validates: Requirements 11.5**

---

### Property 19: Guest contact information populates from guest database

*For any* reservation with a guest name matching a record in the guest database, the displayed phone and email fields SHALL be populated with the guest's contact information from the database.

**Validates: Requirements 12.2, 12.3**

---

### Property 20: Store integration uses correct parameters

*For any* cancellation operation, the cancelReservation store action SHALL be called with the reservation number and cancellation reason as parameters.

**Validates: Requirements 15.2**

---

### Property 21: Cancellation updates propagate to component state

*For any* completed cancellation, the component SHALL reflect the updated reservations and rooms state from the Zustand store.

**Validates: Requirements 15.4, 15.5**

---


## 11. Testing Strategy

### 11.1 Property-Based Testing

Property-based tests will be implemented using **fast-check** (for JavaScript/React). Each property test must:
- Run minimum **100 iterations** with randomized inputs
- Reference the design property it validates using tag format: `**Feature: cancel-booking-feature, Property {number}: {property_text}**`
- Generate appropriate test data (reservations, reasons, search criteria)

**Example Property Test Structure**:

```javascript
import fc from "fast-check";
import { describe, it, expect } from "vitest";

describe("Cancel Booking Properties", () => {
  it("Property 2: Multi-field search applies AND logic", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryReservation()),
        arbitrarySearchCriteria(),
        (reservations, criteria) => {
          const results = searchReservations(criteria, reservations);
          
          // All results must match ALL filled criteria
          results.forEach(result => {
            if (criteria.reservation_no) {
              expect(result.reservation_no).toContain(criteria.reservation_no);
            }
            if (criteria.guest_name) {
              expect(result.guest_name.toLowerCase()).toContain(criteria.guest_name.toLowerCase());
            }
            // ... verify all criteria
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


### 11.2 Unit Testing

Unit tests complement property-based tests by covering specific examples, edge cases, and UI interactions:

**Specific Examples**:
- Navigation menu visibility for different roles (hotel_manager, front_office, housekeeping, waiter_fnb)
- Empty search displays instructional message
- Single search result auto-loads reservation
- Checked-out reservation displays specific warning message
- Cancelled reservation displays specific warning message
- Suggested reason chips populate textarea
- Confirmation dialog confirm/cancel actions
- Back to Search button navigation
- Enter key on last field executes search
- Toast notification styling and auto-dismiss timing
- URL parameter with specific reservation ID
- No URL parameter starts in search mode
- No matching guest record shows empty contact fields
- Duplicate guest names use first matching record

**Integration Tests**:
- RBAC permission check redirects unauthorized users
- Zustand store state updates propagate to component
- Real-time state observation from other components

**UI Component Tests**:
- Search form field rendering
- Clear button presence
- Search button presence
- Back to Search button presence
- Back arrow button navigation
- Cancellation reason input field presence
- CSS class applications for IDS Classic theme
- Responsive layout at different breakpoints
- Minimum touch target sizes on mobile


### 11.3 Test Data Generators (Arbitraries)

**Reservation Generator**:
```javascript
function arbitraryReservation() {
  return fc.record({
    reservation_no: fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), { minLength: 6, maxLength: 10 }),
    guest_name: fc.oneof(fc.constant("John Doe"), fc.constant("Jane Smith"), fc.string()),
    status: fc.constantFrom("confirmed", "checked_in", "checked_out", "cancelled"),
    arrival: fc.date({ min: new Date("2026-01-01"), max: new Date("2026-12-31") }).map(d => d.toISOString().split('T')[0]),
    departure: fc.date({ min: new Date("2026-01-02"), max: new Date("2027-01-31") }).map(d => d.toISOString().split('T')[0]),
    rooms_assigned: fc.array(fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 3, maxLength: 3 }), { maxLength: 3 }),
    room_type: fc.constantFrom("DLX", "EXEC", "STD", "STE"),
    adults: fc.integer({ min: 1, max: 4 }),
    children: fc.integer({ min: 0, max: 3 }),
    pay_mode: fc.constantFrom("Cash", "Credit Card", "Company"),
    rate: fc.integer({ min: 2000, max: 8000 }),
    total_amount: fc.integer({ min: 2000, max: 50000 })
  });
}
```

**Search Criteria Generator**:
```javascript
function arbitrarySearchCriteria() {
  return fc.record({
    reservation_no: fc.option(fc.string({ minLength: 3 }), { nil: "" }),
    guest_name: fc.option(fc.string({ minLength: 2 }), { nil: "" }),
    phone: fc.option(fc.stringOf(fc.constantFrom(...'0123456789+- '), { minLength: 10 }), { nil: "" }),
    email: fc.option(fc.emailAddress(), { nil: "" }),
    arrival: fc.option(fc.date().map(d => d.toISOString().split('T')[0]), { nil: "" }),
    departure: fc.option(fc.date().map(d => d.toISOString().split('T')[0]), { nil: "" }),
    room_no: fc.option(fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 3, maxLength: 3 }), { nil: "" })
  });
}
```

**Cancellation Reason Generator**:
```javascript
function arbitraryCancellationReason() {
  return fc.oneof(
    fc.string({ minLength: 0, maxLength: 5 }),     // Too short
    fc.string({ minLength: 10, maxLength: 200 }),  // Valid
    fc.constant("Guest requested cancellation"),    // Suggested reason
    fc.constant("Emergency situation"),
    fc.constant(""),                                // Empty
    fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 20 }) // Whitespace only
  );
}
```


## 12. Dependencies

### 12.1 External Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "react-hook-form": "^7.x",
  "react-hot-toast": "^2.x",
  "zustand": "^4.x",
  "lucide-react": "^0.x",
  "date-fns": "^2.x"
}
```

### 12.2 Internal Dependencies

**Existing Components**:
- `PageWrapper` - Layout wrapper component
- `ReservationStatusBadge` - Colored status badge
- `Modal` - Modal dialog component

**Hooks**:
- `useHotelStore` - Zustand store hook
- `useEnterAsTab` - Keyboard navigation hook

**Data/Config**:
- `rbac.js` - Role and permission configuration
- `guests.js` - Guest database

### 12.3 Development Dependencies

```json
{
  "vitest": "^1.x",
  "fast-check": "^3.x",
  "@testing-library/react": "^14.x",
  "@testing-library/user-event": "^14.x",
  "@testing-library/jest-dom": "^6.x"
}
```


## 13. Security Considerations

### 13.1 Authorization

- **Permission-based access**: All cancellation operations gated behind `RESERVATIONS_CANCEL` permission
- **Route protection**: React Router guards prevent unauthorized route access
- **UI hiding**: Navigation menu items hidden for unauthorized roles
- **Component-level checks**: Permission validation at component mount

### 13.2 Data Integrity

- **Atomic updates**: Reservation and room updates occur in single Zustand transaction
- **Status validation**: Prevents cancellation of inappropriate reservation states
- **Mandatory audit trail**: Cancellation reason required and stored with every cancellation
- **Confirmation dialog**: Double-check mechanism prevents accidental cancellations

### 13.3 Input Validation

- **Cancellation reason**: Minimum length enforcement (10 chars)
- **Search criteria**: Sanitized before filtering
- **URL parameters**: Validated before processing

### 13.4 State Management Security

- **Immutable updates**: Zustand enforces immutable state updates
- **No direct mutations**: All state changes through defined actions
- **Type safety**: Component props and state properly typed (when using TypeScript)


## 14. Future Enhancements

### 14.1 Potential Improvements (Out of Current Scope)

**Bulk Cancellation**:
- Select multiple reservations from search results
- Cancel multiple reservations with shared reason
- Batch confirmation dialog

**Advanced Search**:
- Date range search (arrival between X and Y)
- Fuzzy text matching for guest names
- Search history and saved searches

**Cancellation Reports**:
- Cancellation statistics by reason
- Cancellation trends over time
- Revenue impact tracking

**Partial Cancellation**:
- Cancel specific rooms within multi-room reservation
- Adjust guest count without full cancellation
- Modify dates instead of cancelling

**Undo Functionality**:
- Restore recently cancelled reservation
- Time-limited undo window (e.g., 5 minutes)
- Audit log of cancellation/restoration

**Notification System**:
- Email notification to guest on cancellation
- SMS notification option
- Manager notification for high-value cancellations


## 15. Implementation Checklist

### 15.1 Core Component Development

- [ ] Create `CancelBooking.jsx` component skeleton
- [ ] Implement search mode UI with form fields
- [ ] Implement cancellation mode UI with reservation details
- [ ] Add keyboard navigation with `useEnterAsTab` hook
- [ ] Implement multi-field AND search logic
- [ ] Implement guest contact lookup functionality
- [ ] Add status validation logic
- [ ] Create cancellation reason input with suggestions
- [ ] Implement confirmation dialog modal
- [ ] Add toast notifications for success/error states
- [ ] Implement navigation controls (Back to Search, back arrow)
- [ ] Add URL parameter support for direct reservation loading

### 15.2 Integration

- [ ] Add route definition in App.tsx with permission guard
- [ ] Verify navigation menu configuration in rbac.js
- [ ] Test integration with useHotelStore cancelReservation action
- [ ] Test state propagation from store updates
- [ ] Verify RBAC permission checks

### 15.3 Styling

- [ ] Apply IDS Classic theme colors and typography
- [ ] Implement responsive grid layouts
- [ ] Style form inputs and buttons
- [ ] Style status badges and warnings
- [ ] Style confirmation dialog
- [ ] Test responsive behavior at all breakpoints
- [ ] Verify touch target sizes on mobile

### 15.4 Testing

- [ ] Write property-based tests for 21 correctness properties
- [ ] Write unit tests for specific examples and edge cases
- [ ] Write integration tests for RBAC and store integration
- [ ] Write UI component tests
- [ ] Achieve minimum 100 iterations per property test
- [ ] Add property tags to all property tests
- [ ] Test keyboard navigation flows
- [ ] Test error handling scenarios

### 15.5 Documentation

- [ ] Add inline code comments for complex logic
- [ ] Document component props and state
- [ ] Update user guide with cancellation workflow
- [ ] Create training materials for hotel staff


## 16. Acceptance Criteria Summary

This design document addresses all 15 requirements and 87 acceptance criteria from the requirements document:

**Requirement 1**: Access Control and Authorization (5 criteria) ✓  
**Requirement 2**: Reservation Search and Lookup (8 criteria) ✓  
**Requirement 3**: Reservation Status Validation (6 criteria) ✓  
**Requirement 4**: Cancellation Reason Capture (7 criteria) ✓  
**Requirement 5**: Cancellation Processing (8 criteria) ✓  
**Requirement 6**: Cancellation Confirmation Dialog (8 criteria) ✓  
**Requirement 7**: Reservation Detail Display (8 criteria) ✓  
**Requirement 8**: Search Form Interaction (7 criteria) ✓  
**Requirement 9**: Navigation and Return Flow (7 criteria) ✓  
**Requirement 10**: Error Handling and User Feedback (8 criteria) ✓  
**Requirement 11**: URL Parameter Support (5 criteria) ✓  
**Requirement 12**: Guest Information Lookup (6 criteria) ✓  
**Requirement 13**: Visual Design and IDS Classic Theme (10 criteria) ✓  
**Requirement 14**: Responsive Layout (6 criteria) ✓  
**Requirement 15**: State Management Integration (6 criteria) ✓  

**Total**: 87 acceptance criteria covered through 21 correctness properties and comprehensive architectural design.

---

## Document Version

**Version**: 1.0  
**Date**: 2026-06-30  
**Status**: Design Complete  
**Next Phase**: Task Breakdown

