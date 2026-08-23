# Duplicate Guest Check Feature

## Overview
A duplicate guest name detection system integrated into the New Reservation flow. When creating a reservation, the system checks if a guest with the same name already exists and prompts the user to decide whether to reuse the existing guest record or create a new one.

## Implementation Summary

### Files Modified
1. **src/components/reservations/QuickReservation.jsx**
   - Added duplicate guest detection logic in `saveBooking()`
   - Integrated `DuplicateGuestModal` component
   - Added handlers for user decisions: `handleContinueWithExistingGuest()` and `handleCreateNewGuest()`

2. **src/store/useHotelStore.js**
   - Enhanced `createReservation()` to handle three scenarios:
     - Reuse existing guest (no new guest record created)
     - Force create new guest despite duplicate name
     - Normal creation (no duplicate found)

### Files Created
3. **src/components/reservations/DuplicateGuestModal.jsx**
   - New modal component for duplicate detection UI
   - Shows existing guest details (ID, email, phone, location, identity, rating)
   - Provides two action buttons: "Continue with Existing Guest" and "Create New Guest Record"

## How It Works

### Flow Diagram
```
User fills form → Clicks "Create Reservation" or "Save Reservation"
                           ↓
              Check guest name in store (case-insensitive)
                           ↓
                    ┌──────┴──────┐
                    ↓             ↓
              No Match         Match Found
                    ↓             ↓
            Create Guest    Show Dialog
            Create Res      ┌────┴────┐
            Success         ↓         ↓
                      Continue   Create New
                           ↓         ↓
                    Link to    Force create
                    existing   new guest
                    guest      with same name
                           ↓         ↓
                    Create Reservation
                           ↓
                        Success
```

### Guest Name Matching Logic
- **Case-insensitive**: "John Smith" matches "john smith" and "JOHN SMITH"
- **Whitespace trimmed**: " John Smith " matches "John Smith"
- **Exact match**: Full name must match completely

### User Decision Handling

#### Option 1: Continue with Existing Guest
- Button: "Continue with Existing Guest"
- Action: Links the new reservation to the existing guest's ID
- Result: NO new guest record created
- Use case: Same person making another booking

#### Option 2: Create New Guest Record
- Button: "Create New Guest Record"  
- Action: Creates a completely new guest entry with its own unique ID
- Result: NEW guest record created despite name match
- Use case: Different person who happens to have the same name

## Testing Instructions

### Test Case 1: New Guest (No Duplicate)
**Objective**: Verify normal flow when no duplicate exists

**Steps**:
1. Navigate to Quick Reservation form
2. Fill in all required fields
3. In guest table, enter a completely unique name (e.g., "Zebra Unicorn Phoenix")
4. Click "Save Reservation" or "Proceed Detail"

**Expected Result**:
- ✅ No dialog appears
- ✅ Reservation created successfully
- ✅ New guest record created in guests table
- ✅ Success toast message shown
- ✅ Redirected to reservations list

**Verification in Browser Console**:
```javascript
// Should see this log
"Created new guest: G0XX"
```

### Test Case 2: Duplicate Guest - Continue with Existing
**Objective**: Verify reusing existing guest record

**Steps**:
1. Note an existing guest name from the system (e.g., "Biswakarma Santosh")
2. Navigate to Quick Reservation form
3. Fill in all required fields
4. In guest table, enter the EXACT same name: "Biswakarma Santosh"
5. Click "Save Reservation"

**Expected Result**:
- ✅ Duplicate Guest Modal appears
- ✅ Modal shows existing guest details:
  - Guest ID: G001
  - Email: santosh.biswa@gmail.com
  - Phone: +91 9876543210
  - Location: Guwahati, Assam, India
  - Rating: Excellent
- ✅ Two buttons visible: "Continue with Existing Guest" and "Create New Guest Record"
- ✅ Modal cannot be closed by clicking outside

6. Click "Continue with Existing Guest"

**Expected Result**:
- ✅ Modal closes
- ✅ Reservation created successfully
- ✅ NO new guest record created
- ✅ Reservation linked to existing guest (G001)
- ✅ Success toast message shown
- ✅ Redirected to reservations list

**Verification in Browser Console**:
```javascript
// Should see this log
"Reusing existing guest: G001"
```

**Verification in Zustand State** (Browser DevTools):
```javascript
// Check guests array length before and after
// Length should NOT increase
```

### Test Case 3: Duplicate Guest - Create New Record
**Objective**: Verify forcing creation of new guest with duplicate name

**Steps**:
1. Use the same existing guest name: "Biswakarma Santosh"
2. Navigate to Quick Reservation form
3. Fill in all required fields
4. In guest table, enter: "Biswakarma Santosh"
5. Click "Save Reservation"
6. Duplicate Guest Modal appears (same as Test Case 2)
7. Click "Create New Guest Record"

**Expected Result**:
- ✅ Modal closes
- ✅ Reservation created successfully
- ✅ NEW guest record created with same name but different ID (e.g., G021)
- ✅ Reservation linked to the NEW guest ID (not the original G001)
- ✅ Success toast message shown
- ✅ Redirected to reservations list

**Verification in Browser Console**:
```javascript
// Should see this log
"Force created new guest with duplicate name: G021"
```

**Verification in Zustand State**:
```javascript
// Check guests array - should have two entries with "Biswakarma Santosh"
// - Original: { guest_id: "G001", guest_name: "Biswakarma Santosh", ... }
// - New:      { guest_id: "G021", guest_name: "Biswakarma Santosh", ... }
```

### Test Case 4: Case Insensitive Matching
**Objective**: Verify case-insensitive duplicate detection

**Steps**:
1. Existing guest: "Biswakarma Santosh"
2. Create reservation with: "biswakarma santosh" (all lowercase)
3. Observe duplicate modal appears
4. Verify existing guest details shown correctly

**Expected Result**:
- ✅ Modal appears (case-insensitive match works)
- ✅ Shows correct existing guest: "Biswakarma Santosh"

### Test Case 5: Whitespace Trimming
**Objective**: Verify whitespace is trimmed during matching

**Steps**:
1. Existing guest: "Biswakarma Santosh"
2. Create reservation with: "  Biswakarma Santosh  " (leading/trailing spaces)
3. Observe duplicate modal appears

**Expected Result**:
- ✅ Modal appears (whitespace trimming works)
- ✅ Shows correct existing guest details

### Test Case 6: Rate Information Preserved
**Objective**: Verify Rate Information and other fields are not affected

**Steps**:
1. Create reservation with duplicate guest name
2. Before clicking Save, ensure Rate Information fields are filled
3. Handle duplicate dialog (choose either option)

**Expected Result**:
- ✅ Rate Information fields preserved and saved correctly
- ✅ All other reservation fields (dates, room type, adults, etc.) saved correctly
- ✅ No data loss during duplicate guest handling

### Test Case 7: Multiple Reservations with Same Guest
**Objective**: Verify multiple bookings can link to same guest

**Steps**:
1. Create first reservation with "Test Guest Alpha"
2. Complete successfully
3. Create second reservation with "Test Guest Alpha"
4. In duplicate modal, click "Continue with Existing Guest"
5. Create third reservation with "Test Guest Alpha"
6. In duplicate modal, click "Continue with Existing Guest"

**Expected Result**:
- ✅ Only ONE guest record exists for "Test Guest Alpha"
- ✅ THREE reservations exist, all linked to the same guest
- ✅ No duplicate guest records created

### Test Case 8: "Proceed Detail" Button
**Objective**: Verify duplicate check works with "Proceed Detail" button

**Steps**:
1. Fill form with duplicate guest name
2. Click "Proceed Detail" button (instead of "Save Reservation")

**Expected Result**:
- ✅ Duplicate modal appears correctly
- ✅ Both options work as expected
- ✅ Navigation to reservations list after completion

## Manual Verification Checklist

### UI/UX Checks
- [ ] Modal appears immediately when duplicate detected
- [ ] Modal has amber border and warning icon
- [ ] Existing guest details are clearly displayed
- [ ] Both buttons are easily distinguishable
- [ ] Modal cannot be dismissed accidentally (no X button, no click-outside)
- [ ] Modal is responsive and readable on different screen sizes

### Data Integrity Checks
- [ ] Guest records are not duplicated when "Continue" is chosen
- [ ] New guest records ARE created when "Create New" is chosen
- [ ] Reservation correctly links to intended guest (check guest_name field)
- [ ] All reservation fields saved correctly regardless of choice
- [ ] Rate Information preserved through the flow

### Browser Console Checks
```javascript
// Open DevTools → Console tab
// Look for these log messages:

// When no duplicate:
"Created new guest: G0XX"

// When reusing existing:
"Reusing existing guest: G001"

// When forcing new:
"Force created new guest with duplicate name: G021"
```

### Zustand State Inspection
```javascript
// Open DevTools → Console tab
// Run these commands:

// 1. Check all guests
window.hotelStore = require('./src/store/useHotelStore.js').useHotelStore.getState()
console.table(window.hotelStore.guests)

// 2. Check all reservations
console.table(window.hotelStore.reservations)

// 3. Find reservations by guest name
window.hotelStore.reservations.filter(r => r.guest_name === "Biswakarma Santosh")
```

## Edge Cases Handled

### 1. Empty Guest Name
- Validation already exists in `handleProceed()` and form submission
- Error toast: "Please add at least one guest name in the registration grid."

### 2. Title-only Names
- Full name construction: `${title} ${first_name} ${last_name}`.trim()
- If only title exists, result is "Mr" or similar
- Will match if another reservation has just "Mr"

### 3. Modal State Reset
- Modal state cleared after reservation creation
- Prevents stale data in subsequent reservations
- Clean slate for next operation

### 4. Navigation After Creation
- Always navigates to /reservations after successful creation
- Refreshes the list to show new reservation
- Modal closes if in modal mode

## Known Limitations

1. **First Name Only Matching**: If two users enter "Smith" in last name field with different first names, no duplicate will be detected (names are compared as full strings)

2. **No Fuzzy Matching**: Only exact name matches are detected. Similar names like "John Smith" vs "Jon Smith" won't trigger the dialog.

3. **No Phone/Email Matching**: The system only checks names, not contact information.

4. **Local State Only**: Currently works with Zustand store. If switching to Supabase backend, additional queries will be needed.

## Future Enhancements

1. **Fuzzy Name Matching**: Implement Levenshtein distance or similar algorithm
2. **Multi-field Matching**: Check phone/email in addition to name
3. **Guest History**: Show last stay date in the duplicate modal (requires historical data)
4. **Merge Profiles**: Allow merging duplicate guest records
5. **Smart Suggestions**: "Did you mean X?" suggestions based on partial matches

## Rollback Instructions

If issues arise, revert these files:
```bash
git checkout HEAD -- src/components/reservations/QuickReservation.jsx
git checkout HEAD -- src/store/useHotelStore.js
rm src/components/reservations/DuplicateGuestModal.jsx
```

## Summary

✅ **Completed**: Duplicate guest check integrated into New Reservation flow
✅ **Scope**: Only guest name detection at reservation creation time
✅ **No Impact**: Rate Information, room selection, dates, and other fields unaffected
✅ **User Control**: User makes explicit choice via modal dialog
✅ **Data Safety**: No accidental duplicates or data loss

The feature is production-ready and fully testable following the test cases above.
