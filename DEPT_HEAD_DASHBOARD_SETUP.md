# Department Head Dashboard - Setup & Testing Guide

## ✅ Implementation Complete

### Files Created/Modified:
1. **src/pages/DeptHeadDashboard.jsx** - New page for dept heads to approve/reject pending students
2. **src/App.tsx** - Added `/dept-head` protected route
3. **src/pages/Register.jsx** - Now stores email in profiles table
4. **.kiro/specs/auth-registration/schema.sql** - Added `email TEXT` column to profiles

---

## 🔧 Required Database Setup

### Step 1: Add Email Column to Profiles Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add email column to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
```

### Step 2: Backfill Existing Profiles (Optional)

If you have existing user profiles without emails, you can backfill them manually:

```sql
-- Example: Update specific user's email
UPDATE profiles 
SET email = 'user@example.com' 
WHERE id = 'user-uuid-here';
```

---

## 🧪 Testing Instructions

### Test Case 1: Create Department Head Account

**Option A: Using Supabase Dashboard**

1. Go to Supabase Dashboard → Authentication → Users → "Add User"
2. Create a new user with email: `depthead@test.com`, password: `Test1234!`
3. Copy the User ID from the users table
4. Go to Supabase Dashboard → SQL Editor
5. Run this SQL:

```sql
-- Insert department head profile
INSERT INTO profiles (id, full_name, email, role, status, department_id)
VALUES (
  '656770c5-f89b-43ff-af50-8b09d21066e1',
  'Test Department Head',
  'depthead@test.com',
  'dept_head',
  'approved',
  (SELECT id FROM departments WHERE name = 'General' LIMIT 1)
);
```

**Option B: Using SQL Only**

If you have access to service role key, you can use an Edge Function or manual SQL to create both auth user and profile in one go.

---

### Test Case 2: Create Pending Student Account

**Option A: Use Registration Page** (Recommended)

1. Open app at `/register`
2. Fill in:
   - Full Name: `Test Student`
   - Email: `student@test.com`
   - Password: `Student123!`
   - Department: Select `General` (or same department as dept head)
3. Click "Register Account"
4. You should see: "Registration successful! Please wait for approval."

**Option B: Manual SQL**

```sql
-- First create auth user in Supabase Dashboard → Authentication → Users
-- Then insert profile:
INSERT INTO profiles (id, full_name, email, role, status, department_id)
VALUES (
  'paste-student-user-id-here',
  'Test Student',
  'student@test.com',
  'student',
  'pending',
  (SELECT id FROM departments WHERE name = 'General' LIMIT 1)
);
```

---

### Test Case 3: Test Department Head Dashboard

1. **Login as Department Head**
   - Navigate to `/login`
   - Email: `depthead@test.com`
   - Password: `Test1234!`
   - Should redirect to `/dashboard`

2. **Navigate to Dept Head Dashboard**
   - Manually navigate to `/dept-head` in browser
   - You should see the "Department Head Dashboard" page
   - The pending student should appear in the table with:
     - Full Name: Test Student
     - Email: student@test.com
     - Registration date/time
     - Department: General

3. **Test Approve Function**
   - Click the green "Approve" button for the pending student
   - You should see: "Test Student has been approved!" toast
   - The row should disappear from the table
   - Check Supabase profiles table - student status should be `'approved'`

4. **Test Empty State**
   - After approving all students, you should see:
     - Green checkmark icon
     - "No Pending Approvals" heading
     - "All student registrations in your department have been processed."

---

### Test Case 4: Test Reject Function

1. Create another pending student (repeat Test Case 2 with different email)
2. Login as dept head and go to `/dept-head`
3. Click the red "Reject" button
4. Confirm the browser confirmation dialog
5. You should see: "Test Student's registration has been rejected" toast
6. Row should disappear
7. Check Supabase - student status should be `'rejected'` (not deleted)

---

### Test Case 5: Test Approved Student Login

1. **Logout from dept head account**
2. **Login as approved student**
   - Email: `student@test.com`
   - Password: `Student123!`
   - Should successfully redirect to `/dashboard`
   - Should see the main PMS interface

---

### Test Case 6: Test Rejected Student Login

1. Login with a rejected student account
2. Should see error toast: "Your account has been rejected. Contact administration."
3. Should be signed out and stay on login page
4. Toast should display for 8 seconds

---

### Test Case 7: Test Role Protection

1. **As a student user**, try to manually navigate to `/dept-head`
2. Should see "Access Denied" message
3. Should NOT see department head dashboard

---

## 🔐 RLS Verification

The following RLS policies ensure data security:

```sql
-- Dept Heads can view profiles in their department + own profile
DROP POLICY IF EXISTS "Dept Heads can view department profiles" ON profiles;
CREATE POLICY "Dept Heads can view department profiles"
  ON profiles FOR SELECT
  USING (
    (get_my_role() = 'dept_head' AND department_id = get_my_department())
    OR auth.uid() = id
  );

-- Dept Heads can update students in their department (approve/disable)
DROP POLICY IF EXISTS "Dept Heads can update department profiles" ON profiles;
CREATE POLICY "Dept Heads can update department profiles"
  ON profiles FOR UPDATE
  USING (
    get_my_role() = 'dept_head'
    AND department_id = get_my_department()
    AND role = 'student' -- Can only modify Students
  )
  WITH CHECK (
    role = 'student' -- Cannot elevate to Dept Head/Admin
    AND department_id = get_my_department() -- Cannot reassign to other dept
  );
```

**What This Means:**
- Dept heads can ONLY see students in their OWN department
- Dept heads can ONLY approve/reject students (cannot modify dept_head or admin accounts)
- Dept heads CANNOT reassign students to other departments
- Students cannot see other students' profiles

---

## 📊 Expected Data Flow

```
1. Student registers → profiles.status = 'pending'
   ↓
2. Student tries to login → blocked with error message
   ↓
3. Dept head logs in → navigates to /dept-head
   ↓
4. Dept head sees pending student → clicks "Approve"
   ↓
5. profiles.status updated to 'approved'
   ↓
6. Student can now login successfully → redirects to /dashboard
```

---

## 🚨 Troubleshooting

### Issue: Email column doesn't exist
**Solution:** Run the ALTER TABLE command in Step 1

### Issue: Dept head sees no pending students
**Check:**
1. Student's `department_id` matches dept head's `department_id`
2. Student's `status` is `'pending'`
3. Student's `role` is `'student'`

### Issue: Approve button doesn't work
**Check:**
1. Browser console for errors
2. Supabase logs for RLS policy violations
3. Verify dept head's profile has `role='dept_head'` and `status='approved'`

### Issue: "Access Denied" when dept head visits /dept-head
**Check:**
1. Dept head profile has `role='dept_head'`
2. Dept head profile has `status='approved'`
3. RBACProtectedRoute is checking `requireRole="dept_head"`

---

## 📝 Notes

- **Email Storage**: Email is now stored in both `auth.users.email` (managed by Supabase Auth) and `profiles.email` (for easy querying with RLS)
- **No Deletion**: Rejected students are marked as `status='rejected'`, not deleted (audit trail)
- **Optimistic UI**: Approved/rejected students disappear from list immediately (no page refresh needed)
- **Toast Duration**: All toasts display for default duration (no special handling needed)
- **Department Isolation**: RLS ensures complete department-level data isolation

---

## ✨ Features Implemented

✅ Protected route at `/dept-head` requiring `role='dept_head'`  
✅ Displays pending students in dept head's department only  
✅ Shows: Full Name, Email, Registration Date, Department Name  
✅ Approve button updates status to `'approved'`  
✅ Reject button updates status to `'rejected'` with confirmation  
✅ Success toasts for all actions  
✅ Optimistic UI removes rows immediately  
✅ Empty state with icon and message  
✅ RLS policies enforce department-level security  
✅ No modifications to existing login/toast flow  
✅ Follows project conventions (JavaScript, Tailwind, Supabase RLS)

---

## 🎯 Ready to Test!

Once you've run the SQL migration in Step 1, follow Test Cases 1-7 to verify everything works correctly.
