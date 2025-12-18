import React from 'react';
import { Project, ProjectStatus, WorkerLog, LogStatus } from '../types';
import { Calendar, User, Zap, Clock, AlertCircle } from 'lucide-react';
import { getStatusColorCard, formatDate, filterTodaysLogs } from '../utils';

interface ProjectCardProps {
  project: Project;
  logs: WorkerLog[]; // Pass logs related to this project
  onAnalyze: (p: Project) => void;
}

// Helper to format time
const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// A Unified Gantt Chart Component for Workers
const WorkerGanttChart: React.FC<{ logs: WorkerLog[] }> = ({ logs }) => {
  const [hoveredLog, setHoveredLog] = React.useState<string | null>(null);
  
  if (logs.length === 0) return null;

  // 1. Determine Time Range for the Chart
  // Default to 08:00 AM to 07:00 PM (11 hours) unless logs go outside
  let minTime = new Date();
  minTime.setHours(8, 0, 0, 0);
  
  let maxTime = new Date();
  maxTime.setHours(19, 0, 0, 0);

  // Expand range based on actual log data
  logs.forEach(log => {
    if (log.schedulesStart < minTime) minTime = new Date(log.schedulesStart);
    if (log.schedulesEnd > maxTime) maxTime = new Date(log.schedulesEnd);
    if (log.actualStart && log.actualStart < minTime) minTime = new Date(log.actualStart);
    const endRef = log.actualEnd || new Date();
    if (endRef > maxTime) maxTime = endRef;
  });

  // Add 1 hour buffer on each side
  minTime = new Date(minTime.getTime() - 60 * 60000);
  maxTime = new Date(maxTime.getTime() + 60 * 60000);

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

  // Calculate duration
  const calculateDuration = (start: Date, end: Date | null) => {
    const endTime = end || now;
    const diff = endTime.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="mt-4 relative">
      {/* Time Axis Header - Clean Design */}
      <div className="relative h-8 w-full mb-4 pl-28">
        <div className="relative h-full">
          {markers.map((time, i) => (
            <div 
              key={i} 
              className="absolute top-0 text-[11px] text-gray-400 font-medium"
              style={{ left: `${getPos(time)}%` }}
            >
              {time.getHours()}:00
            </div>
          ))}
        </div>
      </div>

      {/* Workers Rows */}
      <div className="space-y-1">
        {logs.map((log, idx) => {
          const schedLeft = getPos(log.schedulesStart);
          const schedWidth = getPos(log.schedulesEnd) - schedLeft;
          
          const actualStart = log.actualStart || log.schedulesStart;
          const actualEnd = log.actualEnd || now;
          const isLive = !log.actualEnd;
          
          const actualLeft = getPos(actualStart);
          const actualWidth = Math.max(2, getPos(actualEnd) - actualLeft);

          // Enhanced status colors matching the screenshot
          let barColor = 'bg-blue-500';
          let statusText = 'Done';
          let statusColor = 'text-gray-700';
          let timeText = '';
          
          if (isLive) {
            barColor = 'bg-green-500';
            statusText = 'Active';
            statusColor = 'text-green-600';
            timeText = `${formatTime(actualStart)} - ...`;
          } else if (log.status === LogStatus.APPROVED) {
            barColor = 'bg-blue-500';
            statusText = 'Done';
            statusColor = 'text-gray-700';
            timeText = `${formatTime(actualStart)} - ${formatTime(actualEnd)}`;
          } else {
            barColor = 'bg-amber-500';
            statusText = 'Pending';
            statusColor = 'text-amber-600';
            timeText = log.actualStart ? `${formatTime(actualStart)} - ${log.actualEnd ? formatTime(actualEnd) : 'Now'}` : '--';
          }

          const isHovered = hoveredLog === log.id;
          
          // Generate initials for avatar
          const initials = log.workerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const avatarColors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
          const avatarColor = avatarColors[idx % avatarColors.length];
          
          return (
            <div 
              key={log.id} 
              className="group relative"
              onMouseEnter={() => setHoveredLog(log.id)}
              onMouseLeave={() => setHoveredLog(null)}
            >
              {/* Row Content */}
              <div className="flex items-center gap-3 py-2 hover:bg-gray-50/50 rounded-lg transition-colors">
                 {/* Worker Info with Avatar */}
                 <div className="w-28 flex-shrink-0 flex items-center gap-2 pl-2">
                    <div className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{log.workerName}</p>
                      <p className="text-xs text-gray-500 truncate">{log.role}</p>
                    </div>
                 </div>
                 
                 {/* Timeline Track - Cleaner design */}
                 <div className="flex-1 relative h-10">
                    {/* Vertical grid lines - subtle */}
                    {markers.map((time, i) => (
                        <div 
                          key={i} 
                          className="absolute top-0 bottom-0 border-l border-gray-100" 
                          style={{ left: `${getPos(time)}%` }}
                        ></div>
                    ))}

                    {/* Scheduled Bar (Background) - Very subtle */}
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 h-3 bg-gray-100 rounded-md opacity-60"
                        style={{ left: `${schedLeft}%`, width: `${schedWidth}%` }}
                    ></div>

                    {/* Actual Bar (Foreground) - Bold and clean */}
                    {log.actualStart && (
                         <div 
                            className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-md ${barColor} transition-all duration-300 shadow-sm ${
                              isHovered ? 'shadow-md scale-y-110' : ''
                            }`}
                            style={{ left: `${actualLeft}%`, width: `${actualWidth}%` }}
                         >
                            {/* Tooltip on hover */}
                            {isHovered && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                                <div className="font-semibold">{log.workerName}</div>
                                <div className="text-gray-300 text-[10px] mt-1">
                                  {log.actualStart ? formatTime(log.actualStart) : '--'} - {log.actualEnd ? formatTime(log.actualEnd) : 'Ongoing'}
                                </div>
                                <div className="text-gray-300 text-[10px]">
                                  Duration: {calculateDuration(actualStart, log.actualEnd)}
                                </div>
                                {log.notes && <div className="text-gray-400 text-[10px] italic mt-1">"{log.notes}"</div>}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                         </div>
                    )}
                 </div>

                 {/* Status & Time Info - Right aligned like screenshot */}
                 <div className="w-32 flex-shrink-0 text-right pr-2">
                     <div className={`text-sm font-semibold ${statusColor} mb-0.5`}>
                        {statusText}
                     </div>
                     <div className="text-[11px] text-gray-500">
                        {timeText}
                     </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Current Time Indicator (Vertical Line) - Matches screenshot */}
      {isToday && currentPos > 0 && currentPos < 100 && (
         <div 
           className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none" 
           style={{ left: `calc(${currentPos}% + 112px)`, top: '32px' }}
         >
             <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">
               Now
             </div>
         </div>
      )}
    </div>
  );
};


export const ProjectCard: React.FC<ProjectCardProps> = ({ project, logs, onAnalyze }) => {
  // Filter for display: Show only logs relevant to the current "view" (e.g., Today's active/recent logs)
  // For this UI, we assume we are looking at "Today's" timeline or the most recent active day
  const todaysLogs = filterTodaysLogs(logs);
  
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
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide ${getStatusColorCard(project.status)}`}>
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