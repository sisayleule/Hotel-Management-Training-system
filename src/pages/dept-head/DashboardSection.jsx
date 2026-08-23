import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../contexts/AuthContext';
import { Users, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardSection = () => {
  const { profile } = useSupabaseAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.department_id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all stats in parallel
      const [totalResult, pendingResult, approvedResult, rejectedResult, activityResult] = 
        await Promise.all([
          // Total students
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('department_id', profile.department_id),
          
          // Pending students
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('status', 'pending')
            .eq('department_id', profile.department_id),
          
          // Approved students
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('status', 'approved')
            .eq('department_id', profile.department_id),
          
          // Rejected students
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('status', 'rejected')
            .eq('department_id', profile.department_id),
          
          // Recent activity (last 5 approval/rejection events)
          supabase
            .from('approval_log')
            .select(`
              id,
              action,
              created_at,
              student:student_id (
                full_name
              ),
              actor:actor_id (
                full_name
              )
            `)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

      // Update stats
      setStats({
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
      });

      // Update recent activity
      if (activityResult.data) {
        setRecentActivity(activityResult.data);
      }

      // Check for errors
      if (totalResult.error) throw totalResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (approvedResult.error) throw approvedResult.error;
      if (rejectedResult.error) throw rejectedResult.error;
      if (activityResult.error && activityResult.error.code !== 'PGRST116') {
        // Ignore "no rows returned" error for activity log
        throw activityResult.error;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            Student statistics and department metrics
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ids-header mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-600 mt-1">
          Student statistics and department metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-ids-border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          </div>
        </div>
        
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">
                Approval and rejection logs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Action Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-full ${
                    activity.action === 'approved' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {activity.action === 'approved' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">
                        {activity.student?.full_name || 'Unknown Student'}
                      </span>
                      {' '}was{' '}
                      <span className={`font-semibold ${
                        activity.action === 'approved' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {activity.action}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      by {activity.actor?.full_name || 'System'} · {formatTimestamp(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
