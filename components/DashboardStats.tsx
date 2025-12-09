
import React from 'react';
import { DashboardStats } from '../types';
import { Layers, Activity, AlertTriangle, Clock } from 'lucide-react';
import CentraliseView from './centraliseView';

interface Props {
  stats: DashboardStats;
  projectStatusData: { name: string; value: number }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#9ca3af'];

export const DashboardStatsView: React.FC<Props> = ({ stats, projectStatusData }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="col-span-full mt-6">
        <CentraliseView />
      </div>
    </div>
  );
};
