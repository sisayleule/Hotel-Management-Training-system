# Requirements Document: Authentication & Access Control

## Introduction

This document specifies the requirements for implementing a real authentication and access control system for the Fortune Next v6.5 Hotel Management Training PMS, replacing the current fully-open demo access with a role-based hierarchical authentication system powered by Supabase.

This feature introduces a NEW role hierarchy (Admin, Dept Head, Student) that is SEPARATE from the existing operational training roles (hotel_manager, front_office, housekeeping, waiter_fnb). The authentication system gates WHO can access the training application, while the existing role switcher continues to control WHAT training roles users can practice once inside.

**Critical Isolation Requirements**:
- This feature SHALL NOT modify existing training functionality (role switcher, hotel operations, F&B, housekeeping, etc.)
- Authenticated Students SHALL land in the existing training app unchanged
- Admin and Dept Head roles get separate dashboards (built in later phases)
- The existing demo mode MAY be preserved as a separate "guest preview" path OR replaced entirely (design decision in Phase B)

The implementation follows a phased approach (5 phases: A-E) to manage complexity and ensure proper backend setup before UI development.

---

## Glossary

### New Concepts (Authentication System)

- **Auth_Hierarchy_Role**: The authentication/access role (Admin, Dept Head, Student) — separate from training operational roles
- **Admin**: Top-level account with full system access, can create Dept Head accounts
- **Dept_Head**: Department manager account, pre-provisioned by Admin only, manages Students in their department
- **Student**: Training user account, self-registers, requires approval before login access
- **Approval_Status**: Account activation state (pending, approved, disabled)
- **Department**: Organizational grouping for Dept Heads and their Students
- **Supabase**: Backend-as-a-Service providing authentication, database, and Row-Level Security (RLS)
- **RLS_Policy**: Supabase Row-Level Security rule enforcing data access permissions at the database level
- **auth.users**: Supabase built-in authentication users table (managed by Supabase Auth)
- **profiles**: Custom table storing extended user data (role, department, status, full name)
- **Public_Registration**: Self-service Student account creation form (no invitation required)
- **Pre-Provisioned_Account**: Dept Head account created by Admin (no self-registration)

### Existing Concepts (Training System)

- **Training_Operational_Role**: The operational role being practiced (hotel_manager, front_office, housekeeping, waiter_fnb) — controlled by existing role switcher
- **Role_Switcher**: Existing training feature allowing users to practice different hotel operational roles
- **Demo_Mode**: Current fully-open access system (no login required) — to be replaced or preserved as guest preview
- **currentUser**: Existing Zustand store state for logged-in user (will be updated to use Supabase auth)
- **RBAC_System**: Existing role-based access control for training operational roles (src/config/rbac.js) — continues to work unchanged

---

## System Architecture Overview

### Two-Layer Role System

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: Auth Hierarchy                   │
│             (NEW - controls access to system)                │
│                                                              │
│  Admin ────> Dept Head ────> Student (approved) ────┐       │
│    │            │                                    │       │
│    └────────────┴────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 2: Training Roles                     │
│          (EXISTING - unchanged, controls training)           │
│                                                              │
│  hotel_manager | front_office | housekeeping | waiter_fnb   │
│  (role switcher allows practicing different roles)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Flow**:
1. User authenticates → Auth system determines if they're Admin, Dept Head, or Student
2. IF Student (approved) → Land in existing training app → Use role switcher to practice hotel_manager/front_office/etc.
3. IF Admin or Dept Head → Land in separate Admin/Dept Head dashboard (built in later phases)

### Database Schema (Supabase)

**Tables**:
- `auth.users` (Supabase built-in, managed by Supabase Auth)
- `profiles` (custom, references auth.users)
- `departments` (custom)

**Row-Level Security (RLS)**:
- Students: Can only read/update their own profile
- Dept Heads: Can read/update profiles in their own department only
- Admins: Can read/update everything

---

## Requirements

### Requirement 1: Supabase Backend Setup (Phase A)

**User Story:** As a system administrator, I want the application to use Supabase for authentication and data storage, so that user accounts are securely managed with industry-standard auth practices.

#### Acceptance Criteria

1. THE developer SHALL request Supabase Project URL and anon key from the reviewer BEFORE proceeding
2. THE reviewer SHALL create a new Supabase project at supabase.com and provide credentials
3. THE developer SHALL install @supabase/supabase-js package via npm
4. THE developer SHALL create a Supabase client configuration file at src/lib/supabaseClient.js
5. THE Supabase client SHALL be initialized with project URL and anon key from environment variables
6. THE environment variables SHALL be stored in .env.local file (or .env if .env.local not supported)
7. THE .env.local file SHALL be added to .gitignore IF not already present
8. THE developer SHALL verify .gitignore contains .env* pattern to prevent credential commits
9. THE Supabase client configuration SHALL export a single initialized client instance
10. THE Supabase client SHALL be ready for use in React components and utility functions

**Environment Variables**:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Client Configuration Example**:
```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Notes**:
- Phase A is backend setup only, NO UI development
- Supabase project creation is done by reviewer, not developer
- SQL schema execution is done by reviewer in Supabase SQL editor


### Requirement 2: Database Schema Design (Phase A)

**User Story:** As a database administrator, I want a properly normalized schema with Row-Level Security policies, so that user data is secured at the database level.

#### Acceptance Criteria

1. THE developer SHALL design SQL schema for three tables: profiles, departments
2. THE schema SHALL be provided as executable SQL (not code comments or pseudocode)
3. THE SQL SHALL be formatted for execution in Supabase SQL editor
4. THE schema SHALL use Supabase best practices (RLS, policies, triggers where appropriate)

#### 2.1 Departments Table

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  dept_head_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Seed one department for Phase B registration testing
-- Admin can rename/add more departments via Admin dashboard in Phase C
INSERT INTO departments (name) VALUES ('General');

-- Policies (defined after profiles table)
```

**Columns**:
- `id`: UUID primary key, auto-generated
- `name`: Department name (e.g., "Housekeeping", "Front Desk", "Food & Beverage"), unique
- `dept_head_id`: References profiles table, nullable (department may not have assigned Dept Head yet)
- `created_at`: Timestamp of department creation
- `updated_at`: Timestamp of last update

**Seed Data**:
- One department row ("General") seeded in Phase A to enable Phase B registration testing
- Admin can rename or add more departments in Phase C via Admin dashboard

**Constraints**:
- Name must be unique (enforced at database level)
- dept_head_id must reference a profile with role='dept_head' (enforced at application level or via trigger)

#### 2.2 Profiles Table

```sql
CREATE TYPE user_role AS ENUM ('admin', 'dept_head', 'student');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'disabled');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_dept_head_has_department 
    CHECK (role != 'dept_head' OR department_id IS NOT NULL),
  CONSTRAINT check_admin_no_department
    CHECK (role != 'admin' OR department_id IS NULL)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
```

**Columns**:
- `id`: UUID primary key, references auth.users(id) from Supabase Auth (one-to-one relationship)
- `full_name`: User's full name as provided during registration
- `role`: Enum ('admin' | 'dept_head' | 'student'), default 'student'
- `department_id`: References departments table, nullable for admin, required for dept_head
- `status`: Enum ('pending' | 'approved' | 'disabled'), default 'pending'
- `created_at`: Timestamp of profile creation
- `updated_at`: Timestamp of last profile update

**Constraints**:
- Dept Heads MUST have a department_id (cannot be null)
- Admins MUST NOT have a department_id (must be null)
- Students MAY have department_id (nullable, assigned by Dept Head or Admin)

**Cascading Deletes**:
- IF auth.users row is deleted (account deletion), profiles row is CASCADE deleted
- IF department is deleted, profiles.department_id is SET NULL

#### 2.3 RLS Helper Functions (Prevent Recursion)

**Critical**: Policies that query the profiles table to check the current user's role/department will cause infinite recursion errors. These SECURITY DEFINER helper functions bypass RLS to safely look up the current user's data.

```sql
-- Helper function: Get current user's role (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: Get current user's department (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION get_my_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Notes**:
- SECURITY DEFINER runs with the privileges of the function creator (bypasses RLS)
- STABLE tells Postgres the function won't modify data and can be optimized
- These functions are called by RLS policies to avoid self-referencing subqueries

#### 2.4 Row-Level Security Policies

**Students** (can only read/update their own profile):
```sql
-- Students can view their own profile
CREATE POLICY "Students can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Students can update their own profile (limited fields only)
CREATE POLICY "Students can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = 'student' -- Cannot change role
    AND status = (SELECT status FROM profiles WHERE id = auth.uid()) -- Cannot change status
    AND department_id = get_my_department() -- Cannot change department
  );
```

**Dept Heads** (can read/update profiles in their department):
```sql
-- Dept Heads can view profiles in their department
CREATE POLICY "Dept Heads can view department profiles"
  ON profiles FOR SELECT
  USING (
    (get_my_role() = 'dept_head' AND department_id = get_my_department())
    OR auth.uid() = id -- Can also view own profile
  );

-- Dept Heads can update profiles in their department (approve/disable Students)
CREATE POLICY "Dept Heads can update department profiles"
  ON profiles FOR UPDATE
  USING (
    get_my_role() = 'dept_head'
    AND department_id = get_my_department()
    AND role = 'student' -- Can only modify Students, not other Dept Heads or Admins
  )
  WITH CHECK (
    role = 'student' -- Cannot elevate Students to Dept Head or Admin
    AND department_id = get_my_department() -- Cannot move Students to other departments
  );
```

**Admins** (can read/update everything):
```sql
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_my_role() = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'admin');

-- Admins can insert new profiles (for creating Dept Head accounts)
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Admins can delete profiles (cleanup invalid accounts)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (get_my_role() = 'admin');
```

**Departments Table RLS**:
```sql
-- All authenticated users can view departments (for dropdown selection during registration)
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only Admins can create/update/delete departments
CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  USING (get_my_role() = 'admin');
```

#### 2.5 Database Triggers and Functions

**Auto-update updated_at timestamp**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Design Decision: Profile Creation Method**

**CHOSEN APPROACH**: Explicit application code (NOT database trigger)

**Rationale**:
- Clearer error handling: Application can catch Supabase errors and show user-friendly messages
- More control: Application can set department_id during registration form submission
- Easier debugging: Profile creation logic visible in application code, not hidden in database
- Flexibility: Can add validation or additional fields in future without SQL migration

**Implementation**: After successful Supabase `signUp()`, the application will explicitly create a profiles record via Supabase client insert.

**Database trigger approach** (NOT USED, included here for reference only):
```sql
-- THIS TRIGGER IS NOT PART OF THE SCHEMA - DO NOT EXECUTE
-- Kept as reference for alternative approach

-- CREATE OR REPLACE FUNCTION handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO profiles (id, full_name, role, status)
--   VALUES (
--     NEW.id,
--     COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
--     'student',
--     'pending'
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- 
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();
```

#### Acceptance Criteria (continued)

5. THE profiles table SHALL reference auth.users(id) as primary key (one-to-one relationship)
6. THE profiles table SHALL have columns: id, full_name, role, department_id, status, created_at, updated_at
7. THE role column SHALL be ENUM type with values: 'admin', 'dept_head', 'student'
8. THE status column SHALL be ENUM type with values: 'pending', 'approved', 'disabled'
9. THE departments table SHALL have columns: id, name, dept_head_id, created_at, updated_at
10. THE schema SHALL enforce: Dept Heads MUST have department_id, Admins MUST NOT have department_id
11. THE schema SHALL have RLS helper functions: get_my_role() and get_my_department() (SECURITY DEFINER)
12. THE schema SHALL have RLS policies using helper functions (NO self-referencing subqueries)
13. THE schema SHALL have indexes on profiles(department_id), profiles(role), profiles(status)
14. THE schema SHALL have triggers to auto-update updated_at timestamps
15. THE SQL SHALL be executable in Supabase SQL editor without errors
16. THE developer SHALL provide the SQL as a single executable file or code block for the reviewer to run


### Requirement 3: Student Self-Registration Flow (Phase B)

**User Story:** As a prospective student, I want to register for a training account, so that I can access the hotel management PMS training application once approved.

#### Acceptance Criteria

1. THE application SHALL have a public registration page at route /register
2. THE registration page SHALL NOT require authentication to access
3. THE registration form SHALL collect: full_name (required), email (required, validated), password (required, min 8 chars), department_id (required, dropdown)
4. THE department dropdown SHALL fetch departments from Supabase departments table
5. THE password field SHALL be type="password" (masked input)
6. THE email field SHALL validate email format client-side
7. WHEN user submits registration form, THE system SHALL call Supabase Auth signUp()
8. THE signUp() call SHALL create auth.users record with email/password
9. AFTER successful signUp(), THE system SHALL create a profiles record with:
   - id: auth.users.id (from signup response)
   - full_name: from registration form
   - role: 'student' (hardcoded)
   - department_id: selected department from dropdown
   - status: 'pending' (hardcoded)
10. THE profile creation SHALL be done via application code (explicit Supabase insert), NOT database trigger
11. IF signUp() fails (duplicate email, invalid email), THE system SHALL display error message from Supabase
12. IF profile creation fails, THE system SHALL display error: "Registration failed. Please try again."
13. AFTER successful registration, THE system SHALL show confirmation message: "Registration submitted. Your account is pending approval. You will be contacted once reviewed."
14. AFTER confirmation, THE system SHALL redirect to login page (/login)
15. THE Student account SHALL NOT be able to log in until status is changed to 'approved' by Dept Head or Admin
16. THE registration form SHALL have a "Already have an account? Log in" link to /login
17. THE registration page SHALL use consistent styling with existing app (no random design choices)

**Form Fields**:
- Full Name (text input, required)
- Email (email input, required, validated)
- Password (password input, required, min 8 characters)
- Department (select dropdown, required, populated from departments table)

**Validation**:
- Email format validation (client-side and server-side via Supabase)
- Password minimum length 8 characters
- All fields required

**Error Handling**:
- Duplicate email: Show "Email already registered"
- Invalid email: Show "Please enter a valid email address"
- Network error: Show "Registration failed. Please try again."
- Profile creation failure: Show "Registration failed. Please try again."


### Requirement 4: Login Flow (Phase B)

**User Story:** As a registered and approved user, I want to log in with my email and password, so that I can access my assigned dashboard (training app for Students, admin dashboard for Admin/Dept Head).

#### Acceptance Criteria

1. THE application SHALL have a public login page at route /login
2. THE login page SHALL NOT require authentication to access
3. THE login form SHALL collect: email (required), password (required)
4. WHEN user submits login form, THE system SHALL call Supabase Auth signInWithPassword()
5. IF signInWithPassword() succeeds, THE system SHALL fetch the user's profile from profiles table
6. THE profile fetch SHALL use the authenticated user's ID (from Supabase session)
7. IF profile.status is 'pending', THE system SHALL show error: "Your account is pending approval. Please contact your department head." AND log the user out
8. IF profile.status is 'disabled', THE system SHALL show error: "Your account has been disabled. Please contact an administrator." AND log the user out
9. IF profile.status is 'approved' AND profile.role is 'student', THE system SHALL redirect to /dashboard (existing training app landing page)
10. IF profile.status is 'approved' AND profile.role is 'dept_head', THE system SHALL redirect to /dept-head (Dept Head dashboard, built in Phase D)
11. IF profile.status is 'approved' AND profile.role is 'admin', THE system SHALL redirect to /admin (Admin dashboard, built in Phase E)
12. THE system SHALL store authenticated user data in Zustand store (currentUser state)
13. THE currentUser state SHALL include: id, email, full_name, role, department_id, status
14. IF signInWithPassword() fails (invalid credentials), THE system SHALL show error: "Invalid email or password"
15. THE login form SHALL have a "Don't have an account? Register" link to /register
16. THE login form SHALL have a "Forgot password?" link (Phase C feature)
17. THE login page SHALL be the default landing page (root /) for unauthenticated users
18. THE system SHALL persist login state across page refreshes (Supabase session cookies)

**Form Fields**:
- Email (email input, required)
- Password (password input, required)

**Post-Login Routing**:
- Student (approved) → /dashboard (existing training app)
- Dept Head (approved) → /dept-head (new dashboard, Phase D)
- Admin (approved) → /admin (new dashboard, Phase E)
- Pending or Disabled → Show error, log out


### Requirement 5: Protected Route Guards (Phase B)

**User Story:** As a system architect, I want all application routes to be protected by authentication checks, so that unauthenticated users cannot access internal pages.

#### Acceptance Criteria

1. THE application SHALL have an AuthProvider wrapper component (or equivalent context/hook)
2. THE AuthProvider SHALL check Supabase session on app initialization
3. THE AuthProvider SHALL load user profile from profiles table if session exists
4. THE AuthProvider SHALL provide: { user, profile, loading, signOut } via context or hook
5. THE application SHALL have a ProtectedRoute component (or update existing one)
6. THE ProtectedRoute SHALL redirect to /login if no authenticated session exists
7. THE ProtectedRoute SHALL show loading spinner while checking authentication
8. ALL existing routes (/dashboard, /rooms, /reservations, /waiter, etc.) SHALL be wrapped in ProtectedRoute
9. THE /login and /register routes SHALL NOT be protected (public access)
10. THE system SHALL redirect authenticated users away from /login and /register to their appropriate dashboard
11. THE logout functionality SHALL call Supabase Auth signOut() and redirect to /login
12. THE logout functionality SHALL clear currentUser from Zustand store
13. THE system SHALL handle Supabase session expiry (redirect to login when token expires)

**Authentication Flow**:
```
1. App loads → AuthProvider checks Supabase session
2. If session exists → Fetch profile → Set currentUser → Allow access
3. If no session → Redirect to /login
4. User logs in → Supabase creates session → Fetch profile → Redirect to dashboard
5. User logs out → Supabase destroys session → Clear currentUser → Redirect to /login
```


### Requirement 6: Admin Dashboard - Dept Head Creation (Phase C)

**User Story:** As an Admin, I want to create Dept Head accounts and assign them to departments, so that each department has a manager to approve student registrations.

#### Acceptance Criteria

1. THE application SHALL have an Admin dashboard page at route /admin
2. THE /admin route SHALL be protected by ProtectedRoute AND role check (only role='admin' can access)
3. THE Admin dashboard SHALL display a list of all departments
4. EACH department card SHALL show: department name, assigned Dept Head (if any), number of Students
5. THE Admin dashboard SHALL have a "Create Dept Head" button
6. WHEN Admin clicks "Create Dept Head", THE system SHALL show a modal/form
7. THE form SHALL collect: full_name (required), email (required), password (required), department_id (required, dropdown of departments)
8. WHEN Admin submits form, THE system SHALL:
   - Create auth.users record via Supabase Admin API (signUp with auto-confirm)
   - Create profiles record with role='dept_head', status='approved', department_id=selected_department
   - Update departments table: set dept_head_id to the new Dept Head's profile.id
9. THE Dept Head SHALL be able to log in immediately (no approval needed, status='approved' from creation)
10. THE Admin dashboard SHALL have a "Create Department" button
11. WHEN Admin clicks "Create Department", THE system SHALL show a modal/form
12. THE form SHALL collect: name (required, unique)
13. WHEN Admin submits form, THE system SHALL create a departments record with dept_head_id=null (to be assigned later)
14. THE Admin dashboard SHALL display a list of all users (Admins, Dept Heads, Students)
15. THE Admin SHALL be able to change any user's status (pending → approved, approved → disabled, etc.)
16. THE Admin SHALL be able to reassign Dept Heads to different departments
17. THE Admin dashboard SHALL have a logout button

**Admin Capabilities (Phase C)**:
- View all departments
- Create new departments
- Create Dept Head accounts (no self-registration for Dept Heads)
- Assign Dept Heads to departments
- View all users (all roles)
- Approve/disable any user
- Reassign users to different departments


### Requirement 7: Dept Head Dashboard - Student Approval (Phase D)

**User Story:** As a Dept Head, I want to view pending student registrations in my department and approve or reject them, so that only authorized students can access the training app.

#### Acceptance Criteria

1. THE application SHALL have a Dept Head dashboard page at route /dept-head
2. THE /dept-head route SHALL be protected by ProtectedRoute AND role check (only role='dept_head' can access)
3. THE Dept Head dashboard SHALL display a list of Students in the Dept Head's department ONLY
4. THE Student list SHALL be filtered by: profile.department_id = (Dept Head's department_id) AND profile.role = 'student'
5. THE list SHALL show Students with status='pending' prominently (e.g., separate tab or highlighted section)
6. EACH Student card SHALL show: full_name, email, status, registration date
7. FOR pending Students, THE card SHALL have "Approve" and "Reject" buttons
8. WHEN Dept Head clicks "Approve", THE system SHALL update profiles.status to 'approved'
9. AFTER approval, THE Student SHALL receive an email notification (optional, Phase E feature)
10. AFTER approval, THE Student SHALL be able to log in and access /dashboard
11. WHEN Dept Head clicks "Reject", THE system SHALL show confirmation dialog: "Are you sure you want to reject this registration?"
12. IF Dept Head confirms rejection, THE system SHALL update profiles.status to 'disabled'
13. THE Student SHALL NOT be able to log in if status='disabled'
14. THE Dept Head dashboard SHALL show approved Students in a separate section
15. THE Dept Head SHALL be able to disable approved Students (change status from 'approved' to 'disabled')
16. THE Dept Head SHALL NOT be able to view or modify Students from other departments (enforced by RLS)
17. THE Dept Head dashboard SHALL have a logout button

**Dept Head Capabilities (Phase D)**:
- View all Students in their department (filtered by RLS)
- Approve pending Student registrations in their department
- Reject pending Student registrations (set status to 'disabled')
- Disable approved Students in their department (revoke access)
- View Student details (full name, email, registration date, status)


### Requirement 8: Integration with Existing Training App (Phase E)

**User Story:** As an approved Student, I want to access the existing training application with all its features (role switcher, hotel operations, F&B, housekeeping), so that I can practice hotel management workflows.

#### Acceptance Criteria

1. AFTER successful login, approved Students SHALL be redirected to /dashboard (existing training app landing page)
2. THE existing training app SHALL work unchanged (no modifications to hotel_manager, front_office, housekeeping, waiter_fnb functionality)
3. THE existing role switcher SHALL continue to work (Students can practice different operational roles)
4. THE existing Zustand store currentUser state SHALL be populated with Supabase user data: { id, email, full_name, role: 'student', department_id, status: 'approved' }
5. THE existing ProtectedRoute component SHALL use Supabase auth instead of demo mode
6. THE existing RequirePermission component SHALL continue to work with the operational training roles (hotel_manager, front_office, etc.)
7. THE training operational roles (hotel_manager, waiter_fnb, etc.) SHALL remain in src/config/rbac.js unchanged
8. THE role switcher SHALL allow Students to switch between training operational roles as before
9. THE Student's auth hierarchy role ('student') SHALL be stored separately from their current training operational role
10. THE system SHALL NOT confuse auth roles (student, dept_head, admin) with training operational roles (hotel_manager, front_office, etc.)
11. THE existing demo reset functionality (resetToDemo) SHALL work for Students (reset training data, not auth data)
12. THE existing localStorage persistence SHALL continue to work for training data
13. THE Supabase session SHALL persist across page refreshes (Students remain logged in)
14. THE logout button in training app SHALL call Supabase signOut() and redirect to /login
15. THE existing TopHeader component SHALL display the Student's full_name (from Supabase profile) instead of "IT ADMIN"

**Key Integration Points**:
- Update currentUser in Zustand store to use Supabase user data
- Update ProtectedRoute to check Supabase session instead of demo mode
- Update logout handler to call Supabase signOut()
- Update TopHeader to display authenticated user's full_name
- Preserve all existing training features unchanged


### Requirement 9: First Admin Account Bootstrapping (Phase C)

**User Story:** As a system deployer, I want to create the first Admin account, so that the authentication system can be initialized.

#### Acceptance Criteria

1. THE first Admin account SHALL be created manually via Supabase SQL editor (not via application UI)
2. THE developer SHALL provide an SQL script to create the first Admin:
   - Create auth.users record with email/password (hashed)
   - Create profiles record with role='admin', status='approved', department_id=null
3. THE Admin email/password SHALL be provided by the reviewer (not hardcoded in SQL)
4. THE SQL script SHALL be idempotent (can be run multiple times without errors)
5. AFTER first Admin is created, THE Admin SHALL log in at /login
6. THE Admin SHALL use the Admin dashboard to create Dept Head accounts
7. THE Dept Heads SHALL use their dashboard to approve Student registrations

**Bootstrapping SQL Example** (to be customized with actual email/password):
```sql
-- First Admin creation (run once in Supabase SQL editor)
-- Replace 'admin@example.com' and 'secure_password' with actual credentials

-- Note: Supabase Auth handles password hashing, so this must be done via 
-- Supabase Dashboard > Authentication > Users > Invite User
-- OR via Supabase Admin API in a secure script
-- THIS SQL IS FOR REFERENCE ONLY - ACTUAL ADMIN CREATION DONE VIA SUPABASE DASHBOARD
```

**Alternative**: Use Supabase Dashboard > Authentication > Users > "Invite User" to create first Admin, then manually update profiles table to set role='admin'.


### Requirement 10: Phased Implementation Plan

**User Story:** As a developer, I want a clear phased implementation plan, so that complexity is managed and progress can be verified incrementally.

#### Phase A: Supabase Setup (Backend Only)
**Deliverables**:
- Supabase project created (by reviewer)
- @supabase/supabase-js installed
- src/lib/supabaseClient.js created
- Environment variables configured (.env.local)
- .gitignore verified to exclude .env*
- SQL schema designed (profiles, departments tables with RLS policies and helper functions)
- SQL provided to reviewer for execution
- One seed department row ("General") inserted via SQL to enable Phase B registration testing
- NO UI development in this phase

**Verification**:
- npm list @supabase/supabase-js shows package installed
- src/lib/supabaseClient.js exports working Supabase client
- Environment variables load correctly (verified via console.log)
- .gitignore contains .env* pattern
- SQL executes without errors in Supabase SQL editor
- Tables visible in Supabase Dashboard > Table Editor
- Seed department "General" exists in departments table
- RLS helper functions exist: get_my_role() and get_my_department()
- RLS policies visible in Supabase Dashboard > Authentication > Policies
- NO RLS recursion errors when querying profiles table (verified via test query)

**Checkpoint**: Developer SHALL NOT proceed to Phase B until reviewer confirms Phase A is complete.


#### Phase B: Registration, Login, Protected Routes
**Deliverables**:
- Public registration page (/register) with form (includes department dropdown)
- Department dropdown populated from departments table (will show "General" seed department)
- Public login page (/login) with form
- AuthProvider context/hook for session management
- ProtectedRoute component updated to use Supabase auth
- Student self-registration flow (creates auth.users + profiles with department_id=selected_department, status='pending')
- Profile creation via explicit application code (NOT database trigger)
- Login flow with status checks (pending/disabled cannot log in)
- Post-login routing (student → /dashboard, dept_head → /dept-head, admin → /admin)
- Logout functionality (signOut + redirect to /login)

**Verification**:
- Register new Student account with "General" department → Record appears in Supabase profiles table with status='pending', department_id=(General's UUID)
- Attempt login with pending account → Error: "Account pending approval"
- Protected routes redirect unauthenticated users to /login
- /login and /register accessible without authentication
- Logout clears session and redirects to /login
- Department dropdown shows "General" (seed data from Phase A)

**Checkpoint**: Developer SHALL NOT proceed to Phase C until reviewer confirms Phase B is complete.


#### Phase C: Admin Dashboard & Dept Head Creation
**Deliverables**:
- Admin dashboard page (/admin) with role guard
- First Admin account created (via Supabase Dashboard or SQL)
- Create Dept Head form (name, email, password, department)
- Create Department form (name)
- Department list view (shows dept head, student count)
- User management (view all users, change status, reassign departments)

**Verification**:
- Admin logs in → Redirected to /admin
- Admin creates new department → Appears in departments table
- Admin creates new Dept Head → auth.users + profiles created with role='dept_head', status='approved'
- Dept Head logs in → Redirected to /dept-head
- Admin changes user status (approved → disabled) → User cannot log in

**Checkpoint**: Developer SHALL NOT proceed to Phase D until reviewer confirms Phase C is complete.


#### Phase D: Dept Head Dashboard & Student Approval
**Deliverables**:
- Dept Head dashboard page (/dept-head) with role guard
- Student list view (filtered by dept head's department)
- Pending students section (highlighted or separate tab)
- Approve button (updates status to 'approved')
- Reject button (updates status to 'disabled')
- Approved students section
- Disable approved student functionality

**Verification**:
- Dept Head logs in → Sees only students from their department (RLS enforced)
- Pending student appears in Dept Head dashboard
- Dept Head approves student → Student can now log in
- Approved student logs in → Redirected to /dashboard (existing training app)
- Dept Head rejects student → Student status = 'disabled', cannot log in

**Checkpoint**: Developer SHALL NOT proceed to Phase E until reviewer confirms Phase D is complete.


#### Phase E: Integration & Polish
**Deliverables**:
- Update existing training app to use Supabase auth
- Update Zustand currentUser to use Supabase profile data
- Update TopHeader to display authenticated user's full_name
- Update role switcher to preserve auth role while switching training roles
- Preserve all existing training features (hotel_manager, waiter_fnb, etc.)
- Email notifications for approval (optional)
- Password reset flow (optional)
- Profile editing (Students can update their own name)
- Admin audit log (optional)

**Verification**:
- Approved Student logs in → Lands in existing training app unchanged
- Role switcher works (can practice hotel_manager, front_office, etc.)
- Student's name appears in TopHeader (not "IT ADMIN")
- Logout from training app → Supabase session cleared, redirect to /login
- Demo reset still works (training data reset, auth data preserved)
- All existing features work unchanged (rooms, reservations, housekeeping, F&B, reports)

**Final Checkpoint**: Full end-to-end testing with all user roles before marking feature complete.


---

## Non-Functional Requirements

### Security
- Passwords SHALL be hashed by Supabase Auth (never stored in plain text)
- RLS policies SHALL be enforced at database level (not just application level)
- Supabase anon key SHALL be gitignored (never committed)
- Supabase service_role key SHALL NEVER be used in client-side code
- Session tokens SHALL expire after inactivity (Supabase default: 1 hour)
- Email confirmation MAY be enabled for registration (optional Supabase setting)

### Performance
- Profile fetch SHALL complete within 500ms after login
- Department list SHALL load within 300ms
- Student approval action SHALL complete within 1 second
- RLS policies SHALL NOT cause noticeable query slowdown

### Compatibility
- SHALL work with existing Vite + React setup
- SHALL work with existing Zustand store
- SHALL work with existing React Router setup
- SHALL work in all modern browsers (Chrome, Firefox, Edge, Safari)

### Data Integrity
- User deletion SHALL cascade to profiles table (orphan prevention)
- Department deletion SHALL set profiles.department_id to null (not cascade delete users)
- Status changes SHALL be atomic (no partial updates)
- Duplicate emails SHALL be prevented by Supabase Auth

---

## Out of Scope (Not in Phase A-E)

The following are explicitly OUT OF SCOPE for Phase A-E:

- Email verification (Supabase can do this, but not required for v1)
- Password reset flow (nice-to-have, Phase E optional)
- Two-factor authentication (future enhancement)
- OAuth login (Google, Microsoft, etc.) (future enhancement)
- Profile picture upload (future enhancement)
- Advanced audit logging (who approved which student, when) (future enhancement)
- Email notifications (Supabase can send emails, but not required for v1)
- Bulk student import (CSV upload) (future enhancement)
- Department hierarchy (sub-departments) (not needed per requirements)
- Multi-department Dept Heads (one Dept Head per department only)
- Guest/demo mode after authentication is added (design decision: preserve or remove)

---

## Acceptance Criteria Summary

This requirements document defines 10 requirements with 150+ acceptance criteria covering:

- **Supabase Setup** (Req 1-2): Backend configuration, database schema, RLS policies
- **Student Registration** (Req 3): Self-service registration with pending approval
- **Login & Auth** (Req 4-5): Secure login, session management, protected routes
- **Admin Dashboard** (Req 6, 9): Dept Head creation, department management, first admin bootstrapping
- **Dept Head Dashboard** (Req 7): Student approval/rejection workflow
- **Training App Integration** (Req 8): Seamless integration with existing training features
- **Phased Implementation** (Req 10): Clear phase boundaries with checkpoints

---

## Design Decisions Resolved

1. **Profile Creation** ✅ RESOLVED: Explicit application code (NOT database trigger)
   - Rationale: Clearer error handling, more control, easier debugging, future flexibility
   
2. **Department Assignment for Students** ✅ RESOLVED: Student selects department at registration (dropdown), seeded with one "General" department in Phase A
   - Rationale: Simpler workflow, avoids NULL department RLS issues, Phase B/C sequencing resolved via seed data

## Design Decisions Needed (To Be Resolved in design.md)

1. **Demo Mode**: Preserve as "guest preview" OR replace entirely with required authentication?
2. **Email Verification**: Enable Supabase email confirmation OR allow immediate registration with pending approval?
3. **Password Reset**: Implement in Phase E OR defer to future enhancement?
4. **First Admin Creation**: Manual SQL + Supabase Dashboard OR build a one-time setup wizard?

These decisions will be documented in design.md after requirements approval.

---

**Requirements Document Version**: 1.0  
**Date**: 2026-08-12  
**Status**: Draft - Awaiting Reviewer Approval  
**Next Step**: Reviewer provides feedback → Developer creates design.md
