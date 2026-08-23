import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth.js";
import { useSupabaseAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DemoLogin from "./pages/Login.jsx"; // Renamed for clarity - legacy demo mode
import Login from "./pages/SupabaseLogin.jsx"; // Primary Supabase login
import Register from "./pages/Register.jsx";
import DeptHeadLayout from "./pages/dept-head/DeptHeadLayout.jsx";
import DashboardSection from "./pages/dept-head/DashboardSection.jsx";
import ApplicantsSection from "./pages/dept-head/ApplicantsSection.jsx";
import UsersSection from "./pages/dept-head/UsersSection.jsx";
import SettingsSection from "./pages/dept-head/SettingsSection.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RoomStatus from "./pages/RoomStatus.jsx";
import Reservations from "./pages/Reservations.jsx";
import NewReservation from "./pages/NewReservation.jsx";
import NewIndividualReservation from "./pages/NewIndividualReservation.jsx";
import NewCompanyReservation from "./pages/NewCompanyReservation.jsx";
import DetailedReservation from "./pages/DetailedReservation.jsx";
import AmendBooking from "./pages/AmendBooking.jsx";
import CancelBooking from "./pages/CancelBooking.jsx";
import AssignRoom from "./pages/AssignRoom.jsx";
import AssignRooms from "./components/reservations/AssignRooms.jsx";
import CheckIn from "./pages/CheckIn.jsx";
import CheckOut from "./pages/CheckOut.jsx";
import Cashiering from "./pages/Cashiering.jsx";
import HouseKeeping from "./pages/HouseKeeping.jsx";
import HousekeepingOperations from "./pages/HousekeepingOperations.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import NotFound from "./pages/NotFound.jsx";
import DiagnosticPage from "./pages/DiagnosticPage.jsx";
import WaiterLanding from "./pages/waiter/WaiterLanding.jsx";
import OutletSelection from "./pages/waiter/OutletSelection.jsx";
import RestaurantSelection from "./pages/waiter/RestaurantSelection.jsx";
import TableSelection from "./pages/waiter/TableSelection.jsx";
import MenuItems from "./pages/waiter/MenuItems.jsx";
import { ProtectedRoute as RBACProtectedRoute } from "./components/auth/ProtectedRoute.jsx";
import { PERMISSIONS } from "./config/rbac.js";
import { useRoleStore } from "./store/useRoleStore.js";

// Route Guard for Authenticated Pages
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { loading } = useSupabaseAuth();

  // Wait for AuthContext to finish resolving the session before deciding
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ids-header mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Redirect waiter_fnb role away from the hotel dashboard to their own F&B dashboard
const DashboardOrWaiter = () => {
  const currentRole = useRoleStore((state) => state.currentRole);
  if (currentRole === "waiter_fnb") {
    return <Navigate to="/app/waiter" replace />;
  }
  return <Dashboard />;
};

// Route Guard for Auth Pages (redirect to appropriate dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { loading } = useSupabaseAuth();

  // Wait for session to resolve — prevents the login page flashing before redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ids-header mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm font-semibold">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return children;
  }
  
  // Redirect based on auth role
  const authRole = currentUser?.authRole;
  if (authRole === 'admin') {
    return <Navigate to="/app/admin" replace />;
  } else if (authRole === 'dept_head') {
    return <Navigate to="/dept-head" replace />;
  } else {
    return <Navigate to="/app/dashboard" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      {/* Toast Notification Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: "12px",
            fontFamily: "sans-serif",
            fontWeight: 600,
            border: "1px solid var(--color-ids-border)",
            background: "#ffffff",
            color: "var(--color-ids-sidebar)",
            marginTop: "80px", // Push toasts below sticky headers
          },
        }}
      />

      <Routes>
        {/* Landing Page - Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Auth Routes - Supabase Authentication */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Department Head Dashboard - Protected by role with nested routes */}
        <Route
          path="/dept-head"
          element={
            <ProtectedRoute>
              <RBACProtectedRoute requireRole="dept_head">
                <DeptHeadLayout />
              </RBACProtectedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardSection />} />
          <Route path="applicants" element={<ApplicantsSection />} />
          <Route path="users" element={<UsersSection />} />
          <Route path="settings" element={<SettingsSection />} />
        </Route>

        {/* Legacy Demo Login (for backward compatibility during development) */}
        <Route
          path="/demo-login"
          element={
            <PublicRoute>
              <DemoLogin />
            </PublicRoute>
          }
        />

        {/* Private Layout-nested App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default entrypoint redirects to dashboard */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOrWaiter />} />
          <Route 
            path="rooms" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.ROOMS_VIEW]}>
                <RoomStatus />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_VIEW]}>
                <Reservations />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/new" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_CREATE]}>
                <NewReservation />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/new/individual" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_CREATE]}>
                <NewIndividualReservation />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/new/company" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_CREATE]}>
                <NewCompanyReservation />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/amend" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_EDIT]}>
                <AmendBooking />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/cancel" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_CANCEL]}>
                <CancelBooking />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/assign" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_EDIT]}>
                <AssignRoom />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/:id" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_VIEW]}>
                <DetailedReservation />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reservations/:id/assign" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_EDIT]}>
                <AssignRooms />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="checkin" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.CHECKIN_PERFORM]}>
                <CheckIn />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="checkout" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.CHECKOUT_PERFORM]}>
                <CheckOut />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="cashiering" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.BILLING_POST_CHARGES]}>
                <Cashiering />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="housekeeping" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.HOUSEKEEPING_VIEW]}>
                <HouseKeeping />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="housekeeping/operations" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_VIEW_SUMMARY]}>
                <HousekeepingOperations />
              </RBACProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <RBACProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}>
                <Reports />
              </RBACProtectedRoute>
            } 
          />
          <Route path="settings" element={<Settings />} />
          <Route path="diagnostic" element={<DiagnosticPage />} />
          {/* Waiter F&B dashboard inside AppLayout so sidebar is visible */}
          <Route
            path="waiter"
            element={<WaiterLanding />}
          />
        </Route>

        {/* Waiter routes (protected by waiter_fnb role) - OUTSIDE AppLayout for full-screen POS interface */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute>
              <WaiterLanding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter/select-outlet"
          element={
            <ProtectedRoute>
              <OutletSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter/select-restaurant"
          element={
            <ProtectedRoute>
              <RestaurantSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter/select-table"
          element={
            <ProtectedRoute>
              <TableSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter/menu"
          element={
            <ProtectedRoute>
              <MenuItems />
            </ProtectedRoute>
          }
        />

        {/* Force password change — shown to any logged-in user with must_change_password=true */}
        {/* Uses base ProtectedRoute only (requires login) — no RBAC wrapper, no AppLayout */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<NotFound />} />      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
