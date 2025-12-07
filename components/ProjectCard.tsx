import React from 'react';
import { Project, ProjectStatus, WorkerLog, LogStatus } from '../types';
import { Calendar, User, Zap, Clock, AlertCircle } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  logs: WorkerLog[]; // Pass logs related to this project
  onAnalyze: (p: Project) => void;
}

// Helper to format time
const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// A Unified Gantt Chart Component for Workers
const WorkerGanttChart: React.FC<{ logs: WorkerLog[] }> = ({ logs }) => {
  if (logs.length === 0) return null;

  // 1. Determine Time Range for the Chart
  // Default to 08:00 AM to 06:00 PM (10 hours) unless logs go outside
  let minTime = new Date();
  minTime.setHours(8, 0, 0, 0);
  
  let maxTime = new Date();
  maxTime.setHours(18, 0, 0, 0);

  // Expand range based on actual log data
  logs.forEach(log => {
    if (log.scheduledStart < minTime) minTime = new Date(log.scheduledStart);
    if (log.scheduledEnd > maxTime) maxTime = new Date(log.scheduledEnd);
    if (log.actualStart && log.actualStart < minTime) minTime = new Date(log.actualStart);
    // For end time, if it's active, we might want to extend to "Now" if now > maxTime
    const endRef = log.actualEnd || new Date();
    if (endRef > maxTime) maxTime = endRef;
  });

  // Add 30 min buffer
  minTime = new Date(minTime.getTime() - 30 * 60000);
  maxTime = new Date(maxTime.getTime() + 30 * 60000);

  const totalDuration = maxTime.getTime() - minTime.getTime();

  // Helper to get % position
  const getPos = (date: Date) => {
    const val = Math.max(0, Math.min(100, ((date.getTime() - minTime.getTime()) / totalDuration) * 100));
    return val;
  };

  // Generate Hour Markers
  const markers = [];
  const curr = new Date(minTime);
  curr.setMinutes(0, 0, 0);
  if (curr < minTime) curr.setHours(curr.getHours() + 1);
  
  while (curr < maxTime) {
    markers.push(new Date(curr));
    curr.setHours(curr.getHours() + 1);
  }

  const now = new Date();
  const currentPos = getPos(now);
  const isToday = logs.some(l => l.scheduledStart.getDate() === now.getDate());

  return (
    <div className="mt-4">
      {/* Time Axis Header */}
      <div className="relative h-6 w-full border-b border-gray-200 mb-2">
        {markers.map((time, i) => (
          <div 
            key={i} 
            className="absolute bottom-0 text-[10px] text-gray-400 transform -translate-x-1/2 border-l border-gray-200 h-full pl-1"
            style={{ left: `${getPos(time)}%` }}
          >
            {time.getHours()}:00
          </div>
        ))}
      </div>

      {/* Workers Rows */}
      <div className="space-y-4">
        {logs.map((log) => {
          const schedLeft = getPos(log.scheduledStart);
          const schedWidth = getPos(log.scheduledEnd) - schedLeft;
          
          const actualStart = log.actualStart || log.scheduledStart; // Fallback for display if null (rare)
          const actualEnd = log.actualEnd || now;
          const isLive = !log.actualEnd;
          
          const actualLeft = getPos(actualStart);
          const actualWidth = Math.max(1, getPos(actualEnd) - actualLeft); // Min width 1%

          // Status colors
          const barColor = isLive ? 'bg-green-500' : (log.status === LogStatus.APPROVED ? 'bg-blue-500' : 'bg-amber-400');
          
          return (
            <div key={log.id} className="group relative">
              {/* Row Content */}
              <div className="flex items-center gap-4 mb-1">
                 <div className="w-32 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.workerName}</p>
                    <p className="text-xs text-gray-500 truncate">{log.role}</p>
                 </div>
                 
                 {/* Timeline Track */}
                 <div className="flex-1 relative h-8 bg-gray-50 rounded border border-gray-100 overflow-hidden">
                    {/* Grid Lines for this row */}
                    {markers.map((time, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-200 opacity-30" style={{ left: `${getPos(time)}%` }}></div>
                    ))}

                    {/* Scheduled Bar (Background) */}
                    <div 
                        className="absolute top-1.5 h-5 bg-indigo-100/50 border border-indigo-200 border-dashed rounded-sm"
                        style={{ left: `${schedLeft}%`, width: `${schedWidth}%` }}
                    ></div>

                    {/* Actual Bar (Foreground) */}
                    {log.actualStart && (
                         <div 
                            className={`absolute top-2.5 h-3 rounded-full shadow-sm ${barColor} transition-all duration-500`}
                            style={{ left: `${actualLeft}%`, width: `${actualWidth}%` }}
                         >
                            {isLive && (
                                <span className="absolute -right-1 top-0 bottom-0 w-2 bg-white/30 animate-pulse rounded-full"></span>
                            )}
                         </div>
                    )}
                 </div>

                 {/* Text Values */}
                 <div className="w-24 flex-shrink-0 text-right">
                     <div className={`text-xs font-semibold ${isLive ? 'text-green-600' : 'text-gray-600'}`}>
                        {isLive ? 'Active' : 'Done'}
                     </div>
                     <div className="text-[10px] text-gray-400">
                        {log.actualStart ? formatTime(log.actualStart) : '--'} - {isLive ? 'Now' : (log.actualEnd ? formatTime(log.actualEnd) : '--')}
                     </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Current Time Indicator (Vertical Line) */}
      {isToday && currentPos > 0 && currentPos < 100 && (
         <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10 pointer-events-none" style={{ left: `${currentPos}%`, top: '40px' }}> {/* Adjust top based on layout */}
             <div className="absolute -top-1 -translate-x-1/2 text-[9px] bg-red-500 text-white px-1 rounded">Now</div>
         </div>
      )}
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-[10px] text-gray-500 justify-end">
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-200 border-dashed"></div> Scheduled</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Active</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Completed</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded-full"></div> Pending Review</div>
      </div>
    </div>
  );
};


export const ProjectCard: React.FC<ProjectCardProps> = ({ project, logs, onAnalyze }) => {
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return 'bg-blue-50 text-blue-700 border-blue-100';
      case ProjectStatus.COMPLETED: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case ProjectStatus.DELAYED: return 'bg-rose-50 text-rose-700 border-rose-100';
      case ProjectStatus.PLANNING: return 'bg-slate-50 text-slate-700 border-slate-100';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (date?: Date) => date ? date.toLocaleDateString() : 'TBD';
  
  // Filter for display: Show only logs relevant to the current "view" (e.g., Today's active/recent logs)
  // For this UI, we assume we are looking at "Today's" timeline or the most recent active day
  const today = new Date();
  const todaysLogs = logs.filter(l => 
    l.scheduledStart.getDate() === today.getDate() && 
    l.scheduledStart.getMonth() === today.getMonth() &&
    l.scheduledStart.getFullYear() === today.getFullYear()
  );
  
  // If no logs today, maybe show the most recent 3 logs? 
  // For parallel view to make sense, they should probably be on the same day.
  // If empty, we just fall back to empty state or show last active day.
  const displayLogs = todaysLogs.length > 0 ? todaysLogs : logs.slice(0, 3);
  const isHistorical = todaysLogs.length === 0 && logs.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                    {project.status}
                </span>
                <span className="text-gray-400 text-sm flex items-center gap-1">
                    <User className="w-3 h-3" /> {project.client}
                </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
            <p className="text-gray-500 text-sm line-clamp-2 max-w-2xl">{project.description}</p>
        </div>

        <div className="flex flex-col items-end gap-3 min-w-[200px]">
             <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                <span>{formatDate(project.scheduledStart)} - {formatDate(project.scheduledEnd)}</span>
             </div>
             <button 
                onClick={() => onAnalyze(project)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
            >
                <Zap className="w-4 h-4" /> AI Analysis
            </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between text-sm">
         <div className="flex gap-6">
             <div className="flex flex-col">
                 <span className="text-xs text-gray-400 uppercase">Progress</span>
                 <span className="font-semibold text-gray-700">{project.progress}%</span>
             </div>
             <div className="flex flex-col">
                 <span className="text-xs text-gray-400 uppercase">Budget</span>
                 <span className="font-semibold text-gray-700">${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}</span>
             </div>
         </div>
         {/* Simple Progress Bar */}
         <div className="w-1/3 max-w-xs">
             <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                 <div className={`h-full ${project.status === ProjectStatus.DELAYED ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${project.progress}%` }}></div>
             </div>
         </div>
      </div>

      {/* Workers / Timeline Section */}
      <div className="p-6 bg-white relative">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> 
            {isHistorical ? 'Recent Activity' : 'Live Schedule & Status'}
        </h4>
        
        {displayLogs.length > 0 ? (
            <WorkerGanttChart logs={displayLogs} />
        ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4">
                No active schedule for today.
            </div>
        )}

        {logs.length > displayLogs.length && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                <button className="text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                    View Project History
                </button>
            </div>
        )}
      </div>
    </div>
  );
};