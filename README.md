# Fortune Next v6.5 — Academic Hotel Management Training PMS

Welcome to the **Fortune Next v6.5 Hotel Management Training PMS**, a bespoke, full-featured simulation environment engineered specifically for **AMOB University Tourism & Hotel Management** students and instructors.

This application is designed to simulate the industry-standard **IDS Next PMS (Property Management System)**, matching its beige-on-slate, high-contrast, functional display schemas while introducing modern, interactive learning helpers.

---

## 🚀 Key Modules & Student Features

### 1. 🧹 Housekeeping & Hygiene Board (`/housekeeping`)
*   **Stats Summaries**: Live trackers for Dirty Rooms count, Clean Rooms, and overall Cleanliness ratios.
*   **Active Staff Registry**: Collapsible manager pane summarizing assigned housekeeper keys (Priya Sharma, Anita Das, Raju Nair, Meena Kaur), shifts, and rooms cleaned.
*   **Slide-Over Service Cards**: Tap any room key to load a detailed inspection card to append shift comments, assign rooms to housekeepers, and toggle physical condition flags.
*   **Maintenance Dispatch Logs**: Send malfunctioning or dirty units directly to "Maintenance Required" states, which logs detailed repair tickets (Plumbing, Electrical, AC) and blocks rooms as **Out of Order**.
*   **Fast State Transitions**: One-click actions to instantly release vacant clean rooms, flag dirty units, or force checkout guest folios.

### 2. 📊 Property Reports & Audits Hub (`/reports`)
Access six highly detailed, printable, and exportable (CSV format) PMS reports under role-based security:
*   **Detailed Position (GSTBLK)**: Tracks blocked rooms, active holds, department codes, and manager/staff notes.
*   **Expected Arrivals Report**: Daily arriving lists featuring expected arrival times, room tiers, nights stayed, pay plans, and corporate affiliations.
*   **Expected Departures Report**: Checkout tracking logs, overdue departures, charges, received cashiering, and outstanding billing balances.
*   **In-House Guest Registry**: Active checked-in occupant catalog featuring room floor breakdowns, guest headcounts, VIP stars, and total outstanding ledger balances.
*   **Room Status & Cleanliness**: An aggregated 60-room category occupancy matrix with real-time percentages and progress indicators.
*   **Revenue & Yield Charts**: Beautiful SVG-rendered charts utilizing **Recharts** to track collected funds against outstanding bills per room tier.

### 3. ⚙️ PMS System Configurations (`/settings`)
*   **Hotel Profile Form**: Modify property name, code, city, country, phone, and GSTIN formats appearing on printable bills and folios.
*   **Demo Role Switcher**: Change active session clearance levels on-the-fly (**Hotel Manager**, **Front Desk Agent**, **Housekeeper Supervisor**, **Auditor Student View**) to experience different clearance workflows.
*   **Academic Training Switch**: Toggle *Interactive Tutorial Guidance Advice* to display educational definitions above form inputs (e.g. Folio, ADR, Market Segment, Bookings Source).
*   **System Display Formats**: Toggle default currencies (INR ₹, USD $, EUR €) and date formats (DD-MMM-YYYY).
*   **Danger Zone Double-Confirmation Reset**: A secure modal requiring typing "RESET" with a 1.5s database purge sequence to revert all rooms, folios, staff, and logs back to default curriculum parameters.

### 4. 🔏 Role-Based Access Control (RBAC)
*   **RoleGuard wrapper**: Route and button-level protection.
*   **Access Restricted view**: If a Front Desk Agent attempts to open Manager Reports, they are greeted by a locked screen explaining role restrictions and prompting them to practice switching roles inside Settings.

### 5. 📱 PWA & Offline Support
*   **Service Worker integration**: Custom `sw.js` script with network-first fallback caching to run the training PMS offline reliably.
*   **PWA Manifest configuration**: Optimized for standalone display, custom theme colors, and responsive layout scaling across all tablets, laptops, and viewports.

---

## 📂 File Architecture Guide

*   `src/store/useHotelStore.js`: Zustand central state controller managing room data, reservations, guests, housekeeper registry, hotel profile, tutorial states, and reset actions.
*   `src/components/auth/RoleGuard.jsx`: Route/component-level permissions gate.
*   `src/components/auth/AccessDenied.jsx`: Sleek, locked restricted access card.
*   `src/components/settings/TutorialTooltip.jsx`: Renders PMS terminology guides when Tutorial Mode is toggled on.
*   `src/components/settings/DemoResetModal.jsx`: Double-confirmation database purging workflow.
*   `src/components/housekeeping/HouseKeepingCard.jsx`: Interactive slide-over room-state panel.
*   `src/components/housekeeping/HousekeeperAssign.jsx`: Collapsible housekeeper roster list.
*   `src/components/reports/*`: Specialized reports tables and SVG charts (GSTBLK, Arrivals, Departures, Inhouse, Room Status, Revenue).
*   `src/pages/HouseKeeping.jsx`: Entrypoint of Housekeeping board.
*   `src/pages/Reports.jsx`: Centralised manager Reports Hub.
*   `src/pages/Settings.jsx`: Tabbed system configuration dashboard.
*   `public/sw.js` & `public/manifest.json`: Offline PWA service engines.

---

*Engineered with precision for AMOB University. Practice hotel management systems with confidence!*
