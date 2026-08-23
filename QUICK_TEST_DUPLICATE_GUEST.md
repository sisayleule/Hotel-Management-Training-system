# Quick Test Guide: Duplicate Guest Check

## 🎯 Quick Test (5 minutes)

### Test 1: Brand New Guest (No Dialog)
1. Go to **Quick Reservation** form
2. Fill guest name: **"Zebra Unicorn Phoenix"** (completely unique)
3. Fill other required fields (dates, room type, etc.)
4. Click **"Save Reservation"**
5. ✅ **Expected**: No dialog, direct success, reservation created

---

### Test 2: Duplicate Guest - Reuse Existing
1. Go to **Quick Reservation** form
2. Fill guest name: **"Biswakarma Santosh"** (exists in system)
3. Fill other required fields
4. Click **"Save Reservation"**
5. ✅ **Expected**: Dialog appears showing:
   - Guest ID: G001
   - Email: santosh.biswa@gmail.com
   - Phone: +91 9876543210
   - Rating: Excellent
6. Click **"Continue with Existing Guest"**
7. ✅ **Expected**: Reservation created, linked to G001, NO new guest record

---

### Test 3: Duplicate Guest - Create New
1. Go to **Quick Reservation** form
2. Fill guest name: **"Biswakarma Santosh"** (same name again)
3. Fill other required fields
4. Click **"Save Reservation"**
5. Dialog appears (same as Test 2)
6. Click **"Create New Guest Record"**
7. ✅ **Expected**: Reservation created, NEW guest record with different ID (e.g., G021)

---

### Test 4: Case Insensitive
1. Fill guest name: **"biswakarma santosh"** (all lowercase)
2. Click **"Save Reservation"**
3. ✅ **Expected**: Dialog still appears (case doesn't matter)

---

## 🔍 Verification

### Check in Browser Console (F12)
Look for these messages:
- `"Created new guest: G0XX"` → New guest created
- `"Reusing existing guest: G001"` → Existing guest reused
- `"Force created new guest with duplicate name: G021"` → New guest despite duplicate

### Check in Zustand State
```javascript
// Open Console, run:
JSON.parse(localStorage.getItem('hotel-store')).state.guests
// Look for duplicate names with different IDs
```

---

## ✅ Success Criteria

- [ ] Test 1: No dialog for unique names
- [ ] Test 2: Dialog appears for duplicates
- [ ] Test 3: "Continue" button reuses existing guest (no new guest row)
- [ ] Test 4: "Create New" button creates new guest (new row in guests table)
- [ ] Test 5: Case insensitive matching works
- [ ] Rate Information and all fields saved correctly in all scenarios

---

## 🎪 Demo Guest Names

Use these existing guests for testing:
- Biswakarma Santosh
- Rai Sangeeta
- Sajin Ahmed
- Natraj K
- Menan Yosef
- Sharma Rajesh
- Patel Amit

---

## 🐛 If Something Goes Wrong

1. Check browser console for errors
2. Verify modal imports correctly
3. Check that `allGuests` is pulled from store
4. Ensure guest name is properly formatted (Title + First + Last)

---

**Feature Status**: ✅ Complete and Ready for Testing
