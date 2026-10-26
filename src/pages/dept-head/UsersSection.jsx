import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../contexts/AuthContext';
import { Users, Search, Ban, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck, KeyRound, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ReasonModal } from '../../components/dept-head/ReasonModal';
import { DeleteConfirmModal } from '../../components/dept-head/DeleteConfirmModal';

// ─── Reset-password confirm modal ────────────────────────────────────────────
const ResetConfirmModal = ({ isOpen, student, onConfirm, onClose, loading }) => {
  if (!isOpen || !student) return null;
  const displayId = student.student_id || student.university_id || student.id.slice(0, 8);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-ids-sidebar text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-bold">Reset Password</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-700">
            Generate a new temporary password for{' '}
            <span className="font-bold text-gray-900">{student.full_name}</span>{' '}
            (<span className="font-mono font-semibold">{displayId}</span>)?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Their old password will stop working immediately.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ids-header hover:bg-ids-sidebar rounded transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                Resetting…
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                Reset Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Temp-password result modal ───────────────────────────────────────────────
const TempPasswordModal = ({ isOpen, studentName, tempPassword, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tempPassword) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-bold">Temporary Password</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            Password reset for <span className="font-bold text-gray-900">{studentName}</span>:
          </p>

          {/* Password display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-900 text-green-400 font-mono text-xl font-bold tracking-widest px-4 py-3 rounded select-all text-center">
              {tempPassword}
            </div>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-semibold rounded transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Security notice */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 font-medium space-y-1">
            <p className="font-bold uppercase tracking-wide text-amber-900">⚠ Shown once — not stored anywhere</p>
            <p>Give it to the student <span className="font-bold">privately</span>. They must change it at next login.</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-ids-header hover:bg-ids-sidebar rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
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

  // Reset password state
  const [resetConfirmState, setResetConfirmState] = useState({
    isOpen: false,
    student: null,
    loading: false,
  });
  const [tempPasswordModal, setTempPasswordModal] = useState({
    isOpen: false,
    studentName: '',
    tempPassword: '', // never logged, never stored outside this ephemeral state
  });

  useEffect(() => {
    if (profile?.department_id) {
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
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          status,
          created_at,
          rejected_reason,
          banned_reason,
          student_id,
          university_id
        `)
        .eq('role', 'student')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.full_name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.student_id?.toLowerCase().includes(query) ||
        student.university_id?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  // ── Ban / Unban / Delete handlers (unchanged) ──────────────────────────────

  const openBanModal = (student) => setBanModalState({ isOpen: true, student, loading: false });
  const closeBanModal = () => {
    if (banModalState.loading) return;
    setBanModalState({ isOpen: false, student: null, loading: false });
  };

  const openUnbanModal = (student) => setUnbanModalState({ isOpen: true, student, loading: false });
  const closeUnbanModal = () => {
    if (unbanModalState.loading) return;
    setUnbanModalState({ isOpen: false, student: null, loading: false });
  };

  const openDeleteModal = (student) => setDeleteModalState({ isOpen: true, student, loading: false });
  const closeDeleteModal = () => {
    if (deleteModalState.loading) return;
    setDeleteModalState({ isOpen: false, student: null, loading: false });
  };

  const handleBan = async (reason) => {
    const { student } = banModalState;
    setBanModalState(prev => ({ ...prev, loading: true }));
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'banned', banned_reason: reason })
        .eq('id', student.id);
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('approval_log')
        .insert({ student_id: student.id, action: 'banned', reason, actor_id: profile.id });
      if (logError) throw logError;

      toast.success(`${student.full_name} has been banned`);
      setStudents(prev => prev.map(s =>
        s.id === student.id ? { ...s, status: 'banned', banned_reason: reason } : s
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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'approved', banned_reason: null })
        .eq('id', student.id);
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('approval_log')
        .insert({ student_id: student.id, action: 'unbanned', reason, actor_id: profile.id });
      if (logError) throw logError;

      toast.success(`${student.full_name} has been unbanned`);
      setStudents(prev => prev.map(s =>
        s.id === student.id ? { ...s, status: 'approved', banned_reason: null } : s
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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'deleted' })
        .eq('id', student.id);
      if (updateError) throw updateError;

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
      setStudents(prev => prev.filter(s => s.id !== student.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
      setDeleteModalState(prev => ({ ...prev, loading: false }));
    }
  };

  // ── Reset password handlers ────────────────────────────────────────────────

  const openResetConfirm = (student) =>
    setResetConfirmState({ isOpen: true, student, loading: false });

  const closeResetConfirm = () => {
    if (resetConfirmState.loading) return;
    setResetConfirmState({ isOpen: false, student: null, loading: false });
  };

  const handleResetPassword = async () => {
    const { student } = resetConfirmState;
    setResetConfirmState(prev => ({ ...prev, loading: true }));
    try {
      const { data, error } = await supabase.functions.invoke('reset-student-password', {
        body: { student_id: student.id },
      });

      if (error) {
        // edge function HTTP error — try to parse body
        let msg = 'Password reset failed';
        try {
          const parsed = typeof error === 'string' ? JSON.parse(error) : error;
          msg = parsed?.message || parsed?.error || msg;
        } catch (_) { /* ignore parse error */ }
        toast.error(msg);
        setResetConfirmState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setResetConfirmState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Success — close confirm, show temp password once
      closeResetConfirm();
      setTempPasswordModal({
        isOpen: true,
        studentName: student.full_name,
        tempPassword: data.temp_password, // ephemeral — cleared on modal close
      });
    } catch (err) {
      toast.error(err.message || 'Password reset failed');
      setResetConfirmState(prev => ({ ...prev, loading: false }));
    }
  };

  const closeTempPasswordModal = () => {
    // Wipe the password from state immediately — never leave it around
    setTempPasswordModal({ isOpen: false, studentName: '', tempPassword: '' });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getStudentDisplayId = (student) =>
    student.student_id || student.university_id || null;

  const getStatusBadge = (status) => {
    const badges = {
      pending:  { icon: Clock,         bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending'  },
      approved: { icon: CheckCircle,   bg: 'bg-green-100',  text: 'text-green-800',  label: 'Approved' },
      rejected: { icon: XCircle,       bg: 'bg-red-100',    text: 'text-red-800',    label: 'Rejected' },
      banned:   { icon: Ban,           bg: 'bg-red-100',    text: 'text-red-800',    label: 'Banned'   },
      disabled: { icon: AlertTriangle, bg: 'bg-gray-100',   text: 'text-gray-800',   label: 'Disabled' },
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600 mt-1">Manage all students in your department</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Registered</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const displayId = getStudentDisplayId(student);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-ids-header rounded-full flex items-center justify-center text-white font-bold">
                              {student.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900">{student.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-800 font-semibold">
                          {displayId ?? <span className="text-gray-400 font-sans font-normal text-xs">Not set</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(student.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Ban — only for approved students */}
                            {student.status === 'approved' && (
                              <button
                                onClick={() => openBanModal(student)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded transition-colors"
                                title="Ban Student"
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                Ban
                              </button>
                            )}

                            {/* Unban — only for banned students */}
                            {student.status === 'banned' && (
                              <button
                                onClick={() => openUnbanModal(student)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                                title="Unban Student"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                Unban
                              </button>
                            )}

                            {/* Reset Password — all statuses except deleted */}
                            {student.status !== 'deleted' && (
                              <button
                                onClick={() => openResetConfirm(student)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5 mr-1" />
                                Reset PW
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => openDeleteModal(student)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        actionType="reject"
        loading={banModalState.loading}
      />

      {/* Unban Modal */}
      <ReasonModal
        isOpen={unbanModalState.isOpen}
        onClose={closeUnbanModal}
        onSubmit={handleUnban}
        title="Unban Student"
        studentName={unbanModalState.student?.full_name || ''}
        actionType="approve"
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

      {/* Reset Password Confirm Modal */}
      <ResetConfirmModal
        isOpen={resetConfirmState.isOpen}
        student={resetConfirmState.student}
        onConfirm={handleResetPassword}
        onClose={closeResetConfirm}
        loading={resetConfirmState.loading}
      />

      {/* Temp Password Result Modal */}
      <TempPasswordModal
        isOpen={tempPasswordModal.isOpen}
        studentName={tempPasswordModal.studentName}
        tempPassword={tempPasswordModal.tempPassword}
        onClose={closeTempPasswordModal}
      />
    </div>
  );
};

export default UsersSection;
