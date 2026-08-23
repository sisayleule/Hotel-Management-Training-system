import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../contexts/AuthContext';
import { Users, Search, Ban, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck, KeyRound, Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { ReasonModal } from '../../components/dept-head/ReasonModal';
import { DeleteConfirmModal } from '../../components/dept-head/DeleteConfirmModal';

export const UsersSection = () => {
  const { profile } = useSupabaseAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected', 'banned'
  
  const [banModalState, setBanModalState] = useState({
    isOpen: false,
    student: null,
    loading: false,
  });

  const [unbanModalState, setUnbanModalState] = useState({
    isOpen: false,
    student: null,
    loading: false,
  });

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    student: null,
    loading: false,
  });

  // Reset password modal — two phases:
  //   phase: 'confirm'  → ask dept head to confirm the action
  //   phase: 'result'   → show the generated temp password once
  const [resetModalState, setResetModalState] = useState({
    isOpen:      false,
    phase:       'confirm',   // 'confirm' | 'result'
    student:     null,
    loading:     false,
    tempPassword: null,
    showPassword: false,
  });

  useEffect(() => {
    if (profile) {
      fetchStudents();
    }
  }, [profile]);

  // Filter students whenever search or status filter changes
  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Query all students in department (excluding soft-deleted)
      // Note: student_id column removed from query as it doesn't exist yet in the database
      // TODO: Once migrations/fix_realtime_setup.sql is run, add student_id back:
      //   1. Add "student_id," to the select list below
      //   2. Update the search filter to include student_id
      //   3. The UI already handles displaying student_id if present
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          university_id,
          status,
          created_at,
          rejected_reason,
          banned_reason
        `)
        .eq('role', 'student')
        .neq('status', 'deleted') // Hide soft-deleted accounts
        .order('created_at', { ascending: false});

      // Only filter by department if the dept head has a department_id
      if (profile?.department_id) {
        query = query.eq('department_id', profile.department_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(query) ||
        (student.university_id && student.university_id.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const openBanModal = (student) => {
    setBanModalState({
      isOpen: true,
      student,
      loading: false,
    });
  };

  const closeBanModal = () => {
    if (banModalState.loading) return;
    setBanModalState({
      isOpen: false,
      student: null,
      loading: false,
    });
  };

  const openUnbanModal = (student) => {
    setUnbanModalState({
      isOpen: true,
      student,
      loading: false,
    });
  };

  const closeUnbanModal = () => {
    if (unbanModalState.loading) return;
    setUnbanModalState({
      isOpen: false,
      student: null,
      loading: false,
    });
  };

  const openDeleteModal = (student) => {
    setDeleteModalState({
      isOpen: true,
      student,
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    if (deleteModalState.loading) return;
    setDeleteModalState({
      isOpen: false,
      student: null,
      loading: false,
    });
  };

  // ── Reset Password handlers ───────────────────────────────────────────────
  const openResetModal = (student) => {
    setResetModalState({
      isOpen:       true,
      phase:        'confirm',
      student,
      loading:      false,
      tempPassword: null,
      showPassword: false,
    });
  };

  const closeResetModal = () => {
    if (resetModalState.loading) return;
    setResetModalState({
      isOpen:       false,
      phase:        'confirm',
      student:      null,
      loading:      false,
      tempPassword: null,
      showPassword: false,
    });
  };

  const handleResetPassword = async () => {
    const { student } = resetModalState;
    setResetModalState(prev => ({ ...prev, loading: true }));

    try {
      // Call the edge function — passes the dept head's JWT automatically.
      // The service-role key never touches the frontend; it lives in Deno env only.
      const { data, error } = await supabase.functions.invoke(
        'reset-student-password',
        { body: { student_id: student.id } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Move to result phase — show the temp password once
      setResetModalState(prev => ({
        ...prev,
        loading:      false,
        phase:        'result',
        tempPassword: data.temp_password,
      }));

    } catch (err) {
      console.error('Password reset failed:', err);
      toast.error(`Password reset failed: ${err.message}`);
      setResetModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const copyTempPassword = () => {
    if (!resetModalState.tempPassword) return;
    navigator.clipboard.writeText(resetModalState.tempPassword)
      .then(() => toast.success('Temporary password copied to clipboard'))
      .catch(() => toast.error('Could not copy — please select and copy manually'));
  };

  const handleBan = async (reason) => {
    const { student } = banModalState;
    setBanModalState(prev => ({ ...prev, loading: true }));

    try {
      // Step 1: Update profile status and banned_reason
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'banned',
          banned_reason: reason
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Step 2: Insert into approval_log
      const { error: logError } = await supabase
        .from('approval_log')
        .insert({
          student_id: student.id,
          action: 'banned',
          reason: reason,
          actor_id: profile.id,
        });

      if (logError) throw logError;

      toast.success(`${student.full_name} has been banned`);
      
      // Update student in list
      setStudents(prev => prev.map(s => 
        s.id === student.id 
          ? { ...s, status: 'banned', banned_reason: reason }
          : s
      ));
      
      closeBanModal();
    } catch (error) {
      console.error('Error banning student:', error);
      toast.error('Failed to ban student');
      setBanModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUnban = async (reason) => {
    const { student } = unbanModalState;
    setUnbanModalState(prev => ({ ...prev, loading: true }));

    try {
      // Step 1: Update profile status to 'approved'
      // Clear banned_reason when unbanning
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          banned_reason: null
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Step 2: Insert into approval_log
      const { error: logError } = await supabase
        .from('approval_log')
        .insert({
          student_id: student.id,
          action: 'unbanned',
          reason: reason,
          actor_id: profile.id,
        });

      if (logError) throw logError;

      toast.success(`${student.full_name} has been unbanned`);
      
      // Update student in list
      setStudents(prev => prev.map(s => 
        s.id === student.id 
          ? { ...s, status: 'approved', banned_reason: null }
          : s
      ));
      
      closeUnbanModal();
    } catch (error) {
      console.error('Error unbanning student:', error);
      toast.error('Failed to unban student');
      setUnbanModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = async () => {
    const { student } = deleteModalState;
    setDeleteModalState(prev => ({ ...prev, loading: true }));

    try {
      // Soft delete: set status to 'deleted' (don't actually delete the row)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'deleted' })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Log the deletion
      const { error: logError } = await supabase
        .from('approval_log')
        .insert({
          student_id: student.id,
          action: 'deleted',
          reason: 'Account soft-deleted by department head',
          actor_id: profile.id,
        });

      if (logError) throw logError;

      toast.success(`${student.full_name}'s account has been deleted`);
      
      // Remove from list (soft-deleted accounts are hidden)
      setStudents(prev => prev.filter(s => s.id !== student.id));
      
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
      setDeleteModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: Clock,
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending'
      },
      approved: {
        icon: CheckCircle,
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Approved'
      },
      rejected: {
        icon: XCircle,
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Rejected'
      },
      banned: {
        icon: Ban,
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Banned'
      },
      disabled: {
        icon: AlertTriangle,
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: 'Disabled'
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage all students in your department
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-header focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-header focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 font-medium">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ids-header mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No Students Found' : 'No Students Yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Students will appear here once they register'}
              </p>
            </div>
          ) : (
            // Students Table
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      University ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-ids-header rounded-full flex items-center justify-center text-white font-bold">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-800 font-semibold">
                        {student.university_id || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Reset Password — approved students only */}
                          {student.status === 'approved' && (
                            <button
                              onClick={() => openResetModal(student)}
                              className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors"
                              title="Reset Student Password"
                            >
                              <KeyRound className="w-4 h-4 mr-1" />
                              Reset PW
                            </button>
                          )}

                          {/* Ban button - only for approved students */}
                          {student.status === 'approved' && (
                            <button
                              onClick={() => openBanModal(student)}
                              className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded transition-colors"
                              title="Ban Student"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban
                            </button>
                          )}
                          
                          {/* Unban button - only for banned students */}
                          {student.status === 'banned' && (
                            <button
                              onClick={() => openUnbanModal(student)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                              title="Unban Student"
                            >
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Unban
                            </button>
                          )}
                          
                          {/* Delete button - for any status */}
                          <button
                            onClick={() => openDeleteModal(student)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ban Modal */}
      <ReasonModal
        isOpen={banModalState.isOpen}
        onClose={closeBanModal}
        onSubmit={handleBan}
        title="Ban Student"
        studentName={banModalState.student?.full_name || ''}
        actionType="reject" // Use red theme like reject
        loading={banModalState.loading}
      />

      {/* Unban Modal */}
      <ReasonModal
        isOpen={unbanModalState.isOpen}
        onClose={closeUnbanModal}
        onSubmit={handleUnban}
        title="Unban Student"
        studentName={unbanModalState.student?.full_name || ''}
        actionType="approve" // Use green theme like approve
        loading={unbanModalState.loading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        studentName={deleteModalState.student?.full_name || ''}
        loading={deleteModalState.loading}
      />

      {/* ── Reset Password Modal ─────────────────────────────────────────── */}
      {resetModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-white shrink-0" />
              <h3 className="text-white font-bold text-base">
                {resetModalState.phase === 'confirm'
                  ? 'Reset Student Password'
                  : 'Temporary Password Generated'}
              </h3>
            </div>

            {/* ── PHASE: confirm ── */}
            {resetModalState.phase === 'confirm' && (
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-gray-700">
                  You are about to reset the password for:
                </p>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {resetModalState.student?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-indigo-900 text-sm">
                      {resetModalState.student?.full_name}
                    </p>
                    <p className="text-indigo-600 text-xs font-mono">
                      {resetModalState.student?.university_id || 'No University ID'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  A secure temporary password will be generated. You must share it
                  with the student through a secure channel. The password will be
                  shown <strong>once only</strong> and is not stored anywhere.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeResetModal}
                    disabled={resetModalState.loading}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetModalState.loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetModalState.loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting…
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Generate Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── PHASE: result ── */}
            {resetModalState.phase === 'result' && (
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    This password is shown <strong>once only</strong>. Copy it now
                    and share it with <strong>{resetModalState.student?.full_name}</strong> through
                    a secure channel. It will not be retrievable after you close this dialog.
                  </p>
                </div>

                {/* Password display box */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Temporary Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-900 text-green-400 font-mono font-bold text-lg px-4 py-3 rounded-lg tracking-widest select-all">
                      {resetModalState.showPassword
                        ? resetModalState.tempPassword
                        : '••••••••••••'}
                    </div>
                    <button
                      onClick={() =>
                        setResetModalState(prev => ({
                          ...prev,
                          showPassword: !prev.showPassword,
                        }))
                      }
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title={resetModalState.showPassword ? 'Hide password' : 'Show password'}
                    >
                      {resetModalState.showPassword
                        ? <EyeOff className="w-4 h-4 text-gray-600" />
                        : <Eye className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button
                      onClick={copyTempPassword}
                      className="p-2.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 text-indigo-700" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Student logs in with:</p>
                  <p className="text-xs font-mono text-gray-700">
                    ID: <span className="font-bold">{resetModalState.student?.university_id}</span>
                  </p>
                  <p className="text-xs font-mono text-gray-700">
                    Password: <span className="font-bold">
                      {resetModalState.showPassword
                        ? resetModalState.tempPassword
                        : '(shown above)'}
                    </span>
                  </p>
                </div>

                <button
                  onClick={closeResetModal}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors"
                >
                  I have noted this down — Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default UsersSection;
