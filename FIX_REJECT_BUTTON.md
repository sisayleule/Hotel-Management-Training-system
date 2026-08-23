# Fix: Reject Button Not Working

## 🐛 Issue

**Error:** `invalid input value for enum user_status: "rejected"`

**Cause:** The `user_status` enum in Supabase only has `('pending', 'approved', 'disabled')` but is missing `'rejected'`.

---

## ✅ Solution

Run this SQL in Supabase SQL Editor:

```sql
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'rejected';
```

That's it! This adds 'rejected' to the existing enum.

---

## 🧪 Test After Fix

1. Refresh your browser (to clear the error state)
2. Login as dept_head → `/dept-head/applicants`
3. Click red "Reject" button
4. Enter reason (min 3 chars)
5. Click "Confirm Rejection"
6. **Expected:** ✅ Success! Row disappears, toast shows "Student rejected"

---

## 📊 Verify Enum Values

After running the migration, verify:

```sql
SELECT enumlabel AS status_value
FROM pg_enum
WHERE enumtypid = 'user_status'::regtype
ORDER BY enumsortorder;
```

**Expected result:**
```
pending
approved
rejected   ← Should be present now
disabled
```

---

## 🔍 Why This Happened

The original schema from earlier phases only defined:
```sql
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'disabled');
```

Phase 3 added the reject functionality but forgot to update the enum in your existing Supabase database.

---

## ✅ After This Fix

All four status values will work:
- ✅ `pending` - Initial state after registration
- ✅ `approved` - Approved by dept head
- ✅ `rejected` - Rejected by dept head ← **Now works!**
- ✅ `disabled` - Disabled account (future use)

---

**Migration File:** `migrations/add_rejected_to_user_status_enum.sql`
