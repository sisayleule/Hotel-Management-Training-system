# 🏨 COMPLETE TESTING GUIDE - IDS Next Fortune Hotel PMS Trainer

## 📋 Table of Contents
1. [Getting Started](#1-getting-started)
2. [Login & Authentication](#2-login--authentication)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Room Status Management](#4-room-status-management)
5. [Creating Reservations](#5-creating-reservations)
6. [Check-In Process](#6-check-in-process)
7. [Check-Out Process](#7-check-out-process)
8. [Cashiering & Billing](#8-cashiering--billing)
9. [Housekeeping Management](#9-housekeeping-management)
10. [Reports Module](#10-reports-module)
11. [Settings & Configuration](#11-settings--configuration)
12. [Role-Based Access Testing](#12-role-based-access-testing)

---

## 1. Getting Started

### Prerequisites
- Application running at: **http://localhost:3000/**
- Browser: Chrome, Firefox, Edge, or Safari
- Screen resolution: Minimum 1024x768 (optimal: 1920x1080)

### First Launch Steps
1. Open your browser
2. Navigate to `http://localhost:3000/`
3. You should see the **FORTUNE NEXT V6.5 Training Edition** login page
4. Confirm the page loads with:
   - Hotel icon at top
   - "FORTUNE NEXT" header
   - "V6.5 Training Edition" subtitle
   - "AMOB University — Hotel Management Training System" text
   - Username and Password input fields
   - Three role selection chips: Front Desk, Housekeeping, Manager

---

## 2. Login & Authentication

### Test Case 2.1: Login with Manager Role
**Objective**: Test full-access manager login

**Steps**:
1. Click the **"Manager"** role chip (it should highlight in blue/dark color)
2. In the **Username** field, type: `John Manager` (or any name)
3. In the **Password** field, type: `demo123`
4. Click **"Authorize & Login"** button
5. **Expected Result**: 
   - Success toast notification appears: "Welcome, JOHN MANAGER! Logged in as manager"
   - Redirected to Dashboard page
   - Top header shows "USER: JOHN MANAGER" in yellow

### Test Case 2.2: Quick Demo Mode Login
**Objective**: Test instant demo access without typing credentials

**Steps**:
1. From login page, click the **"Manager"** role chip
2. Click the **"Enter Demo Mode"** button (skip username/password)
3. **Expected Result**:
   - Success toast: "Logged into Demo Mode as MANAGER"
   - Auto-logged in as "IT ADMIN"
   - Redirected to Dashboard

### Test Case 2.3: Login with Different Roles
**Objective**: Test role-based login

**Steps** (repeat for each role):
1. **Front Desk Role**:
   - Click "Front Desk" chip
   - Username: `Sarah Desk`
   - Password: `demo123`
   - Login
   - Verify USER shows as "SARAH DESK"

2. **Housekeeping Role**:
   - Click "Housekeeping" chip
   - Username: `Mary Clean`
   - Password: `demo123`
   - Login
   - Verify USER shows as "MARY CLEAN"

### Test Case 2.4: Invalid Password Test
**Objective**: Test error handling

**Steps**:
1. Enter Username: `Test User`
2. Enter Password: `wrongpass`
3. Click "Authorize & Login"
4. **Expected Result**:
   - Error toast: "Incorrect password! Use 'demo123' or click Enter Demo Mode."
   - Remains on login page

---

## 3. Dashboard Overview

### Test Case 3.1: Explore Dashboard Layout
**Objective**: Verify all dashboard components load correctly

**Steps**:
1. After login, you should be on Dashboard (`/dashboard`)
2. **Verify Top Section**:
   - IDS header row shows: "BS/GN V[6.5]", "SP V[1]", "USER: [your name]"
   - Hotel name: "AMOB UNIVERSITY FORTUNE TRAINING HOTEL"

3. **Verify Toolbar Icons** (horizontal scrollable row):
   - Front Office
   - Cashiering
   - Reports
   - Housekeeping
   - Reservations
   - Phone
   - Revenue
   - Packages
   - Restaurant
   - Laundry
   - Settings

4. **Verify Left Menu Panel** titled "Front Office Menu":
   - Registrations..
   - Reservations..
   - Cashiering..
   - Day End process..
   - Guest History..
   - House Keeping..
   - Reports..
   - Lookups..
   - SMS Setup..
   - Setup..

5. **Verify Statistics Cards** (right side):
   - Expected Arrivals (number)
   - Expected Departures (number)
   - Walk-in Rooms (number)
   - Rooms to Sell (number)
   - Inhouse Rooms / Guests (X / Y)
   - Extra Adult / Child
   - Inhouse Foreign
   - Blocked / OOD Rooms
   - Registered Complaints

6. **Verify Bottom Status Bar**:
   - Function key shortcuts: F1, F2, F5, F9, F12
   - Last update timestamp

### Test Case 3.2: Test Dashboard Navigation
**Objective**: Verify clicking dashboard elements navigates correctly

**Steps**:
1. Click **"Front Office"** toolbar icon
   - **Expected**: Navigate to Check-In page

2. Go back to Dashboard (click "Dashboard" in sidebar or browser back button)

3. Click **"Reservations"** toolbar icon
   - **Expected**: Navigate to Reservations page

4. Return to Dashboard

5. Click **"Expected Arrivals"** stat card
   - **Expected**: Navigate to Check-In page

6. Return to Dashboard

7. Click **"Rooms to Sell"** stat card
   - **Expected**: Navigate to Room Status page

8. Click menu item **"Day End process.."**
   - **Expected**: Modal opens titled "IDS Next Night Audit Simulator"

### Test Case 3.3: Test Day End (Night Audit) Process
**Objective**: Simulate hotel day closing

**Steps**:
1. From Dashboard, click **"Day End process.."** menu item
2. Modal opens with clock icon (animated pulse)
3. Read the description
4. Click **"Confirm Run Night Audit"** button
5. **Expected**:
   - Progress bar animates (orange color)
   - Text shows: "Processing folios..."
   - After 2-3 seconds, shows completion:
     - "Process Complete!"
     - "60 room statuses audited"
     - "14 active in-house reservations posted"
     - "System operational date changed to 01-Jul-2026"
   - Success toast: "Night audit succeeded! Date advanced to 01-Jul-2026"
6. Click **"Close Audit Dialog"**
7. Modal closes

---

## 4. Room Status Management

### Test Case 4.1: View All Rooms
**Objective**: Access and view the complete room status board

**Steps**:
1. From Dashboard or Sidebar, click **"Rooms"** or **"Lookups.."**
2. **Expected**: Navigate to Room Status page
3. **Verify Page Elements**:
   - Title: "Room Status V6.5.002.1"
   - Subtitle explaining the board
   - Filter bar with dropdowns and search
   - Rooms displayed in grid format
   - Floor groupings (Floor 2, 3, 4, 5, 6)
   - Legend bar at bottom with color codes

4. **Verify Room Cards** show:
   - Room number (e.g., "201", "305")
   - Room type code (e.g., "DLX", "SUI")
   - Status color:
     - 🟢 Green = Vacant Clean
     - 🟡 Yellow = Occupied
     - 🟠 Orange = Dirty
     - 🔴 Red = Out of Order
     - 🔵 Blue = Reserved

### Test Case 4.2: Filter Rooms by Type
**Objective**: Test room filtering functionality

**Steps**:
1. On Room Status page, locate the **"Room Type"** dropdown (shows "All" by default)
2. Click dropdown and select **"DLX (Deluxe)"**
3. **Expected**:
   - Grid updates to show only Deluxe rooms
   - Orange info banner appears: "ACTIVE FILTERS: Showing X matching units"
   - Room count changes

4. Select **"SUI (Suite)"** from dropdown
5. **Expected**: Only suite rooms display

6. Click **"Clear All Filters"** in orange banner
7. **Expected**: All 60 rooms display again

### Test Case 4.3: Filter Rooms by Floor
**Objective**: Test floor filtering

**Steps**:
1. Click **"Floor"** dropdown (shows "All")
2. Select **"Floor 2"**
3. **Expected**: Only rooms 201-210 display (Floor 2 rooms)
4. Try **"Floor 6"** (Penthouse)
5. **Expected**: Only penthouse suite rooms display
6. Clear filters

### Test Case 4.4: Search for Specific Room
**Objective**: Test room search functionality

**Steps**:
1. In the **Search field** (magnifying glass icon), type: `305`
2. **Expected**:
   - Only Room 305 displays
   - Active filter banner shows
3. Clear search, type: `4` (to search all rooms with "4")
4. **Expected**: All rooms containing "4" display (204, 304, 401-410, etc.)
5. Clear search

### Test Case 4.5: Filter by Room Status
**Objective**: Test status-based filtering

**Steps**:
1. Click **"Filter By"** dropdown
2. Select **"Vacant Clean"**
3. **Expected**: Only green (vacant clean) rooms display
4. Select **"Occupied"**
5. **Expected**: Only yellow (occupied) rooms display
6. Select **"Vacant Dirty"**
7. **Expected**: Only orange/dirty rooms display
8. Clear filters

### Test Case 4.6: View Room Details
**Objective**: Open and inspect room detail sheet

**Steps**:
1. Click any room card (e.g., Room 305)
2. **Expected**: Bottom sheet slides up showing:
   - Room number and type
   - Current status
   - Guest information (if occupied)
   - Action buttons (Change Status, etc.)
   - Room amenities/features
3. Review all displayed information
4. Click X or outside sheet to close
5. **Expected**: Sheet closes smoothly

### Test Case 4.7: Change Room Status (Manager Only)
**Objective**: Test room status modification

**Steps**:
1. Ensure logged in as **Manager**
2. Click a **Dirty** room (orange color)
3. In detail sheet, look for status change options
4. Change status to **"Vacant Clean"**
5. **Expected**:
   - Success toast notification
   - Room card color changes to green
   - Room status updates immediately
6. Try changing an Occupied room to Dirty
7. Test other status transitions

---

## 5. Creating Reservations

### Test Case 5.1: Create Basic Reservation
**Objective**: Create a simple walk-in reservation

**Steps**:
1. Navigate to **Reservations** page (sidebar or dashboard)
2. Click **"New Reservation"** or **"+ Create Reservation"** button
3. **Expected**: Navigate to New Reservation form page
4. **Fill in Guest Information**:
   - Guest Full Name: `Raj Kumar`
   - Company/Corporate: Leave as "None (Walk-In)"
   - Room Category: Select **"DLX (Deluxe)"** (default)
   - Billing Settlement Plan: Select **"Cash"**
   - Nightly Rate: Should auto-fill (e.g., ₹3500)

5. **Fill in Calendar Details**:
   - Arrival Date: Today's date (auto-filled)
   - Departure Date: Tomorrow (auto-filled)
   - Total Nights: Auto-calculated as 1
   - Adults: Select **"1 Ad"**
   - Children: Select **"0 Ch"**

6. **Fill in Contact Information**:
   - Email: `raj.kumar@email.com`
   - Phone: `+251 912 345678`
   - Identity Type: Select **"Passport"**
   - Identity No: `AB1234567`

7. **Verify Billing Summary** (bottom panel):
   - Shows calculated total amount
   - Should display: "₹3,500" (1 night × ₹3500)

8. Click **"Register Hold Booking"** button

9. **Expected Results**:
   - Success toast: "Reservation RES00XXX created successfully!"
   - Redirected to Reservations list page
   - New reservation appears in list

### Test Case 5.2: Create Multi-Night Reservation
**Objective**: Test reservation with multiple nights

**Steps**:
1. Click **"New Reservation"**
2. Guest Name: `Priya Sharma`
3. Room Category: **"SUI (Suite)"**
4. Arrival Date: Today
5. Departure Date: 3 days from today
6. **Expected**: 
   - Nights auto-calculates to **3**
   - Total Amount: ₹5000 × 3 = **₹15,000** (auto-calculated)
7. Fill remaining required fields
8. Click **"Register Hold Booking"**
9. **Expected**: Reservation created with 3-night stay

### Test Case 5.3: Create Corporate Reservation
**Objective**: Link reservation to a company account

**Steps**:
1. Click **"New Reservation"**
2. Guest Name: `John Business`
3. In **Company/Corporate Account** field, click the **Search icon** (magnifying glass)
4. **Expected**: Company lookup popup opens
5. Search popup shows list of companies
6. Type in search: `Tech` (to filter)
7. Click on a company from list (e.g., "TechCorp Solutions")
8. **Expected**:
   - Company name appears in field
   - Rate may adjust (15% corporate discount)
   - Success toast: "Selected corporate client: TechCorp Solutions"
9. Select Room Type: **"DLX"**
10. Notice rate is lower due to corporate discount
11. Billing Plan: Select **"Bill to Company (Direct)"**
12. Complete form and save
13. **Expected**: Reservation linked to company

### Test Case 5.4: Test Auto-Calculations
**Objective**: Verify automatic calculations work

**Steps**:
1. Start new reservation
2. Guest Name: `Test Guest`
3. Set Arrival: Today
4. Set Departure: Today + 1 day
5. **Verify**: Nights = 1
6. Change Departure to Today + 5 days
7. **Verify**: Nights automatically updates to 5
8. Change Room Type from DLX to SUI
9. **Verify**: 
   - Rate updates to suite price
   - Total Amount recalculates (Rate × Nights)
10. Change Nights value
11. **Verify**: Total Amount updates

---

## 6. Check-In Process

### Test Case 6.1: View Expected Arrivals
**Objective**: Access today's arrival list

**Steps**:
1. From Dashboard or Sidebar, click **"Check-In"** or **"Registrations.."**
2. **Expected**: Check-In page opens showing "Front Desk Expected Arrivals"
3. **Verify Page Elements**:
   - Search bar for filtering guests
   - Total scheduled arrivals count
   - Table with columns:
     - Res No.
     - Guest Name
     - Room Type
     - Check Out Date
     - Billing Plan
     - Auto-Assign Status
     - Action buttons

4. **Verify Arrival Data**:
   - Reservations with today's arrival date appear
   - Status shows "X vacant rooms" if rooms available
   - Or "No vacant clean" if no rooms of that type available

### Test Case 6.2: Quick Check-In with Auto Room Assignment
**Objective**: Check in a guest using automatic room assignment

**Steps**:
1. On Check-In page, find a reservation with arrival today
2. Verify **Auto-Assign Status** shows "X vacant rooms" (green badge)
3. Click **"Quick Check-In"** button for that reservation
4. **Expected**:
   - System automatically assigns first available vacant clean room
   - Success toast: "Checked in RES00XXX! Assigned vacant clean Room XXX"
   - Guest status changes from "Confirmed" to "Checked-In"
   - Room status changes from "Vacant Clean" to "Occupied"

5. Navigate to Room Status page
6. **Verify**: Assigned room now shows as Occupied (yellow) with guest name

### Test Case 6.3: Manual Room Assignment Check-In
**Objective**: Check in with specific room selection

**Steps**:
1. On Check-In page, find an arrival
2. Click **"Manual assign"** button (or click the entire row)
3. **Expected**: Navigate to Reservation Detail page
4. On detail page, look for **"Assign Room"** or similar button
5. Click to view available rooms for the guest's room type
6. Select a specific room (e.g., Room 305)
7. Confirm assignment
8. Click **"Check-In Guest"** button
9. **Expected**:
   - Guest checked in to selected room
   - Success notification
   - Room status updates

### Test Case 6.4: Search Arrivals
**Objective**: Test search functionality on arrivals

**Steps**:
1. On Check-In page with multiple arrivals
2. In search bar, type a guest name (e.g., `Kumar`)
3. **Expected**: Table filters to show only matching names
4. Clear search
5. Type a reservation number (e.g., `RES001`)
6. **Expected**: Shows that specific reservation
7. Clear search to see all arrivals

### Test Case 6.5: Handle No Available Rooms
**Objective**: Test check-in when rooms are full

**Steps**:
1. Find a reservation for room type with no vacant clean rooms
2. **Verify**: Auto-Assign Status shows "No vacant clean" (red badge)
3. Click **"Quick Check-In"**
4. **Expected**:
   - Error toast: "No vacant clean rooms of type XXX available. Assign other category in folio detail."
   - Redirected to reservation detail for manual handling
5. On detail page, can upgrade to different room type if available

---

## 7. Check-Out Process

### Test Case 7.1: View Expected Departures
**Objective**: Access today's departure list

**Steps**:
1. From Dashboard or Sidebar, click **"Check-Out"**
2. **Expected**: Check-Out page opens
3. **Verify**:
   - List of guests scheduled to depart today
   - Guest names, room numbers, billing details
   - Outstanding balance amounts
   - Check-out action buttons

### Test Case 7.2: Process Standard Check-Out
**Objective**: Check out a guest with settled bill

**Steps**:
1. On Check-Out page, find a departing guest
2. **Verify Billing**: Check if outstanding balance is ₹0.00 or paid
3. Click **"Check-Out"** or **"Process Departure"** button
4. **Expected**:
   - Confirmation dialog may appear
   - Click "Confirm"
   - Success toast: "Guest checked out successfully!"
   - Guest removed from in-house list
   - Room status changes from "Occupied" to "Dirty"

5. Go to Room Status page
6. **Verify**: Previously occupied room now shows as Dirty (orange)

### Test Case 7.3: Check-Out with Outstanding Balance
**Objective**: Handle check-out when guest has unpaid charges

**Steps**:
1. Find guest with outstanding balance > ₹0
2. Click **"Check-Out"**
3. **Expected**:
   - Warning message: "Guest has outstanding balance of ₹X,XXX"
   - Option to settle payment first or proceed
4. Click **"Settle Payment First"** or **"Go to Cashiering"**
5. Redirected to Cashiering page to post payment
6. After payment, return and complete check-out

### Test Case 7.4: Print Guest Folio (if available)
**Objective**: Generate guest bill printout

**Steps**:
1. On Check-Out page or Reservation detail, look for **"Print Folio"** button
2. Click it
3. **Expected**: Print dialog opens with formatted guest bill
4. Review bill details:
   - Guest name and room
   - Itemized charges
   - Payments received
   - Balance
5. Can print or save as PDF

---

## 8. Cashiering & Billing

### Test Case 8.1: Access Cashiering Module
**Objective**: Open the cashiering/billing interface

**Steps**:
1. From Dashboard or Sidebar, click **"Cashiering"**
2. **Expected**: Cashiering page opens
3. **Verify Elements**:
   - List of in-house guests
   - Search/filter options
   - Posting transaction buttons
   - Payment collection interface

### Test Case 8.2: Post Room Charge
**Objective**: Add nightly room charge to guest folio

**Steps**:
1. Select a checked-in guest from list
2. Click **"Post Room Charge"** or similar button
3. **Expected**: Modal opens to post charge
4. Verify charge amount equals nightly rate
5. Click **"Post Charge"**
6. **Expected**:
   - Success toast: "Room charge posted"
   - Guest folio balance increases
   - Transaction logged

### Test Case 8.3: Post Miscellaneous Charge
**Objective**: Add extra charges (restaurant, laundry, minibar)

**Steps**:
1. Select a guest
2. Click **"Post Charge"** or **"Add Transaction"**
3. Select charge type:
   - Restaurant / F&B
   - Laundry
   - Minibar
   - Telephone
   - Other
4. Enter amount: `500`
5. Add description: `Restaurant Bill - Dinner`
6. Click **"Post"**
7. **Expected**:
   - Charge added to folio
   - Balance updates
   - Itemized on guest statement

### Test Case 8.4: Accept Payment
**Objective**: Record guest payment

**Steps**:
1. Select guest with outstanding balance
2. Click **"Accept Payment"** or **"Post Payment"**
3. Enter payment amount (e.g., ₹5000)
4. Select payment method:
   - Cash
   - Credit Card
   - Debit Card
   - UPI
   - Bank Transfer
5. Add reference number (for card/UPI): `TXN123456`
6. Click **"Post Payment"**
7. **Expected**:
   - Success toast: "Payment received"
   - Guest balance decreases by payment amount
   - Receipt generated (optional print)

### Test Case 8.5: View Guest Folio Statement
**Objective**: Review complete transaction history

**Steps**:
1. Select a guest
2. Click **"View Folio"** or **"Statement"**
3. **Expected**: Full itemized statement displays:
   - Opening balance
   - All charges (room, F&B, extras)
   - All payments received
   - Current balance
   - Dates and descriptions for each transaction
4. Verify all posted transactions appear correctly

---

## 9. Housekeeping Management

### Test Case 9.1: Access Housekeeping Module
**Objective**: Open the housekeeping board

**Steps**:
1. From Dashboard or Sidebar, click **"Housekeeping"** or **"House Keeping.."**
2. **Expected**: Housekeeping page opens
3. **Verify Dashboard Stats**:
   - Dirty Rooms count
   - Clean Rooms count
   - Cleanliness ratio percentage
   - Staff on duty count

4. **Verify Staff Registry Panel** (collapsible):
   - Lists housekeepers: Priya Sharma, Anita Das, Raju Nair, Meena Kaur
   - Shows shift times
   - Shows rooms cleaned count

5. **Verify Room Grid**:
   - All 60 rooms displayed
   - Color coded by status
   - Can click each room for detail

### Test Case 9.2: Assign Room to Housekeeper
**Objective**: Allocate cleaning task to staff member

**Steps**:
1. On Housekeeping page, click a **Dirty** room (orange)
2. **Expected**: Room detail card/sheet opens
3. Look for **"Assign to Housekeeper"** dropdown
4. Select housekeeper: **"Priya Sharma"**
5. Click **"Assign"** or **"Save"**
6. **Expected**:
   - Success toast: "Room assigned to Priya Sharma"
   - Assignment logged
   - Priya's room count increases by 1

### Test Case 9.3: Change Room to Clean Status
**Objective**: Mark room as cleaned

**Steps**:
1. Click a **Dirty** room (orange)
2. In detail card, click **"Mark as Clean"** or **"Release Clean"**
3. Optionally add cleaning notes/comments
4. Click **"Confirm"**
5. **Expected**:
   - Room status changes from Dirty to Vacant Clean
   - Card color changes from orange to green
   - Success toast notification
   - Clean Rooms count increases
   - Dirty Rooms count decreases

6. Verify stats updated in real-time

### Test Case 9.4: Create Maintenance Request
**Objective**: Flag room for repair/maintenance

**Steps**:
1. Click any room card
2. In detail sheet, look for **"Report Maintenance"** or **"Maintenance Issue"**
3. Click it
4. **Expected**: Maintenance form opens
5. Select issue type:
   - Plumbing
   - Electrical
   - AC / HVAC
   - Furniture
   - General Repair
6. Select issue: **"Plumbing"**
7. Add description: `Leaking bathroom faucet`
8. Set priority: **"High"** or **"Medium"**
9. Click **"Submit Maintenance Request"**
10. **Expected**:
    - Success toast: "Maintenance ticket created"
    - Room status changes to **"Out of Order"**
    - Room card turns red
    - Room blocked from being sold/assigned
    - Maintenance log created

### Test Case 9.5: Clear Maintenance and Return to Service
**Objective**: Mark repaired room as available

**Steps**:
1. Click a room with **"Out of Order"** status (red)
2. Review maintenance details
3. Click **"Mark as Repaired"** or **"Return to Service"**
4. Confirm maintenance completed
5. **Expected**:
   - Room status changes to "Vacant Dirty"
   - Can now be cleaned and sold
   - Maintenance ticket closed

### Test Case 9.6: View Housekeeper Performance
**Objective**: Review staff productivity

**Steps**:
1. On Housekeeping page, expand **"Active Staff Registry"** panel
2. **Verify for each housekeeper**:
   - Name
   - Shift time (e.g., "08:00 - 16:00")
   - Rooms cleaned today (count)
   - Assigned rooms list
3. Compare productivity across staff

---

## 10. Reports Module

### Test Case 10.1: Access Reports Hub
**Objective**: Open the reports center (Manager access)

**Steps**:
1. Ensure logged in as **Manager**
2. From Dashboard or Sidebar, click **"Reports"**
3. **Expected**: Reports page opens showing report menu
4. **Verify Six Report Options**:
   - Guest Block Report (GSTBLK)
   - Arrival Report
   - Departure Report
   - In-House Report
   - Room Status Report
   - Revenue Report

### Test Case 10.2: Generate Guest Block Report (GSTBLK)
**Objective**: View blocked rooms and holds

**Steps**:
1. On Reports page, click **"Guest Block Report (GSTBLK)"** or **"Detailed Position"**
2. **Expected**: Report displays showing:
   - Blocked rooms list
   - Block reason (maintenance, hold, event)
   - Department codes
   - Manager notes
   - Expected unblock dates
3. **Verify**: Can export to CSV (look for export button)
4. Click **"Export CSV"** if available
5. **Expected**: CSV file downloads

### Test Case 10.3: View Arrival Report
**Objective**: See detailed expected arrivals

**Steps**:
1. Click **"Arrival Report"** or **"Expected Arrivals"**
2. **Expected**: Detailed table displays:
   - Reservation numbers
   - Guest names
   - Arrival dates/times
   - Room types booked
   - Nights of stay
   - Payment plans
   - Corporate affiliations
   - VIP status flags
3. Can be sorted by columns
4. Print or export functionality available

### Test Case 10.4: View Departure Report
**Objective**: See detailed expected departures

**Steps**:
1. Click **"Departure Report"** or **"Expected Departures"**
2. **Expected**: Table shows:
   - Departing guests
   - Room numbers
   - Checkout dates
   - Total charges
   - Payments received
   - Outstanding balances
   - Overdue status (if any)
3. **Identify**: Guests with outstanding balance highlighted/flagged
4. Export or print if needed

### Test Case 10.5: View In-House Report
**Objective**: See current guest occupancy

**Steps**:
1. Click **"In-House Report"** or **"In-House Guest Registry"**
2. **Expected**: Report displays:
   - All currently checked-in guests
   - Room numbers and floors
   - Guest headcount (adults + children)
   - Check-in dates
   - Expected checkout dates
   - Nights remaining
   - VIP stars/flags
   - Outstanding ledger balances
3. **Verify**: Total in-house guest count
4. Can filter by floor, VIP status, etc.

### Test Case 10.6: View Room Status Report
**Objective**: Aggregate occupancy and status matrix

**Steps**:
1. Click **"Room Status Report"**
2. **Expected**: Report shows:
   - 60-room breakdown by category
   - Status distribution:
     - Vacant Clean: X rooms (X%)
     - Occupied: X rooms (X%)
     - Dirty: X rooms (X%)
     - Out of Order: X rooms (X%)
   - Visual progress bars/indicators
   - Occupancy percentage
3. Can print for daily operations review

### Test Case 10.7: View Revenue Report with Charts
**Objective**: Analyze financial performance

**Steps**:
1. Click **"Revenue Report"** or **"Revenue & Yield Charts"**
2. **Expected**: Report displays with:
   - **SVG Charts** (powered by Recharts library):
     - Bar chart: Revenue by room type
     - Line chart: Revenue trend over time
     - Pie chart: Revenue distribution
   - **Financial Metrics**:
     - Total revenue collected
     - Outstanding bills
     - Revenue per available room (RevPAR)
     - Average daily rate (ADR)
3. **Verify**: Charts are interactive (hover to see values)
4. Can export data or print charts

### Test Case 10.8: Test Report Access Control (Non-Manager)
**Objective**: Verify role-based report restrictions

**Steps**:
1. Logout from Manager account
2. Login as **Front Desk** role
3. Try to access **Reports** page
4. **Expected**:
   - Access Denied screen appears
   - Message: "You don't have permission to access this module"
   - Locked icon displayed
   - Suggestion to contact manager or practice role switching
5. Cannot view reports without manager clearance

---

## 11. Settings & Configuration

### Test Case 11.1: Access Settings Module
**Objective**: Open system configuration panel

**Steps**:
1. From Dashboard or Sidebar, click **"Settings"** or **"Setup.."**
2. **Expected**: Settings page opens
3. **Verify Tabs/Sections**:
   - Hotel Profile
   - Role Management
   - Display Settings
   - Tutorial Mode
   - Demo Reset (Danger Zone)

### Test Case 11.2: Edit Hotel Profile
**Objective**: Modify hotel information

**Steps**:
1. On Settings page, go to **"Hotel Profile"** section
2. **View Current Settings**:
   - Property Name: "DEMO TRAINING HOTEL"
   - Property Code: "DTH001"
   - City: "Addis Ababa"
   - Country: "Ethiopia"
   - Phone: "+251 111 234567"
   - GSTIN: "29XXXXX1234X1Z5"

3. **Modify Fields**:
   - Change Property Name to: `AMOB Grand Hotel`
   - Change City to: `Mumbai`
   - Change Country to: `India`
   - Change Phone to: `+91 22 12345678`

4. Click **"Save Hotel Profile"** or **"Update"**
5. **Expected**:
   - Success toast: "Hotel profile updated"
   - Changes saved
6. Verify changes persist after refresh

### Test Case 11.3: Switch User Roles
**Objective**: Change active session role for testing

**Steps**:
1. On Settings page, locate **"Demo Role Switcher"** or **"Role Management"**
2. **View Current Role**: Should show current (e.g., Manager)
3. Click role dropdown or selector
4. **Available Options**:
   - Hotel Manager (full access)
   - Front Desk Agent (limited)
   - Housekeeper Supervisor
   - Auditor Student View

5. Select **"Front Desk Agent"**
6. Click **"Switch Role"** or **"Apply"**
7. **Expected**:
   - Success toast: "Role changed to Front Desk Agent"
   - User name may update
   - Access permissions change

8. Test navigation: Try accessing Reports
9. **Expected**: Access Denied for Front Desk role

10. Return to Settings and switch back to **"Manager"**

### Test Case 11.4: Enable Tutorial Mode
**Objective**: Activate educational tooltips

**Steps**:
1. On Settings page, find **"Academic Training Switch"** or **"Tutorial Mode"**
2. **Verify Toggle**: Should be OFF by default
3. Click toggle to turn **ON**
4. **Expected**: Success message: "Tutorial mode enabled"
5. Navigate to **New Reservation** page
6. **Verify**:
   - Hover over field labels (e.g., "Room Category")
   - Tooltip appears explaining PMS term
   - Example: "Room Category: The classification of room type such as Deluxe, Suite, Standard..."
7. Test tooltips on multiple fields:
   - Pay Mode (explains billing settlement)
   - ADR (Average Daily Rate)
   - Folio (guest account ledger)
8. Return to Settings and toggle OFF
9. **Verify**: Tooltips no longer appear

### Test Case 11.5: Change Display Currency
**Objective**: Switch between currency formats

**Steps**:
1. On Settings, locate **"System Display Formats"** section
2. Find **Currency** dropdown (default: INR ₹)
3. **Available Options**:
   - INR ₹ (Indian Rupee)
   - USD $ (US Dollar)
   - EUR € (Euro)

4. Select **"USD $"**
5. Click **"Save"** or **"Apply"**
6. **Expected**:
   - Success notification
   - All prices now display with $ symbol
7. Navigate to Reservations or Dashboard
8. **Verify**: Prices show $3,500 instead of ₹3,500
9. Switch back to INR

### Test Case 11.6: Change Date Format
**Objective**: Modify date display format

**Steps**:
1. On Settings, find **Date Format** option
2. Current format: DD-MMM-YYYY (e.g., 30-JUN-2026)
3. Change to: MM/DD/YYYY (US format)
4. Save changes
5. **Verify**: Dates throughout system update to new format
6. Test on Calendar, Reports, Reservations
7. Change back to DD-MMM-YYYY

### Test Case 11.7: Demo Reset (DANGER ZONE)
**Objective**: Test complete data reset functionality

⚠️ **WARNING**: This will erase ALL data and restore defaults!

**Steps**:
1. On Settings page, scroll to **"Danger Zone"** section (usually at bottom, in red)
2. **Verify Warning Message**: Explains reset will restore all demo data
3. Click **"Reset to Demo Data"** or **"Initialize Demo Reset"**
4. **Expected**: Confirmation modal opens
5. Modal requires typing confirmation word: `RESET`
6. Type: `RESET` in text field (case-sensitive)
7. Click **"Confirm Reset"** button
8. **Expected**:
   - Progress animation (1.5-2 seconds)
   - Shows: "Purging database... Restoring demo data..."
   - Success toast: "All data reset to default curriculum state"
9. **Verify Reset Results**:
   - All reservations reset to demo set
   - All rooms reset to default states
   - Guests reset to demo guests
   - Staff reset to default housekeepers
   - Hotel profile reset to demo hotel
10. Navigate through pages to confirm fresh state

---

## 12. Role-Based Access Testing

### Test Case 12.1: Manager Role - Full Access
**Objective**: Verify manager has complete access

**Steps**:
1. Login or switch to **Manager** role
2. **Test Access to ALL Modules**:
   - ✅ Dashboard - accessible
   - ✅ Room Status - accessible
   - ✅ Reservations - accessible
   - ✅ Check-In - accessible
   - ✅ Check-Out - accessible
   - ✅ Cashiering - accessible
   - ✅ Housekeeping - accessible
   - ✅ Reports - accessible (full access)
   - ✅ Settings - accessible (full access)
3. **Verify Permissions**:
   - Can create/edit/delete reservations
   - Can check-in/check-out guests
   - Can change room statuses
   - Can post charges and payments
   - Can view all financial reports
   - Can modify hotel settings
   - Can reset demo data
4. **Expected**: No access restrictions

### Test Case 12.2: Front Desk Role - Limited Access
**Objective**: Verify front desk restrictions

**Steps**:
1. Login or switch to **Front Desk** role
2. **Test Module Access**:
   - ✅ Dashboard - accessible
   - ✅ Room Status - accessible (view only)
   - ✅ Reservations - accessible (create/edit)
   - ✅ Check-In - accessible (full)
   - ✅ Check-Out - accessible (full)
   - ✅ Cashiering - accessible (full)
   - ❌ Housekeeping - restricted or limited
   - ❌ Reports - restricted (Access Denied)
   - ❌ Settings - restricted (limited to profile view)

3. **Try Accessing Reports**:
   - Click Reports in sidebar
   - **Expected**: Access Denied screen
   - Shows locked icon
   - Message about insufficient permissions

4. **Try Modifying Settings**:
   - Access Settings
   - **Expected**: Cannot change hotel config or reset data
   - Only view own profile

### Test Case 12.3: Housekeeper Role - Department Access
**Objective**: Verify housekeeping-specific access

**Steps**:
1. Login or switch to **Housekeeper Supervisor** role
2. **Test Module Access**:
   - ✅ Dashboard - accessible (limited view)
   - ✅ Room Status - accessible (view only)
   - ✅ Housekeeping - accessible (full access)
   - ❌ Reservations - restricted
   - ❌ Check-In/Check-Out - restricted
   - ❌ Cashiering - restricted (no financial access)
   - ❌ Reports - restricted
   - ❌ Settings - restricted

3. **Verify Housekeeping Functions**:
   - Can view all room statuses
   - Can change room clean/dirty status
   - Can assign rooms to housekeepers
   - Can create maintenance requests
   - Cannot view guest billing
   - Cannot check-in/check-out guests

4. **Try Accessing Cashiering**:
   - **Expected**: Access Denied or redirected

### Test Case 12.4: Auditor Student Role - Read-Only
**Objective**: Verify auditor view-only access

**Steps**:
1. Login or switch to **Auditor Student View** role
2. **Test Module Access**:
   - ✅ Dashboard - accessible (view only)
   - ✅ Room Status - accessible (view only)
   - ✅ Reports - accessible (view only)
   - ❌ Cannot modify any data
   - ❌ No create/edit/delete permissions
   - ❌ No check-in/check-out access
   - ❌ No cashiering access

3. **Try Modifying Data**:
   - Try to create reservation
   - **Expected**: Button disabled or error
   - Try to change room status
   - **Expected**: Action denied

4. **Verify View Permissions**:
   - Can view all reports
   - Can view reservations
   - Cannot edit anything

---

## 13. Additional Testing Scenarios

### Test Case 13.1: Mobile Responsive Design
**Objective**: Test on mobile/tablet devices

**Steps**:
1. Open browser DevTools (F12)
2. Enable device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select device: iPhone 12 Pro or iPad
4. **Test Navigation**:
   - Sidebar should collapse to hamburger menu
   - Bottom navigation bar appears on mobile
   - Room grid adjusts to fewer columns
   - Tables become scrollable

5. **Test Touch Interactions**:
   - Tap room cards
   - Swipe to scroll
   - Use mobile date pickers
   - Bottom sheets slide up properly

6. **Verify Readability**:
   - Text sizes appropriate
   - Buttons large enough to tap
   - No horizontal overflow

### Test Case 13.2: PWA (Progressive Web App) Installation
**Objective**: Test offline capability and installability

**Steps**:
1. In Chrome/Edge, look for install icon in address bar
2. Click **"Install"** or use browser menu
3. **Expected**: App installs as standalone application
4. Launch installed app
5. **Verify**: Opens in standalone window (no browser UI)
6. Test with internet connected
7. **Disconnect Internet**:
   - Turn off Wi-Fi or enable airplane mode
8. Try navigating pages
9. **Expected**: App continues to work offline (cached)
10. Some features may show "Offline" notices
11. Reconnect internet
12. Verify data syncs if needed

### Test Case 13.3: Browser Compatibility
**Objective**: Test across different browsers

**Test in Each Browser**:
- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Mozilla Firefox
- ✅ Safari (Mac/iOS)

**Steps for Each**:
1. Open application
2. Login
3. Navigate all modules
4. Create reservation
5. Check-in guest
6. View reports
7. **Verify**: All features work consistently

### Test Case 13.4: Performance Testing
**Objective**: Verify smooth performance

**Steps**:
1. Open browser DevTools → Performance tab
2. Record while navigating pages
3. **Expected**:
   - Page loads under 2 seconds
   - Smooth 60fps animations
   - No lag when scrolling

4. **Test with Many Rooms**:
   - Open Room Status with all 60 rooms
   - Scroll through grid
   - **Expected**: No performance degradation

5. **Test Filters**:
   - Apply multiple filters rapidly
   - **Expected**: Updates smoothly without delay

### Test Case 13.5: Data Persistence
**Objective**: Verify data saves correctly

**Steps**:
1. Create new reservation
2. Close browser completely
3. Reopen application
4. Login
5. Navigate to Reservations
6. **Expected**: Previously created reservation still exists
7. Make more changes (check-in, add charges)
8. Refresh page (F5)
9. **Expected**: All changes persisted

### Test Case 13.6: Error Handling
**Objective**: Test system handles errors gracefully

**Steps**:
1. **Try Invalid Data**:
   - Create reservation with empty guest name
   - **Expected**: Validation error message
   - Form doesn't submit

2. **Try Overbooking**:
   - Book all rooms of one type
   - Try to book one more
   - **Expected**: Error or upgrade suggestion

3. **Try Check-Out with Debt**:
   - Check-out guest with unpaid balance
   - **Expected**: Warning about outstanding amount

4. **Try Duplicate Actions**:
   - Check-in same reservation twice
   - **Expected**: Error preventing duplicate

---

## 14. Complete User Workflow Test

### Test Case 14.1: End-to-End Guest Journey
**Objective**: Complete full guest cycle from booking to checkout

**Steps**:

**Day 1: Reservation**
1. Login as Manager
2. Create new reservation:
   - Guest: `Alice Williams`
   - Room Type: Deluxe
   - Arrival: Today
   - Departure: Today + 2 days
   - Rate: ₹3,500/night
   - Total: ₹7,000
3. Save reservation
4. **Verify**: Reservation appears in list with "Confirmed" status

**Day 1: Check-In**
5. Go to Check-In page
6. Find Alice Williams in arrivals
7. Click "Quick Check-In"
8. **Verify**: Assigned to vacant room (e.g., Room 301)
9. Go to Room Status page
10. **Verify**: Room 301 shows as Occupied with "Alice Williams"

**Day 1: Post Charges**
11. Go to Cashiering
12. Select Alice Williams
13. Post restaurant charge: ₹500 "Dinner"
14. Post minibar charge: ₹200 "Beverages"
15. **Verify**: Folio shows:
    - Room charge: ₹3,500
    - Restaurant: ₹500
    - Minibar: ₹200
    - Total: ₹4,200

**Day 2: Housekeeping**
16. Guest goes out for day
17. Go to Housekeeping
18. Mark Room 301 as Dirty (guest used room)
19. Assign to housekeeper: Priya Sharma
20. After cleaning, mark as Clean
21. **Verify**: Room status back to "Occupied Clean"

**Day 2: Post More Charges**
22. Go to Cashiering
23. Post laundry charge: ₹300
24. Post second night room charge: ₹3,500
25. **Verify**: Total folio: ₹8,500

**Day 3: Check-Out**
26. Go to Check-Out page
27. Find Alice Williams
28. Review final bill: ₹8,500
29. Post payment: Cash ₹8,500
30. Complete check-out
31. **Verify**:
    - Guest status: Checked-Out
    - Room 301 status: Dirty
    - Balance: ₹0.00

**Day 3: Clean for Next Guest**
32. Go to Housekeeping
33. Clean Room 301
34. Mark as Vacant Clean
35. **Verify**: Room ready to sell again

**Success Criteria**: Complete guest cycle with no errors!

---

## 15. Quick Reference Commands

### Keyboard Shortcuts (if implemented)
- F1: System Update
- F2: HotKey Menu
- F5: Walk-In Reservation
- F9: Search/Lookup
- F12: To-Do List

### Navigation Shortcuts
- Dashboard: Home icon or "Dashboard" in sidebar
- Quick access via toolbar icons
- Breadcrumb navigation (if available)

### Common Actions
- **Create Reservation**: Reservations → + New Reservation
- **Check-In**: Check-In page → Quick Check-In or Manual
- **Check-Out**: Check-Out page → Process Departure
- **View Rooms**: Rooms page or Lookups menu
- **Housekeeping**: Housekeeping page → Click rooms
- **Reports**: Reports page (Manager only)
- **Settings**: Settings → Various configuration tabs

---

## 16. Troubleshooting Guide

### Issue: Login Not Working
**Solution**:
- Verify password is exactly `demo123` (case-sensitive)
- Or use "Enter Demo Mode" button
- Try different role selection
- Clear browser cache and retry

### Issue: Reservation Not Saving
**Solution**:
- Check all required fields have values (marked with *)
- Verify dates are valid (departure after arrival)
- Ensure guest name is not empty
- Check browser console for errors (F12)

### Issue: Room Not Showing
**Solution**:
- Clear all active filters
- Check Floor and Type filters set to "All"
- Clear search field
- Verify 60 rooms total displayed

### Issue: Reports Access Denied
**Solution**:
- Check current role (must be Manager)
- Go to Settings → Role Switcher
- Change to "Hotel Manager"
- Try accessing Reports again

### Issue: Changes Not Persisting
**Solution**:
- Verify using supported browser (Chrome, Edge, Firefox)
- Check localStorage is enabled
- Clear browser cache
- Restart application
- Check if demo reset was triggered

### Issue: Mobile View Broken
**Solution**:
- Ensure viewport width at least 320px
- Try landscape orientation on phone
- Use tablet view for better experience
- Desktop recommended for full features

### Issue: Charts Not Loading
**Solution**:
- Check internet connection (Recharts library)
- Wait for page to fully load
- Refresh page
- Try different browser

---

## 17. Test Data Reference

### Demo Credentials
- **Manager**: Username: Any, Password: `demo123` or empty
- **Front Desk**: Username: Any, Password: `demo123`
- **Housekeeper**: Username: Any, Password: `demo123`

### Sample Guest Names (Pre-loaded Demo Data)
- Raj Kumar
- Priya Sharma
- John Smith
- Sarah Johnson
- Mohamed Ali
- Fatima Hassan

### Housekeeper Staff
- Priya Sharma (Shift: 08:00 - 16:00)
- Anita Das (Shift: 08:00 - 16:00)
- Raju Nair (Shift: 16:00 - 00:00)
- Meena Kaur (Shift: 00:00 - 08:00)

### Room Types
- **STD**: Standard (₹2,500/night)
- **DLX**: Deluxe (₹3,500/night)
- **SUI**: Suite (₹5,000/night)
- **PNH**: Penthouse (₹8,000/night)

### Company Accounts (Corporate)
- TechCorp Solutions
- Global Industries
- Hospitality Group
- Government Agency

### Room Numbers
- **Floor 2**: 201-210 (Standard/Deluxe)
- **Floor 3**: 301-310 (Deluxe)
- **Floor 4**: 401-410 (Deluxe/Suite)
- **Floor 5**: 501-510 (Suite)
- **Floor 6**: 601-610 (Penthouse Suite)
- **Total**: 60 rooms

---

## 18. Success Checklist

After completing all tests, verify:

- [ ] ✅ Can login with all three roles
- [ ] ✅ Dashboard displays correctly
- [ ] ✅ Can view all 60 rooms in grid
- [ ] ✅ Can filter rooms by type, floor, status
- [ ] ✅ Can create new reservation
- [ ] ✅ Can search and link corporate account
- [ ] ✅ Can check-in guest with room assignment
- [ ] ✅ Can post charges to guest folio
- [ ] ✅ Can accept payments
- [ ] ✅ Can check-out guest
- [ ] ✅ Room status updates after checkout (Dirty)
- [ ] ✅ Can assign rooms to housekeepers
- [ ] ✅ Can change room status clean/dirty
- [ ] ✅ Can create maintenance requests
- [ ] ✅ Can view all 6 report types (Manager)
- [ ] ✅ Can export reports to CSV
- [ ] ✅ Revenue charts display correctly
- [ ] ✅ Can switch between roles
- [ ] ✅ Front Desk blocked from Reports (Access Denied)
- [ ] ✅ Can enable/disable Tutorial Mode
- [ ] ✅ Can change currency and date formats
- [ ] ✅ Can modify hotel profile
- [ ] ✅ Can reset demo data
- [ ] ✅ Works on mobile devices
- [ ] ✅ Can install as PWA
- [ ] ✅ Works offline (basic functionality)
- [ ] ✅ Data persists across sessions
- [ ] ✅ Proper error messages shown
- [ ] ✅ Complete guest journey works end-to-end

---

## 19. Learning Objectives

By completing this testing guide, students will have practiced:

1. **Front Desk Operations**
   - Guest registration and reservations
   - Check-in/check-out procedures
   - Room assignment strategies

2. **Cashiering & Billing**
   - Posting charges to guest accounts
   - Payment processing
   - Folio management

3. **Housekeeping Management**
   - Room status tracking
   - Staff assignment and productivity
   - Maintenance coordination

4. **Reporting & Analytics**
   - Generating operational reports
   - Analyzing occupancy and revenue
   - Auditing procedures

5. **System Administration**
   - Role-based access control
   - Hotel configuration
   - Data management

6. **Guest Service Excellence**
   - Complete guest journey management
   - Multi-department coordination
   - Professional PMS workflows

---

## 20. Additional Resources

### Need Help?
- Check README.md for project overview
- Review code comments in source files
- Contact: AMOB University Tourism & Hotel Management Dept.

### Practice Scenarios
After mastering basic tests, try these:

1. **Overbooking Scenario**: Book more rooms than available
2. **VIP Guest Handling**: Create special requests
3. **Group Booking**: Make 10 reservations at once
4. **Weekend Rush**: Simulate full hotel operations
5. **Emergency Maintenance**: Handle multiple OOO rooms
6. **Payment Issues**: Practice handling declined cards
7. **Extended Stays**: Manage month-long reservations
8. **Corporate Contracts**: Negotiate volume discounts

---

## ✅ Conclusion

You now have a complete testing guide covering every feature of the IDS Next Fortune Hotel PMS Trainer. Use this guide to:

- **Learn hotel management systems** systematically
- **Practice realistic workflows** safely
- **Understand role-based operations**
- **Prepare for real-world PMS usage**
- **Train staff and students effectively**

**Remember**: This is a training simulator - feel free to make mistakes, experiment, and learn. Use the Demo Reset feature anytime you want to start fresh!

**Happy Training! 🎓🏨**

---

*Document Version: 1.0*  
*Last Updated: June 30, 2026*  
*For: AMOB University Tourism & Hotel Management*
