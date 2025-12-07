
import React from 'react';
import { DashboardStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Layers, Activity, AlertTriangle, Clock } from 'lucide-react';

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

      {/* Charts Section */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={projectStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {projectStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col justify-center items-center text-center">
         <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Health</h3>
         <p className="text-gray-500 max-w-md">
           Currently tracking {stats.totalProjects} concurrent projects. 
           {stats.delayedProjects > 0 ? 
             ` Attention needed: ${stats.delayedProjects} projects are reporting delays.` : 
             " All systems operational."}
         </p>
         <div className="mt-6 w-full h-4 bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full bg-green-500 transition-all duration-1000" style={{width: `${(stats.activeProjects / stats.totalProjects) * 100}%`}}></div>
         </div>
         <p className="text-xs text-gray-400 mt-2">Active Utilization</p>
      </div>
    </div>
  );
};
