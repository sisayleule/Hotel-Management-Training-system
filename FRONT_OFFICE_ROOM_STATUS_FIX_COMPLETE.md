# Front Office Room Status Control — Implementation Complete ✓

## Summary
Fixed RBAC for room status changes so that **Front Office can ONLY checkout occupied rooms** (which auto-sets to dirty), while **Housekeeping has full control** over all other room status changes.

---

## What Changed

### 1. **Permission Model** (`src/config/rbac.js`)
- Added new permission: `ROOMS_CHECKOUT_ONLY` — granted to `front_office`
- Removed `ROOMS_CHANGE_STATUS` from `front_office`
- `housekeeping` retains `HOUSEKEEPING_UPDATE_STATUS` for full room status control

### 2. **Room Detail Sheet** (`src/components/rooms/RoomDetailSheet.jsx`)
- **Front Office** — when clicking any room:
  - **Vacant Clean**: Can create reservation only (OOO/Dirty buttons hidden with notice)
  - **Dirty**: Can create reservation only (Clean/OOO buttons hidden with notice)
  - **Occupied**: New **"Quick Checkout → Set Dirty"** button (orange) — directly calls `checkOutGuest()` which auto-sets room to dirty, no navigation
  - **Out of Order**: Shows "Housekeeping Access Only" notice
  - **Reservation**: Can check-in and view, but cancel button hidden

- **Housekeeping/Manager**:
  - Full access to all status-change buttons (Clean, Dirty, OOO, Cancel, etc.)
  - Occupied rooms show traditional "Check Out Guest" button (navigates to full checkout page)

### 3. **Housekeeping Card** (`src/components/housekeeping/HouseKeepingCard.jsx`)
- **Front Office**: All quick-status buttons replaced with "Housekeeping Access Only" notice
- **Front Office**: Room condition radios disabled with locked notice
- **Front Office**: Maintenance form hidden
- **Housekeeping/Manager**: Full access to all controls

---

## Behaviour by Role

| Role | Occupied Room Action | Other Status Changes |
|---|---|---|
| **Front Office** | ✅ Quick Checkout → Dirty (direct) | ❌ All blocked with notice |
| **Housekeeping** | ✅ Check Out Guest (full page) | ✅ Full control (Clean, Dirty, OOO, etc.) |
| **Hotel Manager** | ✅ Check Out Guest (full page) | ✅ Full control (wildcard `*`) |

---

## Testing Instructions

### As Front Office:
1. Set role: `localStorage.setItem('pms_demo_role', 'front_office')` then refresh
2. Navigate to Room Status page (`/app/rooms`)
3. Click an **Occupied** room (red badge)
4. You should see:
   - **Orange button**: "Quick Checkout → Set Dirty"
   - **Blue button**: "Post Charge"
   - **Blue info box**: "Checking out this guest will automatically mark the room as Dirty..."
   - ❌ NO "Request Housekeeping" button
5. Click "Quick Checkout → Set Dirty"
6. Room status changes from Occupied → Dirty immediately
7. Try clicking a Vacant Clean or Dirty room — you should see orange "Housekeeping Access Only" notice instead of status-change buttons

### As Housekeeping:
1. Set role: `localStorage.setItem('pms_demo_role', 'housekeeping')` then refresh
2. Navigate to Room Status or Housekeeping page
3. Click any room — all status-change buttons visible and functional
4. Occupied rooms show "Check Out Guest" (red button, navigates to checkout page)

---

## Files Modified

1. `src/config/rbac.js` — Permission definitions
2. `src/components/rooms/RoomDetailSheet.jsx` — Room detail panel with role-based UI
3. `src/components/housekeeping/HouseKeepingCard.jsx` — Housekeeping slide-over card with guards

---

## Key Technical Details

**Permission Check Pattern:**
```js
const canChangeStatus = can(PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS) || can("*");
const checkoutOnly = can(PERMISSIONS.ROOMS_CHECKOUT_ONLY) && !canChangeStatus;
```

**Quick Checkout Implementation:**
```js
// Front Office: direct checkout without navigation
const checkOutGuest = useHotelStore.getState().checkOutGuest;
checkOutGuest(room.reservation_no);
// This automatically sets room.status = "dirty" and clears guest info
```

**Housekeeping Store Action (already existed):**
```js
checkOutGuest: (reservationNo) => set((state) => {
  const res = state.reservations.find((r) => r.reservation_no === reservationNo);
  const assignedRooms = res ? res.rooms_assigned : [];
  return {
    reservations: state.reservations.map((resItem) =>
      resItem.reservation_no === reservationNo 
        ? { ...resItem, status: "checked_out" } 
        : resItem
    ),
    rooms: state.rooms.map((room) =>
      assignedRooms.includes(room.room_no)
        ? { ...room, status: "dirty", guest_name: "", reservation_no: "" }
        : room
    )
  };
})
```

---

## Success Criteria ✓

- [x] Front Office can click occupied room and checkout (auto-dirty)
- [x] Front Office CANNOT change any other room status (clean, dirty, OOO)
- [x] Housekeeping has full control over all room statuses
- [x] UI shows clear locked notices to Front Office when actions are restricted
- [x] No permission errors in console
- [x] Code compiles without TypeScript/JavaScript errors

---

**Status**: COMPLETE AND TESTED ✓
**Date**: 2026-08-16
