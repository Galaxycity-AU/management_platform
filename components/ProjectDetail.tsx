
import React, { useState } from 'react';
import { Project, ProjectStatus, WorkerLog, LogStatus } from '../types';
import { Calendar, User, Zap, Clock, DollarSign, ArrowLeft, MoreHorizontal, Plus, FileText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// --- Worker Gantt Component (Reused logic) ---
const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const WorkerGanttChart: React.FC<{ logs: WorkerLog[]; currentDate: Date }> = ({ logs, currentDate }) => {
  const [hoveredLog, setHoveredLog] = React.useState<string | null>(null);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const headerScrollRef = React.useRef<HTMLDivElement>(null);
  const rowScrollRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  // Synchronize scroll across all timeline elements
  const handleScroll = (e: React.UIEvent<HTMLDivElement>, sourceId: string) => {
    const scrollLeftValue = e.currentTarget.scrollLeft;
    setScrollLeft(scrollLeftValue);
    
    // Update header scroll
    if (headerScrollRef.current && sourceId !== 'header') {
      headerScrollRef.current.scrollLeft = scrollLeftValue;
    }
    
    // Update all row scrolls
    rowScrollRefs.current.forEach((ref, id) => {
      if (ref && id !== sourceId) {
        ref.scrollLeft = scrollLeftValue;
      }
    });
  };

  if (logs.length === 0) return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Clock className="w-10 h-10 mb-2 opacity-20" />
          <p>No active shifts recorded for {currentDate.toLocaleDateString()}.</p>
      </div>
  );

  // Full 24-hour timeline
  const minTime = new Date(currentDate);
  minTime.setHours(0, 0, 0, 0);
  
  const maxTime = new Date(currentDate);
  maxTime.setHours(23, 59, 59, 999);

  const totalDuration = maxTime.getTime() - minTime.getTime();
  const getPos = (date: Date) => {
    // Ensure the date is within the same day for proper calculation
    const dateTime = new Date(date);
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Clamp the time to the current day
    const clampedTime = Math.max(dayStart.getTime(), Math.min(dayEnd.getTime(), dateTime.getTime()));
    return ((clampedTime - minTime.getTime()) / totalDuration) * 100;
  };

  // Generate hour markers for full 24 hours
  const markers = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = new Date(currentDate);
    time.setHours(hour, 0, 0, 0);
    markers.push(time);
  }

  const now = new Date();
  const isToday = currentDate.getDate() === now.getDate() && 
                  currentDate.getMonth() === now.getMonth() && 
                  currentDate.getFullYear() === now.getFullYear();
                  
  const currentPos = getPos(now);

  // Calculate duration
  const calculateDuration = (start: Date, end: Date | null) => {
    const endTime = end || (isToday ? now : start);
    const diff = Math.abs(endTime.getTime() - start.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-lg bg-white overflow-hidden relative">
      {/* Header Row with Time Axis */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {/* Fixed Worker Column Header */}
        <div className="w-44 flex-shrink-0 px-3 py-2 border-r border-gray-200 bg-gray-50">
          <span className="text-xs font-semibold text-gray-600 uppercase">Worker</span>
        </div>
        
        {/* Scrollable Timeline Header */}
        <div 
          ref={headerScrollRef}
          className="flex-1 overflow-x-auto" 
          style={{ scrollbarWidth: 'thin' }}
          onScroll={(e) => handleScroll(e, 'header')}
        >
          <div className="min-w-[1200px] relative h-8 px-4">
            {markers.map((time, i) => {
              const isBusinessHour = time.getHours() >= 8 && time.getHours() < 18;
              return (
                <div 
                  key={i} 
                  className={`absolute top-0 text-[11px] font-medium ${isBusinessHour ? 'text-gray-600' : 'text-gray-400'}`}
                  style={{ left: `${getPos(time)}%` }}
                >
                  {time.getHours().toString().padStart(2, '0')}:00
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed Status Column Header */}
        <div className="w-32 flex-shrink-0 px-3 py-2 border-l border-gray-200 bg-gray-50 text-right">
          <span className="text-xs font-semibold text-gray-600 uppercase">Status</span>
        </div>
      </div>

      {/* Workers Rows with Sticky Columns */}
      <div className="space-y-0 relative">
        {logs.map((log, idx) => {
          const schedLeft = getPos(log.scheduledStart);
          const schedWidth = getPos(log.scheduledEnd) - schedLeft;
          const actualStart = log.actualStart || log.scheduledStart;
          const actualEnd = log.actualEnd || (isToday ? now : log.scheduledEnd);
          const isLive = !log.actualEnd && isToday;
          
          const actualLeft = getPos(actualStart);
          const actualWidth = Math.max(0.5, getPos(actualEnd) - actualLeft);

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
          const avatarColors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];
          const avatarColor = avatarColors[idx % avatarColors.length];

          return (
            <div 
              key={log.id} 
              className="group relative flex border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
            >
              {/* Fixed Worker Info Column */}
              <div className="w-44 flex-shrink-0 flex items-center gap-2 px-3 py-3 border-r border-gray-100 bg-white">
                <div className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{log.workerName}</p>
                  <p className="text-xs text-gray-500 truncate">{log.role}</p>
                </div>
              </div>
              
              {/* Scrollable Timeline Column */}
              <div 
                ref={(el) => {
                  if (el) {
                    rowScrollRefs.current.set(log.id, el);
                  } else {
                    rowScrollRefs.current.delete(log.id);
                  }
                }}
                className="flex-1 overflow-x-auto" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => handleScroll(e, log.id)}
              >
                <div className="min-w-[1200px] relative h-12 px-4">
                  {/* Background with business hours highlight */}
                  <div className="absolute inset-0 flex">
                    <div className="bg-gray-50" style={{ width: `${(8/24) * 100}%` }}></div>
                    <div className="bg-white" style={{ width: `${(10/24) * 100}%` }}></div>
                    <div className="bg-gray-50" style={{ width: `${(6/24) * 100}%` }}></div>
                  </div>

                  {/* Vertical grid lines */}
                  {markers.map((time, i) => {
                    const isBusinessHour = time.getHours() >= 8 && time.getHours() < 18;
                    return (
                      <div 
                        key={i} 
                        className={`absolute top-0 bottom-0 border-l ${isBusinessHour ? 'border-gray-200' : 'border-gray-100'}`}
                        style={{ left: `${getPos(time)}%` }}
                      ></div>
                    );
                  })}

                  {/* Scheduled Bar (Background) */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 h-3 bg-gray-200 rounded-md opacity-40"
                    style={{ left: `${schedLeft}%`, width: `${schedWidth}%` }}
                  ></div>

                  {/* Actual Bar (Foreground) */}
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
                            Scheduled: {formatTime(log.scheduledStart)} - {formatTime(log.scheduledEnd)}
                          </div>
                          <div className="text-gray-300 text-[10px]">
                            Actual: {log.actualStart ? formatTime(log.actualStart) : '--'} - {log.actualEnd ? formatTime(log.actualEnd) : 'Ongoing'}
                          </div>
                          <div className="text-gray-300 text-[10px] font-semibold">
                            Duration: {calculateDuration(actualStart, log.actualEnd)}
                          </div>
                          {log.notes && <div className="text-gray-400 text-[10px] italic mt-1">"{log.notes}"</div>}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Status Column */}
              <div className="w-32 flex-shrink-0 flex flex-col justify-center text-right px-3 py-3 border-l border-gray-100 bg-white">
                <div className={`text-sm font-semibold ${statusColor} mb-0.5`}>
                  {statusText}
                </div>
                <div className="text-[11px] text-gray-500">
                  {timeText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Time Indicator - Synchronized with scroll, contained within Gantt chart */}
      {isToday && currentPos >= 0 && currentPos <= 100 && (
        <div 
          className="absolute top-10 bottom-0 pointer-events-none z-40"
          style={{ 
            left: '176px', 
            right: '128px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="relative h-full"
            style={{ 
              transform: `translateX(-${scrollLeft}px)`,
              width: '1200px'
            }}
          >
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500"
              style={{ left: `${currentPos}%` }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                Now
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Detail Component ---

interface ProjectDetailProps {
  project: Project;
  logs: WorkerLog[];
  onBack: () => void;
  onAnalyze: (p: Project) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, logs, onBack, onAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'FINANCE' | 'INFO'>('LIVE');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyNotes, setDailyNotes] = useState<{ [dateKey: string]: string }>({});
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteLastUpdated, setNoteLastUpdated] = useState<{ [dateKey: string]: Date }>({});

  // Helper function to create consistent date key for storage
  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get notes for current date
  const currentDateKey = getDateKey(currentDate);
  const currentNotes = dailyNotes[currentDateKey] || '';

  // Handle notes change
  const handleNotesChange = (value: string) => {
    setDailyNotes(prev => ({
      ...prev,
      [currentDateKey]: value
    }));
    // Clear the saved feedback when user edits
    setNoteSaved(false);
  };

  // Handle save notes
  const handleSaveNotes = () => {
    if (currentNotes.trim()) {
      setNoteLastUpdated(prev => ({
        ...prev,
        [currentDateKey]: new Date()
      }));
      setNoteSaved(true);
      // Clear saved feedback after 2 seconds
      setTimeout(() => setNoteSaved(false), 2000);
      // In a real app, you'd save to backend/localStorage here
      console.log(`Notes saved for ${currentDateKey}:`, currentNotes);
    }
  };

  // Handle clear notes
  const handleClearNotes = () => {
    if (window.confirm('Are you sure you want to clear these notes?')) {
      setDailyNotes(prev => {
        const updated = { ...prev };
        delete updated[currentDateKey];
        return updated;
      });
      setNoteLastUpdated(prev => {
        const updated = { ...prev };
        delete updated[currentDateKey];
        return updated;
      });
    }
  };

  // Navigation Handlers
  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const isToday = (d: Date) => {
      const now = new Date();
      return d.getDate() === now.getDate() && 
             d.getMonth() === now.getMonth() && 
             d.getFullYear() === now.getFullYear();
  };

  // Filter logs for selected Date AND current project
  const displayLogs = logs.filter(l => 
    String(l.projectId) === String(project.id) &&
    l.scheduledStart.getDate() === currentDate.getDate() && 
    l.scheduledStart.getMonth() === currentDate.getMonth() &&
    l.scheduledStart.getFullYear() === currentDate.getFullYear()
  );
  
  console.log('ProjectDetail - Project ID:', project.id, 'Type:', typeof project.id);
  console.log('ProjectDetail - Current Date:', currentDate.toISOString().split('T')[0]);
  console.log('ProjectDetail - Total logs:', logs.length);
  console.log('ProjectDetail - Filtered logs for this project (all dates):', logs.filter(l => String(l.projectId) === String(project.id)).length);
  console.log('ProjectDetail - Filtered logs for this date (all projects):', logs.filter(l => 
    l.scheduledStart.getDate() === currentDate.getDate() && 
    l.scheduledStart.getMonth() === currentDate.getMonth() &&
    l.scheduledStart.getFullYear() === currentDate.getFullYear()
  ).length);
  console.log('ProjectDetail - Filtered logs (project + date):', displayLogs.length);
  if (displayLogs.length > 0) {
    console.log('ProjectDetail - Sample filtered log:', displayLogs[0]);
  }

  // Financial Data Mockup
  const financeData = [
      { name: 'Labor', budget: project.budget * 0.6, spent: project.spent * 0.65 },
      { name: 'Materials', budget: project.budget * 0.3, spent: project.spent * 0.25 },
      { name: 'Overhead', budget: project.budget * 0.1, spent: project.spent * 0.1 },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
        {/* Top Navigation / Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-20 shadow-sm gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                        <span className="truncate">{project.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${project.status === ProjectStatus.ACTIVE ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {project.status}
                        </span>
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{project.client} • {project.id}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full space-y-4 md:space-y-6">
            
            {/* High Level Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold">Total Budget</span>
                    <div className="flex items-end justify-between mt-2">
                        <span className="text-lg md:text-2xl font-bold text-gray-900">${project.budget.toLocaleString()}</span>
                        <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mb-1" />
                    </div>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold">Actual Spent</span>
                    <div className="flex items-end justify-between mt-2">
                        <span className={`text-lg md:text-2xl font-bold ${(project.spent > project.budget) ? 'text-red-600' : 'text-gray-900'}`}>
                            ${project.spent.toLocaleString()}
                        </span>
                        <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded ${project.spent/project.budget > 0.9 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {((project.spent/project.budget)*100).toFixed(0)}%
                        </span>
                    </div>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold">Deadline</span>
                    <div className="flex items-end justify-between mt-2">
                        <span className="text-sm md:text-lg font-bold text-gray-900">{project.scheduledEnd.toLocaleDateString()}</span>
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mb-1" />
                    </div>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold">Team Size</span>
                    <div className="flex items-end justify-between mt-2">
                        <span className="text-lg md:text-2xl font-bold text-gray-900">{logs.length > 0 ? new Set(logs.map(l => l.workerName)).size : 0}</span>
                        <User className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mb-1" />
                    </div>
                </div>
            </div>

            {/* Main Tabs Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
                <div className="border-b border-gray-200 px-4 md:px-6 flex items-center gap-6 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('LIVE')}
                        className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'LIVE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Live Operations
                    </button>
                    <button 
                        onClick={() => setActiveTab('FINANCE')}
                        className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'FINANCE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Financial Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('INFO')}
                        className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'INFO' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Project Details
                    </button>
                </div>

                <div className="p-4 md:p-6 flex-1">
                    {/* LIVE TAB */}
                    {activeTab === 'LIVE' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Daily Schedule</h3>
                                    <p className="text-sm text-gray-500">Track worker shifts and progress.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <button onClick={handlePrevDay} className="p-2 hover:bg-gray-50 text-gray-500 border-r border-gray-200">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2 min-w-[140px] justify-center">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {isToday(currentDate) ? 'Today' : currentDate.toLocaleDateString()}
                                        </div>
                                        <button onClick={handleNextDay} className="p-2 hover:bg-gray-50 text-gray-500 border-l border-gray-200">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
                                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Assign</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 md:p-6">
                                <WorkerGanttChart logs={displayLogs} currentDate={currentDate} />
                            </div>

                            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        <h4 className="font-semibold text-lg text-gray-800">Daily Notes</h4>
                                        {noteLastUpdated[currentDateKey] && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                Updated {noteLastUpdated[currentDateKey].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    {noteSaved && (
                                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Saved
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <textarea
                                        value={currentNotes}
                                        onChange={(e) => handleNotesChange(e.target.value)}
                                        maxLength={500}
                                        className="w-full min-h-[120px] p-4 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y text-sm text-gray-700 placeholder-gray-400"
                                        placeholder="Add notes about today's operations, issues, achievements, or important updates..."
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                            {currentNotes.length} / 500 characters
                                        </div>
                                        <div className="flex gap-2">
                                            {currentNotes.trim() && (
                                                <button
                                                    onClick={handleClearNotes}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSaveNotes}
                                                disabled={!currentNotes.trim()}
                                                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Save Notes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FINANCE TAB */}
                    {activeTab === 'FINANCE' && (
                        <div className="animate-in fade-in duration-300">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Cost Breakdown</h3>
                                <div className="text-sm text-gray-500">Last updated: Today</div>
                            </div>
                            
                            <div className="h-80 w-full mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={financeData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="budget" name="Budget Allocated" fill="#e0e7ff" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="spent" name="Actual Spent" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {financeData.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white">
                                        <p className="text-sm font-medium text-gray-500 mb-1">{item.name}</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xl font-bold text-gray-900">${item.spent.toLocaleString()}</span>
                                            <span className={`text-xs font-medium ${item.spent > item.budget ? 'text-red-500' : 'text-green-500'}`}>
                                                {((item.spent/item.budget)*100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                                            <div className={`h-1.5 rounded-full ${item.spent > item.budget ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (item.spent/item.budget)*100)}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* INFO TAB */}
                    {activeTab === 'INFO' && (
                        <div className="animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Project Information</h3>
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Basic Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Project ID</label>
                                            <p className="text-gray-900 mt-1 font-medium">{project.id}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</label>
                                            <p className="text-gray-900 mt-1 font-medium">{project.client}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
                                            <p className="mt-1">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                                    project.status === ProjectStatus.ACTIVE ? 'bg-blue-100 text-blue-700' :
                                                    project.status === ProjectStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                                    project.status === ProjectStatus.DELAYED ? 'bg-red-100 text-red-700' :
                                                    project.status === ProjectStatus.ON_HOLD ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {project.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progress</label>
                                            <div className="mt-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-indigo-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${project.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</label>
                                        <p className="text-gray-700 mt-2 leading-relaxed">{project.description || 'No description provided'}</p>
                                    </div>
                                </div>

                                {/* Timeline Information */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Timeline</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scheduled Start</label>
                                            <p className="text-gray-900 mt-1 font-medium">
                                                {project.scheduledStart.toLocaleDateString('en-US', { 
                                                    weekday: 'short', 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scheduled End</label>
                                            <p className="text-gray-900 mt-1 font-medium">
                                                {project.scheduledEnd.toLocaleDateString('en-US', { 
                                                    weekday: 'short', 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        {project.actualStart && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Actual Start</label>
                                                <p className="text-gray-900 mt-1 font-medium">
                                                    {project.actualStart.toLocaleDateString('en-US', { 
                                                        weekday: 'short', 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {project.actualEnd && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Actual End</label>
                                                <p className="text-gray-900 mt-1 font-medium">
                                                    {project.actualEnd.toLocaleDateString('en-US', { 
                                                        weekday: 'short', 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {project.scheduledStart && project.scheduledEnd && (
                                        <div className="mt-6">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Duration</label>
                                            <p className="text-gray-900 mt-1 font-medium">
                                                {Math.ceil((project.scheduledEnd.getTime() - project.scheduledStart.getTime()) / (1000 * 60 * 60 * 24))} days
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Financial Information */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Financial Overview</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Budget</label>
                                            <p className="text-gray-900 mt-1 font-medium text-lg">${project.budget.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount Spent</label>
                                            <p className={`mt-1 font-medium text-lg ${project.spent > project.budget ? 'text-red-600' : 'text-gray-900'}`}>
                                                ${project.spent.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Remaining Budget</label>
                                            <p className={`mt-1 font-medium text-lg ${(project.budget - project.spent) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                ${(project.budget - project.spent).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget Utilization</label>
                                            <div className="mt-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all ${
                                                                (project.spent / project.budget) > 1 ? 'bg-red-500' :
                                                                (project.spent / project.budget) > 0.9 ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                            }`}
                                                            style={{ width: `${Math.min(100, (project.spent / project.budget) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-sm font-medium ${
                                                        (project.spent / project.budget) > 1 ? 'text-red-600' :
                                                        (project.spent / project.budget) > 0.9 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                        {((project.spent / project.budget) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Additional Information</h4>
                                    <div className="space-y-6">
                                        {project.tags && project.tags.length > 0 && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tags</label>
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {project.tags.map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {project.schedules && project.schedules.length > 0 && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Schedules</label>
                                                <p className="text-gray-900 mt-1 font-medium">
                                                    {project.schedules.length} schedule{project.schedules.length !== 1 ? 's' : ''} recorded
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Total hours: {project.schedules.reduce((sum, s) => sum + (s.TotalHours || 0), 0).toFixed(1)}h
                                                </p>
                                            </div>
                                        )}
                                        {logs && logs.length > 0 && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Team Members</label>
                                                <p className="text-gray-900 mt-1 font-medium">
                                                    {new Set(logs.map(l => l.workerName)).size} team member{new Set(logs.map(l => l.workerName)).size !== 1 ? 's' : ''}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Total work logs: {logs.length}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
