# 🚀 Quick Start: Dashboard Data Wiring

## 1️⃣ Run SQL Migration (2 minutes)

Copy the entire contents of `migrations/create_approval_log_table.sql` and run it in Supabase SQL Editor.

**Or use this shortened version:**

```sql
-- Create table
CREATE TABLE IF NOT EXISTS approval_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'disabled')),
  reason TEXT,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approval_log_student ON approval_log(student_id);
CREATE INDEX IF NOT EXISTS idx_approval_log_actor ON approval_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_approval_log_created ON approval_log(created_at DESC);

-- Enable RLS
ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (assumes helper functions exist)
CREATE POLICY "Dept heads can view approval logs"
  ON approval_log FOR SELECT
  USING (
    get_my_role() = 'dept_head'
    AND student_id IN (
      SELECT id FROM profiles 
      WHERE department_id = get_my_department() 
      AND role = 'student'
    )
  );

CREATE POLICY "Dept heads can insert approval logs"
  ON approval_log FOR INSERT
  WITH CHECK (
    get_my_role() = 'dept_head'
    AND actor_id = auth.uid()
    AND student_id IN (
      SELECT id FROM profiles 
      WHERE department_id = get_my_department() 
      AND role = 'student'
    )
  );
```

✅ **Verify:** Run `SELECT * FROM approval_log;` (should return empty table, no errors)

---

## 2️⃣ Test Dashboard with Real Data (3 minutes)

### Test Scenario: No Students

1. Login as dept_head
2. Navigate to `/dept-head`
3. **Expected:**
   - Total Students: `0`
   - Pending: `0`
   - Approved: `0`
   - Rejected: `0`
   - Recent Activity: "No recent activity"

### Test Scenario: With Students

1. **Create 3 test students** (use registration form or SQL):
   - 1 pending student
   - 1 approved student
   - 1 rejected student
   - All in same department as dept_head

2. **Refresh `/dept-head`**

3. **Expected:**
   - Total Students: `3`
   - Pending: `1`
   - Approved: `1`
   - Rejected: `1`
   - Recent Activity: Still empty (Phase 3 will populate this)

---

## 3️⃣ Test Recent Activity Feed (Optional - 1 minute)

Manually insert a test log entry:

```sql
-- Replace UUIDs with actual student_id and dept_head's id
INSERT INTO approval_log (student_id, action, actor_id)
VALUES (
  'your-student-uuid',
  'approved',
  'your-dept-head-uuid'
);
```

Refresh `/dept-head` → Recent Activity should show the entry!

---

## 4️⃣ Test Department Isolation (Security - 2 minutes)

1. **Create 2 departments** (if not already exist)
2. **Create 2 dept heads** (one per department)
3. **Create students** in each department
4. **Login as Dept Head A** → should ONLY see Department A stats
5. **Login as Dept Head B** → should ONLY see Department B stats

✅ **Pass:** Stats are isolated by department (RLS working)

---

## 🎯 What's Working Now

### Dashboard (`/dept-head`)
- ✅ Stat cards show real counts from Supabase
- ✅ Scoped to dept head's department only
- ✅ Updates automatically on page refresh
- ✅ Recent activity feed displays logs (empty until Phase 3)
- ✅ Loading state while fetching data
- ✅ Empty state when no activity

### Applicants (`/dept-head/applicants`)
- ✅ Still works exactly as before
- ⏳ Does NOT write to approval_log yet (Phase 3)

---

## 🐛 Common Issues

### "relation 'approval_log' does not exist"
**Fix:** Run the SQL migration above

### "function get_my_role() does not exist"
**Fix:** Run the full schema from `.kiro/specs/auth-registration/schema.sql`

### Stats show 0 but students exist
**Check:**
1. Student's `department_id` matches dept head's `department_id`
2. Student's `role` is `'student'`
3. Refresh the page (no auto-reload yet)

### Recent Activity shows nothing
**Expected:** Table is empty until Phase 3 implements logging

---

## 📊 Data Queries (Reference)

**Total Students:**
```javascript
WHERE role='student' AND department_id=?
```

**Pending:**
```javascript
WHERE role='student' AND status='pending' AND department_id=?
```

**Approved:**
```javascript
WHERE role='student' AND status='approved' AND department_id=?
```

**Rejected:**
```javascript
WHERE role='student' AND status='rejected' AND department_id=?
```

**Recent Activity:**
```javascript
SELECT * FROM approval_log
ORDER BY created_at DESC
LIMIT 5
-- RLS filters to dept head's department automatically
```

---

## 🚀 Next Phase Preview

**Phase 3 will add:**
- Write to `approval_log` when approving/rejecting in Applicants section
- Optional: Real-time dashboard updates (Supabase Realtime)
- Optional: Add "reason" field to rejection dialog
- Optional: Add "disable" action in Users section

---

## ✅ Done!

Your dashboard now displays live data! 🎉

**Test it:**
1. Create/modify students → see stats update
2. Check different departments → see isolation working
3. Add log entries → see activity feed populate

**Ready for Phase 3:** Wire Applicants section to log actions!
