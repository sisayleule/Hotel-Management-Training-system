import React from 'react';
import { useSupabaseAuth } from '../contexts/AuthContext';
import { useHotelStore } from '../store/useHotelStore';
import { useRoleStore } from '../store/useRoleStore';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/rbac';

export const DiagnosticPage = () => {
  const { user, profile, loading } = useSupabaseAuth();
  const currentUser = useHotelStore((state) => state.currentUser);
  const roleState = useRoleStore((state) => ({
    currentRole: state.currentRole,
    permissions: state.permissions,
    demoMode: state.demoMode
  }));
  const { can, canAll, roleName } = usePermissions();
  
  const hasReservationsEdit = can(PERMISSIONS.RESERVATIONS_EDIT);
  const hasReservationsView = can(PERMISSIONS.RESERVATIONS_VIEW);
  const hasReservationsCancel = can(PERMISSIONS.RESERVATIONS_CANCEL);
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">RBAC Diagnostic Page</h1>
      
      <div className="space-y-6">
        {/* Auth Context */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Auth Context (Supabase)</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>Loading:</strong> {loading ? 'true' : 'false'}</div>
            <div><strong>User ID:</strong> {user?.id || 'null'}</div>
            <div><strong>User Email:</strong> {user?.email || 'null'}</div>
            <div><strong>Profile Role:</strong> {profile?.role || 'null'}</div>
            <div><strong>Profile Status:</strong> {profile?.status || 'null'}</div>
            <div><strong>Profile Training Role:</strong> {profile?.training_role || 'null'}</div>
          </div>
        </div>
        
        {/* Hotel Store */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Hotel Store (Zustand)</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>Current User:</strong> {currentUser ? 'exists' : 'null'}</div>
            <div><strong>Full Name:</strong> {currentUser?.full_name || 'null'}</div>
            <div><strong>Auth Role:</strong> {currentUser?.authRole || 'null'}</div>
            <div><strong>Training Role:</strong> {currentUser?.role || 'null'}</div>
            <div><strong>Username:</strong> {currentUser?.username || 'null'}</div>
          </div>
        </div>
        
        {/* Role Store */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Role Store (RBAC)</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>Current Role:</strong> {roleState.currentRole || 'null'}</div>
            <div><strong>Role Name:</strong> {roleName || 'null'}</div>
            <div><strong>Demo Mode:</strong> {roleState.demoMode ? 'true' : 'false'}</div>
            <div><strong>Permissions Count:</strong> {roleState.permissions?.length || 0}</div>
            <div className="mt-2">
              <strong>Permissions:</strong>
              <div className="ml-4 mt-2 max-h-40 overflow-y-auto">
                {roleState.permissions?.map((perm, idx) => (
                  <div key={idx} className="text-xs text-gray-600">{perm}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Permission Checks */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Permission Checks</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${hasReservationsView ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <strong>RESERVATIONS_VIEW:</strong> {hasReservationsView ? 'GRANTED' : 'DENIED'}
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${hasReservationsEdit ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <strong>RESERVATIONS_EDIT:</strong> {hasReservationsEdit ? 'GRANTED' : 'DENIED'}
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${hasReservationsCancel ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <strong>RESERVATIONS_CANCEL:</strong> {hasReservationsCancel ? 'GRANTED' : 'DENIED'}
            </div>
          </div>
        </div>
        
        {/* localStorage Check */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">localStorage</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>pms_demo_role:</strong> {localStorage.getItem('pms_demo_role') || 'null'}</div>
            <div><strong>hotel-storage:</strong> {localStorage.getItem('hotel-storage') ? 'exists' : 'null'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
