import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../contexts/AuthContext';
import { Hotel, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const DeptHeadDashboard = () => {
  const { profile } = useSupabaseAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    if (profile) {
      fetchPendingStudents();
      fetchDepartmentName();
    }
  }, [profile]);

  const fetchDepartmentName = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .single();

      if (error) throw error;
      setDepartmentName(data.name);
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

  const fetchPendingStudents = async () => {
    setLoading(true);
    try {
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

  const handleApprove = async (studentId, studentName) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', studentId);

      if (error) throw error;

      toast.success(`${studentName} has been approved!`);
      
      // Remove from list optimistically
      setPendingStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('Error approving student:', error);
      toast.error('Failed to approve student');
    }
  };

  const handleReject = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to reject ${studentName}'s registration?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', studentId);

      if (error) throw error;

      toast.success(`${studentName}'s registration has been rejected`);
      
      // Remove from list optimistically
      setPendingStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('Error rejecting student:', error);
      toast.error('Failed to reject student');
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
    <div className="min-h-screen bg-gradient-to-b from-ids-bg to-[#e9dec9] p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-ids-sidebar text-white p-6 rounded-lg shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-ids-header rounded-full">
                <Hotel className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Department Head Dashboard</h1>
                <p className="text-sm text-ids-sidebar-text/80">
                  {departmentName} Department · {profile?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-ids-header/50 px-4 py-2 rounded">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{pendingStudents.length} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Section Header */}
          <div className="bg-ids-header text-white px-6 py-4 border-b border-ids-border">
            <h2 className="text-lg font-bold flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Pending Student Approvals
            </h2>
          </div>

          {/* Content */}
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Department
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-800 font-semibold">{student.university_id || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(student.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {departmentName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleApprove(student.id, student.full_name)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(student.id, student.full_name)}
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
      </div>
    </div>
  );
};

export default DeptHeadDashboard;
