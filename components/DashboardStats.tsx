import React from 'react';
import { DashboardStats } from '../types';
import { Layers, Activity, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import CentraliseView from './centraliseView';

interface Props {
  stats: DashboardStats;
  projectStatusData: { name: string; value: number }[];
  projectAlerts: Array<{
    projectId: string;
    id: string;
    status: string;
    name: string;
    manager: string;
  }>;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#9ca3af'];

export const DashboardStatsView: React.FC<Props> = ({ stats, projectStatusData, projectAlerts, onSelectProject }) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-indigo-50 rounded-lg mr-4">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Projects</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg mr-4">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg mr-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Delayed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.delayedProjects}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg mr-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
          </div>
        </div>
      </div>

      {/* Project Alerts Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mr-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </span>
          Project Alerts
          <span className="ml-auto bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {projectAlerts.length}
          </span>
        </h3>

        {/* Alerts List - Full Width Bars */}
        <div className="space-y-3">
          {projectAlerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center bg-gradient-to-r from-white to-red-50/30 shadow-sm hover:shadow-md transition-all rounded-lg border-l-4 border-red-500 p-4"
              onClick={() => { onSelectProject(alert); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="mr-4 relative flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </div>

              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900 text-base">
                      {alert.name}
                    </span>
                    <span className="mx-3 text-gray-300">|</span>
                    <span className="text-gray-600 text-sm">
                      Manager: <span className="font-medium">{alert.manager}</span>
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      {alert.lateCase? `Late Case: ${alert.lateCase}` : ''} {alert.overTime? `| Over Time: ${alert.overTime}` : ''}{alert.overBudget? `| Over Budget` : ''}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {alert.lateCase + alert.overTime + (alert.overBudget? 1 : 0)} Alerts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centralized View Component */}
      <CentraliseView />
    </div>
  );
};