import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Hotel, LayoutDashboard, Users, UserCheck, Settings } from 'lucide-react';

export const DeptHeadLayout = () => {
  const { profile } = useSupabaseAuth();
  const [departmentName, setDepartmentName] = React.useState('');

  React.useEffect(() => {
    if (profile?.department_id) {
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

  const navItems = [
    { to: '/dept-head', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/dept-head/applicants', icon: UserCheck, label: 'Applicants' },
    { to: '/dept-head/users', icon: Users, label: 'Users' },
    { to: '/dept-head/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-ids-bg to-[#e9dec9] flex flex-col">
      {/* Shared Header */}
      <header className="bg-ids-sidebar text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-ids-header rounded-full">
                <Hotel className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Department Head Portal</h1>
                <p className="text-xs text-ids-sidebar-text/80">
                  {departmentName} Department · {profile?.full_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-ids-border shadow-sm">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-ids-header text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Top Tabs */}
        <div className="md:hidden w-full">
          <nav className="bg-white border-b border-ids-border overflow-x-auto">
            <div className="flex space-x-1 px-2 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-ids-header text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeptHeadLayout;
