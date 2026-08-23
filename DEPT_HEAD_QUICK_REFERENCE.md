# Department Head Dashboard - Quick Reference

## 🗺️ Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│ DEPARTMENT HEAD PORTAL                                       │
│ General Department · John Doe                                │
└─────────────────────────────────────────────────────────────┘

Desktop Layout:                    Mobile Layout:
┌──────────┬──────────┐           ┌─────────────────────┐
│ Sidebar  │ Content  │           │ Top Tabs            │
│          │          │           ├─────────────────────┤
│ • Dash   │ [Stats]  │           │ Content Area        │
│ • Apps   │ [Table]  │           │                     │
│ • Users  │ [Place]  │           │                     │
│ • Settings│ [holder]│           │                     │
└──────────┴──────────┘           └─────────────────────┘
```

## 📍 URL Routes

| URL | Section | Content |
|-----|---------|---------|
| `/dept-head` | Dashboard | Stat cards (Total, Pending, Approved, Rejected) |
| `/dept-head/applicants` | Applicants | Pending approvals table with Approve/Reject |
| `/dept-head/users` | Users | Placeholder (Coming Soon) |
| `/dept-head/settings` | Settings | Placeholder (Coming Soon) |

## 🎯 Section Overview

### 1️⃣ Dashboard (`/dept-head`)
**Status:** Layout only (stats hardcoded to 0)

**What's There:**
- 4 stat cards in responsive grid
- Total Students (blue, Users icon)
- Pending (yellow, Clock icon)
- Approved (green, CheckCircle icon)
- Rejected (red, XCircle icon)
- Placeholder content area

**Next Phase:**
- Wire stat cards to real Supabase data
- Add recent activity feed
- Add charts/trends

---

### 2️⃣ Applicants (`/dept-head/applicants`)
**Status:** Fully functional (relocated from old page)

**What's There:**
- Pending count badge in header
- Table with: Name, Email, Registration Date
- Green "Approve" button → Updates status, shows toast, removes row
- Red "Reject" button → Confirmation dialog, updates status, shows toast, removes row
- Empty state: "No Pending Approvals" with green checkmark
- Loading spinner while fetching

**Works Exactly Like Before:**
- ✅ RLS policies enforced (dept head's department only)
- ✅ Optimistic UI (rows disappear immediately)
- ✅ Toast notifications
- ✅ Error handling

---

### 3️⃣ Users (`/dept-head/users`)
**Status:** Placeholder page

**What's There:**
- "Coming Soon" message
- Description text
- Gray Users icon

**Next Phase:**
- List all students (approved + disabled)
- Search and filter
- View/edit student details
- Disable/enable accounts
- Activity history

---

### 4️⃣ Settings (`/dept-head/settings`)
**Status:** Placeholder page

**What's There:**
- "Coming Soon" message
- Description text
- Gray Settings icon

**Next Phase:**
- Email notification preferences
- Auto-approval rules
- Department info editor
- Export options

---

## 🎨 Visual Design

### Active Tab (Selected)
- Background: Green (`bg-ids-header`)
- Text: White
- Font: Bold

### Inactive Tab (Hover)
- Background: Light gray on hover (`hover:bg-gray-100`)
- Text: Dark gray (`text-gray-700`)

### Stat Card Colors
- **Blue:** Total Students (`bg-blue-500`, `text-blue-600`, `bg-blue-50`)
- **Yellow:** Pending (`bg-yellow-500`, `text-yellow-600`, `bg-yellow-50`)
- **Green:** Approved (`bg-green-500`, `text-green-600`, `bg-green-50`)
- **Red:** Rejected (`bg-red-500`, `text-red-600`, `bg-red-50`)

---

## 🔧 Developer Notes

### File Locations
```
src/pages/dept-head/
├── DeptHeadLayout.jsx      → Shell with header + nav + <Outlet />
├── DashboardSection.jsx    → Stat cards + placeholder
├── ApplicantsSection.jsx   → Pending approvals table (relocated)
├── UsersSection.jsx        → Placeholder
└── SettingsSection.jsx     → Placeholder
```

### Route Configuration (App.tsx)
```jsx
<Route path="/dept-head" element={<DeptHeadLayout />}>
  <Route index element={<DashboardSection />} />
  <Route path="applicants" element={<ApplicantsSection />} />
  <Route path="users" element={<UsersSection />} />
  <Route path="settings" element={<SettingsSection />} />
</Route>
```

### Shared Header Data
- Fetched in `DeptHeadLayout.jsx`
- Displays department name from `departments` table
- Displays dept head name from `profile.full_name`
- Persists across all section changes

---

## ✅ Testing Shortcuts

### Quick Navigation Test
1. Login as dept_head
2. Go to `/dept-head` → See Dashboard with 4 stat cards (all 0)
3. Click "Applicants" → See pending table
4. Click "Users" → See "Coming Soon"
5. Click "Settings" → See "Coming Soon"
6. Click "Dashboard" → Back to stats

### Quick Approve/Reject Test
1. Create pending student (register or SQL)
2. Go to `/dept-head/applicants`
3. See student in table
4. Click "Approve" → Toast + row disappears
5. Check Supabase → status = 'approved'

---

## 🚀 What Changed from Old Structure

| Old | New |
|-----|-----|
| Single monolithic page | 5 modular components |
| No URL routing | 4 distinct URLs |
| No navigation UI | Sidebar + top tabs |
| Hardcoded layout | Responsive (desktop/mobile) |
| Hard to extend | Easy to add sections |

---

## 📊 Data Flow (Applicants Section)

```
User clicks "Approve"
    ↓
handleApprove(studentId, studentName)
    ↓
UPDATE profiles SET status='approved' WHERE id=studentId
    ↓
toast.success("Student approved!")
    ↓
setPendingStudents(prev => prev.filter(...))
    ↓
Row disappears from table
```

---

## 🎯 Next Development Priorities

### Phase 1: Wire Dashboard Stats (High Priority)
```sql
-- Total students query
SELECT COUNT(*) FROM profiles 
WHERE role='student' AND department_id=?

-- Pending query
SELECT COUNT(*) FROM profiles 
WHERE role='student' AND status='pending' AND department_id=?

-- Approved query
SELECT COUNT(*) FROM profiles 
WHERE role='student' AND status='approved' AND department_id=?

-- Rejected query
SELECT COUNT(*) FROM profiles 
WHERE role='student' AND status='rejected' AND department_id=?
```

### Phase 2: Build Users Section (Medium Priority)
- Fetch all students (not just pending)
- Add search bar
- Add status filter dropdown
- Add "View Details" button per row
- Add "Disable Account" action

### Phase 3: Build Settings Section (Low Priority)
- Email notification toggles
- Department name editor
- Export CSV/PDF buttons

---

## 🐛 Common Issues & Fixes

### "Access Denied" when accessing /dept-head
**Fix:** Verify dept head profile has `role='dept_head'` and `status='approved'`

### Sidebar doesn't show on mobile
**Expected behavior:** Sidebar auto-collapses to top tabs on screens < 768px

### Stats show 0 even with students in database
**Expected behavior:** Stats are hardcoded to 0 in this phase (layout only)

### Applicants section is empty but there are pending students
**Check:**
1. Student's `department_id` matches dept head's `department_id`
2. Student's `status` is `'pending'`
3. Student's `role` is `'student'`

---

## 📖 Documentation Index

- **This File:** Quick reference and navigation map
- **DEPT_HEAD_RESTRUCTURE_SUMMARY.md:** Complete technical details
- **DEPT_HEAD_DASHBOARD_SETUP.md:** Original setup guide (still valid for Applicants section)
- **PHASE_C_COMPLETION_SUMMARY.md:** Phase C implementation details

---

**Last Updated:** 2026-08-13  
**Current Phase:** Layout complete, ready for data wiring  
**Build Status:** ✅ Passing
