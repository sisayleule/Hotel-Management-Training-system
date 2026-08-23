# Pending Account Login Fix + Req 7.15 Enforcement

## Problem
Users with pending accounts experienced redirect loops when trying to login. Additionally, needed to ensure Requirement 7.15 is enforced: disabled students must lose access immediately, not after session expiry.

## Root Cause
Race condition between `SupabaseLogin.jsx` (checking status at login) and `ProtectedRoute.jsx` (checking status on route access). Both would react simultaneously to pending/disabled status, causing redirect loops.

## Solution
**Session flag with timestamp-based staleness check** to coordinate between components:

1. **SupabaseLogin** sets `sessionStorage.auth_rejecting = {timestamp}` before calling `signOut()`
2. **ProtectedRoute** checks this flag with staleness validation (5-second timeout)
3. If flag is active and fresh, ProtectedRoute skips its redirect
4. If flag is stale (>5 seconds) or invalid, it's cleared and status check proceeds
5. Both components maintain their status checks for security

### Why Both Checks Are Required

| Component | Check Type | Purpose |
|-----------|------------|---------|
| SupabaseLogin | Login-time | Prevent initial login by pending/disabled accounts |
| ProtectedRoute | Route-level | **Req 7.15: Immediate mid-session revocation** |

## Implementation

### ProtectedRoute.jsx
```javascript
// Check flag with staleness validation
const rejectingData = sessionStorage.getItem('auth_rejecting');
let isLoginRejecting = false;

if (rejectingData) {
  try {
    const { timestamp } = JSON.parse(rejectingData);
    const age = Date.now() - timestamp;
    
    if (age < 5000) { // Valid for 5 seconds only
      isLoginRejecting = true;
    } else {
      sessionStorage.removeItem('auth_rejecting'); // Clear stale
    }
  } catch (e) {
    sessionStorage.removeItem('auth_rejecting'); // Clear invalid
  }
}

if (!isLoginRejecting && profile?.status !== 'approved') {
  toast.error(/* ... */);
  return <Navigate to="/login" replace />;
}
```

### SupabaseLogin.jsx
```javascript
if (profile.status === 'pending') {
  sessionStorage.setItem('auth_rejecting', JSON.stringify({ timestamp: Date.now() }));
  toast.error(/* big notification */);
  await supabase.auth.signOut();
  sessionStorage.removeItem('auth_rejecting');
  return;
}
```

## Staleness Protection
- Flag includes timestamp
- ProtectedRoute validates age < 5 seconds
- Stale or invalid flags automatically cleared
- Prevents stuck flags from creating security gaps if:
  - signOut() fails/hangs
  - User closes tab before completion
  - Any other interruption occurs

## Testing

### Test A: Pending Account Login
1. Set user status to 'pending' in Supabase
2. Attempt login
3. **Expected:** Big red error notification, user stays on login page, no redirect loop

### Test B: Mid-Session Disable (Req 7.15)
1. Login as approved student
2. While logged in, run SQL: `UPDATE profiles SET status = 'disabled' WHERE email = '...'`
3. Without logout/refresh, click any protected route
4. **Expected:** Immediate redirect to login with error (within seconds)

## Files Modified
- `src/components/auth/ProtectedRoute.jsx` - Added timestamp-based staleness check
- `src/pages/SupabaseLogin.jsx` - Store timestamp with flag

## Security Benefits
✅ Req 7.15 enforced: Mid-session disables take effect immediately  
✅ No redirect loops during login rejection  
✅ No stuck flags: Staleness check prevents bypassing status validation  
✅ Clear error notifications for users
