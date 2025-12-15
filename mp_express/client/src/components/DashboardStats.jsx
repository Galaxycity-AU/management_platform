import React from 'react';

export const DashboardStatsView = ({ stats, projectStatusData, projectAlerts, onSelectProject }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Projects</p>
          <p className="text-3xl font-bold">{stats.totalProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Active Projects</p>
          <p className="text-3xl font-bold text-blue-600">{stats.activeProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Delayed Projects</p>
          <p className="text-3xl font-bold text-red-600">{stats.delayedProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Pending Approvals</p>
          <p className="text-3xl font-bold text-amber-600">{stats.pendingApprovals}</p>
        </div>
      </div>
    </div>
  );
};
