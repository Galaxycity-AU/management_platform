import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { ChevronRight, AlertCircle, ArrowUpRight, ArrowDownRight, Search, Filter, CalendarRange, ChevronDown } from 'lucide-react';
import { getStatusColor, isAtRisk, checkTimeFilter, type TimeFilter } from '../utils';

interface SimPROProjectTableProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

export const SimPROProjectTable: React.FC<SimPROProjectTableProps> = ({ projects, onSelectProject }) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RISK' | 'PENDING' | 'ARCHIVED'>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project; direction: 'asc' | 'desc' } | null>(null);

  const filteredProjects = projects.filter(p => {
    if (!checkTimeFilter(p, timeFilter)) return false;
    if (statusFilter === 'ACTIVE') return p.status === ProjectStatus.ACTIVE;
    if (statusFilter === 'RISK') return isAtRisk(p);
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === undefined || bVal === undefined) return 0;
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof Project) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
      {/* Table Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-50/50">
        
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
           <div className="bg-white p-1 rounded-lg border border-gray-200 flex text-xs sm:text-sm shadow-sm">
              <button 
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${statusFilter === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${statusFilter === 'PENDING' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${statusFilter === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter('RISK')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${statusFilter === 'RISK' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                At Risk
              </button>
              <button 
                onClick={() => setStatusFilter('ARCHIVED')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${statusFilter === 'ARCHIVED' ? 'bg-gray-50 text-gray-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Archived
              </button>
           </div>
        </div>

        {/* Time Filter & Count */}
        <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
            <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm hover:border-gray-300 z-20">
                    <CalendarRange className="w-4 h-4 text-gray-500" />
                    <span>
                        {timeFilter === 'ALL' && 'All Time'}
                        {timeFilter === 'THIS_MONTH' && 'This Month'}
                        {timeFilter === 'NEXT_MONTH' && 'Next Month'}
                        {timeFilter === 'OVERDUE' && 'Overdue'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button onClick={() => setTimeFilter('ALL')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg">All Time</button>
                    <button onClick={() => setTimeFilter('THIS_MONTH')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Active This Month</button>
                    <button onClick={() => setTimeFilter('NEXT_MONTH')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Scheduled Next Month</button>
                    <button onClick={() => setTimeFilter('OVERDUE')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg text-red-600">Overdue Projects</button>
                </div>
            </div>

            <div className="text-sm text-gray-500 font-medium">
                {sortedProjects.length} Projects
            </div>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                Project & Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                Status
              </th>
              {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('progress')}>
                Progress
              </th> */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('budget')}>
                Budget Health
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('scheduledEnd')}>
                Deadline
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProjects.map((project) => {
               const budgetPercent = (project.spent / project.budget) * 100;
               const isOverBudget = budgetPercent > 100;
               const risk = isAtRisk(project);

               return (
                <tr 
                  key={project.id} 
                  onClick={() => onSelectProject(project)}
                  className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold ${risk ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {project.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.client}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <div className="w-full max-w-[100px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                    </div>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <div className="text-sm text-gray-900 font-medium">
                            ${project.spent.toLocaleString()}
                            <span className="text-gray-400 font-normal mx-1">/</span>
                            ${project.budget.toLocaleString()}
                        </div>
                        <div className={`text-xs flex items-center gap-1 ${isOverBudget ? 'text-red-600 font-bold' : (budgetPercent > 90 ? 'text-amber-600' : 'text-green-600')}`}>
                            {isOverBudget ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {budgetPercent.toFixed(1)}% Used
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.scheduledEnd.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-400 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Visible on mobile) */}
      <div className="md:hidden divide-y divide-gray-100 flex-1 overflow-y-auto">
        {sortedProjects.map((project) => {
            const budgetPercent = (project.spent / project.budget) * 100;
            const isOverBudget = budgetPercent > 100;
            const risk = isAtRisk(project);

            return (
                <div 
                    key={project.id} 
                    onClick={() => onSelectProject(project)}
                    className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                             <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold ${risk ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {project.name.charAt(0)}
                             </div>
                             <div>
                                <h3 className="text-sm font-bold text-gray-900">{project.name}</h3>
                                <p className="text-xs text-gray-500">{project.client}</p>
                             </div>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-gray-400 block mb-1">Progress</span>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5 flex-1">
                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                </div>
                                <span className="font-medium text-gray-700">{project.progress}%</span>
                            </div>
                        </div>
                        <div>
                             <span className="text-gray-400 block mb-1">Budget</span>
                             <div className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
                                ${project.spent.toLocaleString()} <span className="text-gray-400">/ {project.budget.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {sortedProjects.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters.</p>
          </div>
      )}
    </div>
  );
};

