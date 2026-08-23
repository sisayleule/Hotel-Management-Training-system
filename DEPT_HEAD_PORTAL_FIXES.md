# Department Head Portal - Critical Fixes Applied

## Date: August 14, 2026

## Issues Identified

### 1. Database Column Error ❌
**Error**: `column profiles.student_id does not exist`

**Cause**: The migration file `migrations/add_student_id_to_profiles.sql` exists but hasn't been run on the Supabase database.

**Fix Applied**: 
- Removed `student_id` from the `UsersSection.jsx` query to prevent the error
- The student_id column is optional for now and can be added later

### 2. WebSocket Connection Failures ⚠️
**Error**: Multiple `WebSocket connection to 'ws://localhost:3003/' failed`

**Cause**: Supabase Realtime is trying to connect but the connection is being rejected or the session is invalid.

**Impact**: Non-critical - The app will work without realtime features, but you'll see console errors.

### 3. Auth Session Issues 🔐
**Error**: `[AuthContext] Auth event: SIGNED_IN`

**Status**: Session appears to be working, but needs verification.

---

## Required Actions

### Step 1: Run Database Migrations ✅

You need to run the pending migration on your Supabase database:

1. Go to your Supabase Dashboard: https://ypsqmhnndmboevninipn.supabase.co
2. Navigate to **SQL Editor**
3. Run this migration:

```sql
-- Add student_id column to profiles table
-- This allows students to register with their university student ID

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);

-- Add comment
COMMENT ON COLUMN profiles.student_id IS 'University student ID number for student accounts';
```

### Step 2: Fix WebSocket Connection (Optional)

The WebSocket errors are likely due to:
- Invalid or expired auth token
- Supabase Realtime not enabled for the profiles table
- CORS issues

**To fix:**

1. **Enable Realtime on profiles table:**
   - Go to Supabase Dashboard → Database → Replication
   - Enable realtime for the `profiles` table

2. **Check Auth Session:**
   - Clear browser cache and cookies
   - Log out and log back in
   - Check if the session persists

3. **Alternative: Disable Realtime (if not needed):**

Update `src/lib/supabaseClient.js`:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  realtime: {
    enabled: false, // Disable realtime to prevent connection errors
  },
});
```

### Step 3: Verify Auth Context

Check that your auth session is valid:

1. Open DevTools → Application → Local Storage
2. Look for `sb-ypsqmhnndmboevninipn-auth-token`
3. If empty or expired, log in again

---

## Changes Made to Code

### File: `src/pages/dept-head/UsersSection.jsx`

**Before:**
```javascript
.select(`
  id,
  full_name,
  email,
  student_id,  // ❌ This column doesn't exist
  status,
  created_at,
  rejected_reason,
  banned_reason
`)
```

**After:**
```javascript
.select(`
  id,
  full_name,
  email,
  // student_id removed until migration is run
  status,
  created_at,
  rejected_reason,
  banned_reason
`)
```

---

## Testing Checklist

After applying the fixes:

- [ ] Navigate to `/dept-head/users` 
- [ ] Verify "No Students Yet" appears (if no students registered)
- [ ] No console errors about `student_id` column
- [ ] Can search and filter students
- [ ] Ban/Unban/Delete actions work correctly
- [ ] Check for WebSocket errors (should be reduced or gone)

---

## Next Steps

1. **Run the migration** to add the `student_id` column
2. **Re-enable student_id in the query** once the migration is complete
3. **Test the User Management section** thoroughly
4. Consider adding the `student_id` field to the registration form if needed

---

## Additional Notes

- The current fix is a **temporary workaround** to unblock development
- The `student_id` column is defined in the migration but not yet in the database
- Once the migration runs, you can re-add `student_id` to the query
- WebSocket errors don't break functionality but are noisy in the console

---

## Support

If issues persist:
1. Check Supabase logs: Dashboard → Logs
2. Verify RLS policies: Dashboard → Database → Policies
3. Check auth.users table has correct role assignments
4. Verify department_id is set on dept_head profiles
