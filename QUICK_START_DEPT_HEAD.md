# 🚀 Quick Start: Department Head Dashboard

## 1️⃣ Run SQL Migration (30 seconds)

Go to Supabase Dashboard → SQL Editor → New Query:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
```

Click "Run" ✅

---

## 2️⃣ Create Test Department Head (2 minutes)

### Step 1: Create Auth User
1. Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `depthead@test.com`
4. Password: `Test1234!`
5. Click "Create User"
6. **Copy the User ID** (you'll need it next)

### Step 2: Create Profile
Go to SQL Editor and run:

```sql
INSERT INTO profiles (id, full_name, email, role, status, department_id)
VALUES (
  'PASTE-USER-ID-HERE',  -- Replace with copied User ID
  'Test Department Head',
  'depthead@test.com',
  'dept_head',
  'approved',
  (SELECT id FROM departments WHERE name = 'General' LIMIT 1)
);
```

---

## 3️⃣ Create Test Pending Student (1 minute)

### Option A: Use Registration Form (Easiest)
1. Open app at `/register`
2. Fill in:
   - Name: `Test Student`
   - Email: `student@test.com`
   - Password: `Student123!`
   - Department: `General`
3. Click "Register Account"
4. See success message ✅

### Option B: Manual SQL
```sql
-- First create user in Auth → Users with email: student@test.com
-- Then run:
INSERT INTO profiles (id, full_name, email, role, status, department_id)
VALUES (
  'PASTE-STUDENT-USER-ID-HERE',
  'Test Student',
  'student@test.com',
  'student',
  'pending',
  (SELECT id FROM departments WHERE name = 'General' LIMIT 1)
);
```

---

## 4️⃣ Test the Dashboard (3 minutes)

### Step 1: Login as Department Head
1. Go to `/login`
2. Email: `depthead@test.com`
3. Password: `Test1234!`
4. Should redirect to `/dashboard` ✅

### Step 2: Access Dept Head Dashboard
1. Manually navigate to `/dept-head`
2. You should see:
   - "Department Head Dashboard" header
   - "General Department" and your name
   - Pending count badge showing "1 Pending"
   - Table with Test Student's info

### Step 3: Approve the Student
1. Click green "Approve" button
2. See toast: "Test Student has been approved!" ✅
3. Row disappears from table
4. See empty state: "No Pending Approvals" with green checkmark

### Step 4: Verify Student Can Login
1. Logout from dept head
2. Login as student:
   - Email: `student@test.com`
   - Password: `Student123!`
3. Should successfully access `/dashboard` ✅

---

## 5️⃣ Test Reject Function (Optional)

1. Create another pending student (repeat Step 3)
2. Login as dept head, go to `/dept-head`
3. Click red "Reject" button
4. Confirm the dialog
5. See toast: "Test Student's registration has been rejected"
6. Row disappears
7. In Supabase, verify status is `'rejected'` (not deleted)

---

## ✅ Done!

Your Department Head Dashboard is now working! 

### What You Have:
- ✅ Protected route at `/dept-head`
- ✅ Approve/reject pending students
- ✅ Department-level security (RLS enforced)
- ✅ Email stored in profiles for easy access
- ✅ Toast notifications
- ✅ Empty state handling

### Troubleshooting

**Can't see pending students?**
- Check student's `department_id` matches dept head's `department_id`
- Check student's `status` is `'pending'`
- Check student's `role` is `'student'`

**"Access Denied" error?**
- Check dept head's `role` is `'dept_head'`
- Check dept head's `status` is `'approved'`

**Email column error?**
- Run the SQL migration from Step 1

---

## 📖 Full Documentation

See `DEPT_HEAD_DASHBOARD_SETUP.md` for:
- Complete testing checklist
- Security verification steps
- RLS policy details
- Edge case testing
- Troubleshooting guide

See `PHASE_C_COMPLETION_SUMMARY.md` for:
- Technical implementation details
- Data flow diagrams
- Build status
- Future enhancement ideas
