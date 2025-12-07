
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { ChevronRight, AlertCircle, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';

interface ProjectTableProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onSelectProject }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RISK'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project; direction: 'asc' | 'desc' } | null>(null);

  // Helper to determine if a project is "At Risk" (Delayed or Over Budget)
  const isAtRisk = (p: Project) => {
    const budgetUsage = p.spent / p.budget;
    const expectedUsage = p.progress / 100;
    // Risk if status is DELAYED OR (Budget spent > Expected progress + 10% buffer)
    return p.status === ProjectStatus.DELAYED || (budgetUsage > expectedUsage + 0.1);
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'ACTIVE') return p.status === ProjectStatus.ACTIVE;
    if (filter === 'RISK') return isAtRisk(p);
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

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case ProjectStatus.COMPLETED: return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case ProjectStatus.DELAYED: return 'bg-rose-50 text-rose-700 ring-rose-600/20';
      case ProjectStatus.PLANNING: return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      default: return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Table Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
           <div className="bg-white p-1 rounded-lg border border-gray-200 flex text-sm flex-shrink-0">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${filter === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Projects
              </button>
              <button 
                onClick={() => setFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${filter === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('RISK')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${filter === 'RISK' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                At Risk
              </button>
           </div>
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
           Showing {sortedProjects.length} projects
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                Project & Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('progress')}>
                Progress
              </th>
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
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <div className="w-full max-w-[100px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                    </div>
                  </td>
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
      <div className="md:hidden divide-y divide-gray-100">
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
          <div className="p-12 text-center text-gray-500">
              No projects found matching the criteria.
          </div>
      )}
    </div>
  );
};
