import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../contexts/AuthContext';
import { Users, Search, Ban, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
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
          email,
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
        student.email?.toLowerCase().includes(query) ||
        // Also search by student_id if it exists (post-migration)
        (student.student_id && student.student_id.toLowerCase().includes(query))
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
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Email
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
                        {student.student_id || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        {student.student_id && (
                          <div className="text-xs text-gray-500">ID: {student.student_id}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
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
    </div>
  );
};

export default UsersSection;
