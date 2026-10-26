/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * This file defines all roles, permissions, and access control mappings
 * for the Fortune Next v6.5 Hotel Management Training PMS.
 */

// ==================== ROLES CONFIGURATION ====================

export const ROLES = [
  {
    id: "hotel_manager",
    name: "Hotel Manager",
    description: "Full system access with administrative privileges",
    color: "red",
    icon: "ShieldCheck",
    capabilities: [
      "Manage all reservations and billing",
      "Access all reports and analytics",
      "Configure system settings",
      "Manage users and roles"
    ]
  },
  {
    id: "front_office",
    name: "Front Office Agent",
    description: "Handle guest services, reservations, and billing",
    color: "blue",
    icon: "Users",
    capabilities: [
      "Create and manage reservations",
      "Check in/out guests",
      "Process payments and billing",
      "View room status"
    ]
  },
  {
    id: "housekeeping",
    name: "Housekeeping Staff",
    description: "Manage room cleaning and maintenance",
    color: "green",
    icon: "Sparkles",
    capabilities: [
      "Update room status",
      "View assigned rooms",
      "Report maintenance issues",
      "Track cleaning schedules"
    ]
  },
  {
    id: "waiter_fnb",
    name: "Waiter / F&B Staff",
    description: "Manage restaurant orders and billing",
    color: "orange",
    icon: "Coffee",
    capabilities: [
      "Create F&B orders",
      "Manage table assignments",
      "Process F&B payments",
      "Print bills"
    ]
  }
];

// ==================== PERMISSIONS CONFIGURATION ====================

export const PERMISSIONS = {
  // Reservation Management
  RESERVATIONS_VIEW: "reservations.view",
  RESERVATIONS_CREATE: "reservations.create",
  RESERVATIONS_EDIT: "reservations.edit",
  RESERVATIONS_CANCEL: "reservations.cancel",
  
  // Guest Management
  GUESTS_VIEW: "guests.view",
  GUESTS_EDIT: "guests.edit",
  
  // Room Management
  ROOMS_VIEW: "rooms.view",
  ROOMS_CHANGE_STATUS: "rooms.change_status",
  ROOMS_CONFIGURE: "rooms.configure",
  
  // Check-in/Check-out
  CHECKIN_PERFORM: "checkin.perform",
  CHECKOUT_PERFORM: "checkout.perform",
  
  // Billing & Cashiering
  BILLING_POST_CHARGES: "billing.post_charges",
  BILLING_PROCESS_PAYMENTS: "billing.process_payments",
  BILLING_GENERATE_INVOICE: "billing.generate_invoice",
  
  // Housekeeping
  HOUSEKEEPING_VIEW: "housekeeping.view",
  HOUSEKEEPING_UPDATE_STATUS: "housekeeping.update_status",
  HOUSEKEEPING_REPORT_MAINTENANCE: "housekeeping.report_maintenance",
  
  // F&B Operations
  FNB_CREATE_ORDER: "fnb.create_order",
  FNB_MANAGE_TABLES: "fnb.manage_tables",
  FNB_SEND_TO_KITCHEN: "fnb.send_to_kitchen",
  FNB_PRINT_BILL: "fnb.print_bill",
  FNB_PROCESS_PAYMENT: "fnb.process_payment",
  
  // Reports & Analytics
  REPORTS_VIEW: "reports.view",
  ANALYTICS_VIEW: "analytics.view",
  
  // System Administration
  SETTINGS_MANAGE: "settings.manage",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  INVENTORY_MANAGE: "inventory.manage",
  
  // Housekeeping Operations Dashboard
  RESERVATIONS_VIEW_ARRIVALS: "reservations.view_arrivals",
  RESERVATIONS_VIEW_DEPARTURES: "reservations.view_departures",
  RESERVATIONS_VIEW_SUMMARY: "reservations.view_summary"
};

// ==================== ROLE PERMISSIONS MAPPING ====================

export const ROLE_PERMISSIONS = {
  hotel_manager: ["*"], // Wildcard grants all permissions
  
  front_office: [
    PERMISSIONS.RESERVATIONS_VIEW,
    PERMISSIONS.RESERVATIONS_CREATE,
    PERMISSIONS.RESERVATIONS_EDIT,
    PERMISSIONS.RESERVATIONS_CANCEL,
    PERMISSIONS.CHECKIN_PERFORM,
    PERMISSIONS.CHECKOUT_PERFORM,
    PERMISSIONS.ROOMS_VIEW,
    // ROOMS_CHANGE_STATUS intentionally removed: front_office may not manually
    // change room status. Rooms become dirty automatically after check-out.
    PERMISSIONS.GUESTS_VIEW,
    PERMISSIONS.GUESTS_EDIT,
    PERMISSIONS.BILLING_POST_CHARGES,
    PERMISSIONS.BILLING_PROCESS_PAYMENTS,
    PERMISSIONS.BILLING_GENERATE_INVOICE
  ],
  
  housekeeping: [
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.HOUSEKEEPING_VIEW,
    PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS,
    PERMISSIONS.HOUSEKEEPING_REPORT_MAINTENANCE,
    PERMISSIONS.RESERVATIONS_VIEW_ARRIVALS,
    PERMISSIONS.RESERVATIONS_VIEW_DEPARTURES,
    PERMISSIONS.RESERVATIONS_VIEW_SUMMARY
  ],
  
  waiter_fnb: [
    PERMISSIONS.FNB_CREATE_ORDER,
    PERMISSIONS.FNB_MANAGE_TABLES,
    PERMISSIONS.FNB_SEND_TO_KITCHEN,
    PERMISSIONS.FNB_PRINT_BILL,
    PERMISSIONS.FNB_PROCESS_PAYMENT
  ]
};

// ==================== NAVIGATION CONFIGURATION ====================

export const NAV_CONFIG = {
  hotel_manager: {
    defaultDashboard: "/app/dashboard",
    navItems: [
      { path: "/app/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { path: "/app/rooms", label: "Room Status", icon: "Grid" },
      { path: "/app/reservations", label: "Reservations", icon: "Calendar" },
      { path: "/app/reservations/amend", label: "Amend Booking", icon: "FileEdit" },
      { path: "/app/reservations/cancel", label: "Cancel Booking", icon: "Ban" },
      { path: "/app/reservations/assign", label: "Assign Room", icon: "UserCheck" },
      { path: "/app/checkin", label: "Check In", icon: "LogIn" },
      { path: "/app/checkout", label: "Check Out", icon: "LogOut" },
      { path: "/app/cashiering", label: "Cashiering", icon: "Wallet" },
      { path: "/app/housekeeping", label: "Housekeeping", icon: "Sparkles" },
      { path: "/app/reports", label: "Reports", icon: "BarChart3" },
      { path: "/app/settings", label: "Settings", icon: "Settings" }
    ]
  },
  
  front_office: {
    defaultDashboard: "/app/dashboard",
    navItems: [
      { path: "/app/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { path: "/app/rooms", label: "Room Status", icon: "Grid" },
      { path: "/app/reservations", label: "Reservations", icon: "Calendar" },
      { path: "/app/reservations/amend", label: "Amend Booking", icon: "FileEdit" },
      { path: "/app/reservations/cancel", label: "Cancel Booking", icon: "Ban" },
      { path: "/app/reservations/assign", label: "Assign Room", icon: "UserCheck" },
      { path: "/app/checkin", label: "Check In", icon: "LogIn" },
      { path: "/app/checkout", label: "Check Out", icon: "LogOut" },
      { path: "/app/cashiering", label: "Cashiering", icon: "Wallet" },
      { path: "/app/settings", label: "Settings", icon: "Settings" }
    ]
  },
  
  housekeeping: {
    defaultDashboard: "/app/housekeeping",
    navItems: [
      { path: "/app/housekeeping", label: "Housekeeping", icon: "Sparkles" },
      { path: "/app/housekeeping/operations", label: "Today's Operations", icon: "ClipboardList" },
      { path: "/app/rooms", label: "Room Status", icon: "Grid" },
      { path: "/app/settings", label: "Settings", icon: "Settings" }
    ]
  },
  
  waiter_fnb: {
    defaultDashboard: "/waiter",
    navItems: [
      { path: "/waiter", label: "F&B Orders", icon: "Coffee" },
      { path: "/app/settings", label: "Settings", icon: "Settings" }
    ]
  }
};
