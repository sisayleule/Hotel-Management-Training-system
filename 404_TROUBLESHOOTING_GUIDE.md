# 404 Error Troubleshooting Guide

## Current Status

✅ **Role Sync Working** - Console shows permissions are being set correctly  
⚠️ **Still Getting 404** - Need to diagnose why ProtectedRoute is failing

---

## 🔍 Diagnostic Steps

### Step 1: Access the Diagnostic Page

I've created a special diagnostic page to help us see exactly what's happening.

**Navigate to:** `http://localhost:3000/app/diagnostic`

This page will show you:
- ✅ Auth Context state (Supabase authentication)
- ✅ Hotel Store state (Zustand user data)
- ✅ Role Store state (RBAC permissions)
- ✅ Permission checks for specific permissions
- ✅ localStorage values

---

### Step 2: What to Look For

On the diagnostic page, check these values:

#### Auth Context Section
- **Loading:** should be `false`
- **Profile Role:** should be `student`, `admin`, or `dept_head`
- **Profile Status:** should be `approved`

#### Hotel Store Section
- **Current User:** should be `exists`
- **Auth Role:** should match Profile Role
- **Training Role:** should be `front_office` or `hotel_manager`

#### Role Store Section
- **Current Role:** should be `front_office` or `hotel_manager`
- **Permissions Count:** should be > 0 (at least 10 permissions)
- **Permissions List:** should show array of permission strings

#### Permission Checks Section
- **RESERVATIONS_VIEW:** should be green (GRANTED)
- **RESERVATIONS_EDIT:** should be green (GRANTED)
- **RESERVATIONS_CANCEL:** should be green (GRANTED)

---

### Step 3: Common Issues & Fixes

#### Issue 1: Permissions Count = 0
**Symptom:** Role Store shows 0 permissions  
**Cause:** Role store not syncing properly  
**Fix:**
```javascript
// Run in browser console (F12)
localStorage.clear();
location.reload();
```

#### Issue 2: Training Role = null
**Symptom:** Hotel Store or Role Store shows null training role  
**Cause:** AuthContext not setting role properly  
**Fix:**
1. Check console for errors
2. Log out completely
3. Clear cache (Ctrl+Shift+Delete)
4. Log back in

#### Issue 3: Loading = true (stuck)
**Symptom:** Auth Context loading never completes  
**Cause:** Profile fetch hanging or failing  
**Fix:**
1. Check network tab in DevTools
2. Look for failed Supabase requests
3. Verify internet connection
4. Check Supabase service status

#### Issue 4: Role Mismatch
**Symptom:** Profile Role says `student` but Training Role is null  
**Cause:** Role mapping logic not executing  
**Fix:** This shouldn't happen with the new code, but if it does:
```javascript
// Run in console
import { useRoleStore } from './store/useRoleStore';
useRoleStore.getState().setRole('front_office');
location.reload();
```

---

## 🐛 Debug Commands

### Check Current State (Console)
```javascript
// Check auth context
console.log('Profile:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Check Zustand stores
import { useHotelStore } from './store/useHotelStore';
import { useRoleStore } from './store/useRoleStore';

console.log('Hotel Store:', useHotelStore.getState());
console.log('Role Store:', useRoleStore.getState());
```

### Force Role Sync (Console)
```javascript
// Manually set role to front_office
useRoleStore.getState().setRole('front_office');

// Or hotel_manager for full access
useRoleStore.getState().setRole('hotel_manager');
```

### Check Permissions (Console)
```javascript
import { PERMISSIONS } from './config/rbac';

const can = useRoleStore.getState().can;
console.log('Can view reservations:', can(PERMISSIONS.RESERVATIONS_VIEW));
console.log('Can edit reservations:', can(PERMISSIONS.RESERVATIONS_EDIT));
console.log('Can cancel reservations:', can(PERMISSIONS.RESERVATIONS_CANCEL));
```

---

## 📊 Expected Values

### For Students:
| Field | Expected Value |
|-------|---------------|
| Profile Role | `student` |
| Profile Status | `approved` |
| Training Role | `front_office` |
| Permissions Count | 13 |
| Can Access Reservations | ✅ Yes |
| Can Access Assign Room | ✅ Yes |
| Can Access Cashiering | ✅ Yes |
| Can Access Housekeeping | ❌ No |

### For Admin/Dept Head:
| Field | Expected Value |
|-------|---------------|
| Profile Role | `admin` or `dept_head` |
| Profile Status | `approved` |
| Training Role | `hotel_manager` |
| Permissions Count | 1 (wildcard "*") |
| Can Access Everything | ✅ Yes |

---

## 🔧 Manual Fix (If All Else Fails)

If the diagnostic page shows everything is correct but you're still getting 404, the issue might be with React Router or the build cache.

### Hard Reset:
```bash
# Stop the dev server (Ctrl+C)

# Clear all caches
npm run clean  # if you have this script

# Or manually:
rm -rf node_modules/.vite
rm -rf dist

# Reinstall and rebuild
npm install
npm run build
npm run dev
```

### Browser Hard Reset:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Close all tabs for localhost:3000
5. Restart browser
6. Navigate to localhost:3000

---

## 🎯 Next Steps

1. **Navigate to `/app/diagnostic`** to see all the details
2. **Screenshot the diagnostic page** if there are issues
3. **Check the console** for any errors
4. **Try the manual fixes** if needed

---

## 📸 What to Screenshot

If you need help troubleshooting:

1. The entire diagnostic page showing all sections
2. Browser console (F12 → Console tab)
3. Network tab showing any failed requests
4. localStorage view (Application → Local Storage)

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ Diagnostic page shows Training Role = `front_office` or `hotel_manager`
- ✅ Permissions Count > 0
- ✅ All permission checks are green (GRANTED)
- ✅ No 404 errors when navigating to features
- ✅ Console shows: `[RBAC] Role switched to: <Role Name>`

---

## 🚨 Emergency Workaround

If you need immediate access and nothing else works, you can temporarily override permissions:

```javascript
// TEMPORARY ONLY - Run in console
import { useRoleStore } from './store/useRoleStore';
useRoleStore.getState().setRole('hotel_manager'); // Full access
location.reload();
```

This gives you hotel_manager permissions (full access) regardless of your actual role. **Use only for testing!**

---

## 📞 Report Back

After checking the diagnostic page, let me know:
1. What does "Permissions Count" show?
2. Are all three permission checks green?
3. Is "Training Role" set correctly?
4. Any errors in the console?

This will help us fix the issue quickly!
