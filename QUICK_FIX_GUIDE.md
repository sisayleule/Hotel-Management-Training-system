# 🚨 Quick Fix Guide - Department Head Portal Errors

## What's Wrong?

Your Department Head Portal (`/dept-head/users`) is showing these errors:

1. ❌ **"column profiles.student_id does not exist"** - Database query failing
2. ⚠️ **WebSocket connection failures** - Multiple connection attempts to localhost:3003 failing
3. ℹ️ **"Error fetching students"** - Query can't complete due to missing column

## What Causes This?

- **Missing Database Column**: The code expects a `student_id` column that doesn't exist in your Supabase database
- **Migration Not Run**: The migration file exists (`migrations/add_student_id_to_profiles.sql`) but hasn't been applied to the database
- **WebSocket Issues**: Supabase Realtime is trying to connect but failing (this is secondary)

---

## ✅ The Fix (2 Steps)

### Step 1: Apply Code Fix (Already Done!)

I've already updated `src/pages/dept-head/UsersSection.jsx` to remove the `student_id` column from the query. This will stop the immediate error.

**Result**: Your Users page should now load without the "column does not exist" error.

### Step 2: Run Database Migration (Required for Full Functionality)

To add the `student_id` column to your database:

**Option A: Quick Fix (Recommended)**

1. Open Supabase Dashboard: https://ypsqmhnndmboevninipn.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this:

```sql
-- Add student_id column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
```

5. Click **Run** or press `Ctrl+Enter`
6. Verify success (should say "Success. No rows returned")

**Option B: Full Fix (Recommended if WebSocket errors persist)**

Run the complete migration I created:

1. Open `migrations/fix_realtime_setup.sql` (I just created this)
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Run it

This will:
- Add the `student_id` column
- Fix RLS policies
- Configure realtime properly
- Include verification queries

---

## 🧪 Testing

After running the migration:

1. **Refresh the browser** (`Ctrl+R` or `F5`)
2. Navigate to `/dept-head/users`
3. Check the console - errors should be gone
4. Try the following:
   - Search for students
   - Filter by status
   - Ban/Unban actions
   - Delete action

Expected result: Everything works smoothly, no console errors!

---

## 🔍 Verification

### Check if Migration Worked:

In Supabase SQL Editor, run:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'student_id';
```

✅ Success: Returns one row with `student_id | character varying`
❌ Failed: Returns no rows

### Check Console:

Open DevTools (F12) → Console tab

✅ Success: No red errors about `student_id` or `column profiles.student_id does not exist`
⚠️ Partial: May still see WebSocket errors (these are low priority and don't break functionality)

---

## 🎯 Priority Fixes

| Issue | Priority | Status | Action |
|-------|----------|--------|--------|
| Missing `student_id` column | 🔴 CRITICAL | ✅ Fixed in code | Run migration to complete |
| WebSocket errors | 🟡 MEDIUM | Pending | Run `fix_realtime_setup.sql` |
| Auth session warnings | 🟢 LOW | Monitor | Clear cache if persists |

---

## 📋 After Migration Checklist

Once you run the migration:

- [ ] No console errors about `student_id`
- [ ] Users page loads successfully
- [ ] Can view student list
- [ ] Search and filter work
- [ ] Ban/Unban buttons function correctly
- [ ] Delete button works
- [ ] Modals open and close properly
- [ ] Toast notifications appear

---

## 🆘 If Issues Persist

### Students Not Showing Up?

**Check:**
1. Are there any students registered in the system?
2. Do they have `role = 'student'` in the profiles table?
3. Do they have the correct `department_id` matching your dept_head profile?

**Verify in SQL Editor:**
```sql
-- Check current user's department
SELECT id, full_name, auth_role, department_id 
FROM profiles 
WHERE id = auth.uid();

-- Check students in your department
SELECT id, full_name, email, role, department_id, status
FROM profiles
WHERE role = 'student' 
  AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  AND status != 'deleted';
```

### Still Getting Errors?

1. **Check Supabase Logs**: Dashboard → Logs → API/Database logs
2. **Verify RLS Policies**: Dashboard → Database → Policies → profiles table
3. **Check Auth Token**: DevTools → Application → Local Storage → Look for `sb-*-auth-token`
4. **Clear Cache**: Log out, clear browser cache, log back in

---

## 📞 Need More Help?

See `DEPT_HEAD_PORTAL_FIXES.md` for detailed technical explanation and additional troubleshooting steps.
