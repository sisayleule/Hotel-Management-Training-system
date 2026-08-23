import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { ReasonModal } from '../../components/dept-head/ReasonModal';

export const ApplicantsSection = () => {
  const { profile } = useSupabaseAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false,
    actionType: null, // 'approve' or 'reject'
    student: null,
    loading: false,
  });

  useEffect(() => {
    if (profile) {
      fetchPendingStudents();
    }
  }, [profile]);

  const fetchPendingStudents = async () => {
    setLoading(true);
    try {
      // Query profiles for pending students
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          university_id,
          created_at,
          department_id
        `)
        .eq('role', 'student')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Only filter by department if the dept head has one assigned
      if (profile?.department_id) {
        query = query.eq('department_id', profile.department_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPendingStudents(data || []);
    } catch (error) {
      console.error('Error fetching pending students:', error);
      toast.error('Failed to load pending students');
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (student) => {
    setModalState({
      isOpen: true,
      actionType: 'approve',
      student,
      loading: false,
    });
  };

  const openRejectModal = (student) => {
    setModalState({
      isOpen: true,
      actionType: 'reject',
      student,
      loading: false,
    });
  };

  const closeModal = () => {
    if (modalState.loading) return; // Prevent closing while processing
    setModalState({
      isOpen: false,
      actionType: null,
      student: null,
      loading: false,
    });
  };

  const handleApprove = async (reason) => {
    const { student } = modalState;
    setModalState(prev => ({ ...prev, loading: true }));

    try {
      // Step 1: Update profile status and approval_reason
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          approval_reason: reason
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Step 2: Insert into approval_log
      const { error: logError } = await supabase
        .from('approval_log')
        .insert({
          student_id: student.id,
          action: 'approved',
          reason: reason,
          actor_id: profile.id,
        });

      if (logError) throw logError;

      toast.success(`${student.full_name} has been approved!`);
      
      // Remove from list optimistically
      setPendingStudents(prev => prev.filter(s => s.id !== student.id));
      
      // Close modal
      closeModal();
    } catch (error) {
      console.error('Error approving student:', error);
      toast.error('Failed to approve student');
      setModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReject = async (reason) => {
    const { student } = modalState;
    setModalState(prev => ({ ...prev, loading: true }));

    try {
      // Step 1: Update profile status and rejected_reason
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          rejected_reason: reason
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Step 2: Insert into approval_log
      const { error: logError } = await supabase
        .from('approval_log')
        .insert({
          student_id: student.id,
          action: 'rejected',
          reason: reason,
          actor_id: profile.id,
        });

      if (logError) throw logError;

      toast.success(`${student.full_name}'s registration has been rejected`);
      
      // Remove from list optimistically
      setPendingStudents(prev => prev.filter(s => s.id !== student.id));
      
      // Close modal
      closeModal();
    } catch (error) {
      console.error('Error rejecting student:', error);
      toast.error('Failed to reject student');
      setModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Applicants</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve student registrations
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-800">{pendingStudents.length} Pending</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ids-header mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pending students...</p>
            </div>
          ) : pendingStudents.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Pending Approvals</h3>
              <p className="text-gray-500">
                All student registrations in your department have been processed.
              </p>
            </div>
          ) : (
            // Student List
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
                      Registered
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingStudents.map((student) => (
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-800 font-semibold">{student.university_id || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openApproveModal(student)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(student)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
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

      {/* Reason Modal */}
      <ReasonModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={modalState.actionType === 'approve' ? handleApprove : handleReject}
        title={modalState.actionType === 'approve' ? 'Approve Student' : 'Reject Student'}
        studentName={modalState.student?.full_name || ''}
        actionType={modalState.actionType}
        loading={modalState.loading}
      />
    </div>
  );
};

export default ApplicantsSection;
