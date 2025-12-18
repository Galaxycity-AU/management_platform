import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, ClipboardCheck, Bell, Search, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStats } from '../hooks/useStats';

export const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const stats = useStats();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: ListTodo, label: 'Projects', count: stats?.totalProjects },
    { path: '/simpro-projects', icon: ListTodo, label: 'SimPRO Projects' },
    { 
      path: '/approvals', 
      icon: ClipboardCheck, 
      label: 'Approvals', 
      badge: stats?.pendingApprovals > 0 ? stats.pendingApprovals : null 
    },
    { path: '/api-testing', icon: Code, label: 'API Testing' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Sidebar (Desktop only - LG breakpoint) */}
      <aside className={`hidden lg:flex ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex-shrink-0 flex-col z-20 transition-all duration-300`}>
        <div className={`p-6 border-b border-gray-100 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <Link to="/dashboard" className="text-xl font-bold text-indigo-600 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6" />
              ProjectFlow
            </Link>
          )}
          {isSidebarCollapsed && (
            <Link to="/dashboard">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className={`p-4 space-y-1 flex-1 overflow-y-auto ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? `${item.label}${item.count ? ` (${item.count})` : ''}${item.badge ? ` (${item.badge})` : ''}` : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="ml-auto text-xs text-gray-500">({item.count})</span>
                    )}
                    {item.badge && (
                      <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                    )}
                  </>
                )}
                {isSidebarCollapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className={`p-4 border-t border-gray-100 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200 ${isSidebarCollapsed ? 'w-8 h-8 p-0 justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">PM</div>
            {!isSidebarCollapsed && (
              <div>
                <p className="text-xs font-bold text-gray-900">Project Manager</p>
                <p className="text-[10px] text-gray-500">Admin Access</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full relative">
        {/* Header (Responsive) - Hidden for project detail pages */}
        {!location.pathname.match(/\/(projects|simpro-projects)\/\d+/) && (
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="lg:hidden flex items-center gap-2 text-indigo-600 font-bold">
                <LayoutDashboard className="w-5 h-5" />
                <span>ProjectFlow</span>
              </div>
              <h2 className="hidden lg:block text-xl font-bold text-gray-800 capitalize">
                {location.pathname === '/' || location.pathname === '/dashboard' ? 'Dashboard' : 
                 location.pathname.split('/')[1].replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {location.pathname !== '/approvals' && (
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 md:w-64 transition-all"
                  />
                </div>
              )}
              <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                {stats?.pendingApprovals > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
            </div>
          </header>
        )}

        <div className={`flex-1 overflow-y-auto ${location.pathname.match(/\/(projects|simpro-projects)\/\d+/) ? '' : 'p-4 md:p-8'} pb-24 lg:pb-8`}>
          {children}
        </div>

        {/* Bottom Navigation (Mobile & Tablet - Visible below LG) */}
        {!location.pathname.includes('/projects/') && !location.pathname.includes('/simpro-projects/') && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-30 pb-safe">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center p-2 rounded-lg w-full ${isActive('/dashboard') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-1">Dashboard</span>
            </Link>
            <Link
              to="/projects"
              className={`flex flex-col items-center p-2 rounded-lg w-full ${isActive('/projects') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
            >
              <ListTodo className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-1">Projects</span>
            </Link>
            <Link
              to="/approvals"
              className={`relative flex flex-col items-center p-2 rounded-lg w-full ${isActive('/approvals') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
            >
              <div className="relative">
                <ClipboardCheck className="w-6 h-6" />
                {stats?.pendingApprovals > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></span>}
              </div>
              <span className="text-[10px] font-medium mt-1">Approvals</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
