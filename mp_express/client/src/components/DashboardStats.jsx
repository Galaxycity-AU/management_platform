import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Activity, AlertTriangle, Clock, AlertCircle, Calendar, DollarSign, ChevronUp, ChevronDown } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#9ca3af'];

export const DashboardStatsView = ({ stats, projectStatusData, projectAlerts, onSelectProject }) => {
  const navigate = useNavigate();
  const [hoveredAlert, setHoveredAlert] = useState(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const displayLimit = isExpanded ? projectAlerts.length : 4;
  const handleProjectClick = (project) => {
    navigate(`/projects/${project.id}`);
    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  // Calculate alert severity
  const getAlertSeverity = (alert) => {
    const score = alert.flaggedJobs;
    if (score >= 3) return { level: 'critical', color: 'red', bgColor: 'bg-red-500' };
    if (score >= 2) return { level: 'high', color: 'orange', bgColor: 'bg-orange-500' };
    return { level: 'medium', color: 'amber', bgColor: 'bg-amber-500' };
  };

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

      {/* Two Column Alert Grid */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-6 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900">Active Alerts</h3>
                <p className="text-sm text-gray-600 mt-0.5">Requires immediate attention</p>
              </div>
            </div>
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
              {projectAlerts.length}
            </span>
          </div>
        </div>


        {/* Two Column Grid */}
        <div className="p-6">
          {projectAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 font-medium">All projects are on track!</p>
              <p className="text-sm text-gray-500 mt-1">No alerts at this time</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {projectAlerts.slice(0, displayLimit).map((alert, index) => {
                const severity = getAlertSeverity(alert);
                const isHovered = hoveredAlert === index;
                const totalIssues = alert.flaggedJobs;
                
                return (
                  <div
                    key={index}
                    className={`relative bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                      isHovered 
                        ? 'border-red-400 shadow-xl -translate-y-1 scale-[1.02]' 
                        : 'border-gray-200 shadow-md hover:border-red-300'
                    }`}
                    onClick={() => handleProjectClick(alert)}
                    onMouseEnter={() => setHoveredAlert(index)}
                    onMouseLeave={() => setHoveredAlert(null)}
                  >
                    {/* Severity Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${severity.bgColor}`}></div>
                    
                    <div className="p-5 pl-6">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-base truncate">
                              {alert.name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              severity.level === 'critical' 
                                ? 'bg-red-100 text-red-700' 
                                : severity.level === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {severity.level.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Alert Count Badge */}
                        <div className={`flex-shrink-0 ml-3 flex items-center justify-center w-10 h-10 rounded-lg ${
                          severity.level === 'critical' 
                            ? 'bg-red-100' 
                            : severity.level === 'high'
                            ? 'bg-orange-100'
                            : 'bg-amber-100'
                        }`}>
                          <span className={`text-lg font-bold ${
                            severity.level === 'critical' 
                              ? 'text-red-700' 
                              : severity.level === 'high'
                              ? 'text-orange-700'
                              : 'text-amber-700'
                          }`}>
                            {totalIssues}
                          </span>
                        </div>
                      </div>

                      {/* Flag Breakdown */}
                      {alert.flagBreakdown && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-wrap gap-2">
                            {alert.flagBreakdown.notStartedOnTime > 0 && (
                              <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{alert.flagBreakdown.notStartedOnTime} Not Started</span>
                              </div>
                            )}
                            {alert.flagBreakdown.startedLate > 0 && (
                              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-orange-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{alert.flagBreakdown.startedLate} Started Late</span>
                              </div>
                            )}
                            {alert.flagBreakdown.notEndedOnTime > 0 && (
                              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{alert.flagBreakdown.notEndedOnTime} Not Ended</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  
                );
              })}
              </div>
              {/* Expand/Collapse Button */}
              {projectAlerts.length > 4 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More ({projectAlerts.length - 4} more alerts)
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};