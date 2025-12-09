
import React, { useState } from 'react';
import { Project, ProjectStatus, WorkerLog, LogStatus, Schedule } from '../types';
import { Calendar, User, Zap, Clock, DollarSign, ArrowLeft, MoreHorizontal, Plus, FileText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// --- Worker Gantt Component (Reused logic) ---
const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Extended type for timeline items (logs + schedules)
type TimelineItem = WorkerLog & {
  isSchedule?: boolean;
  scheduleData?: Schedule;
  blockData?: Schedule['Blocks'][0];
};

const WorkerGanttChart: React.FC<{ logs: WorkerLog[]; currentDate: Date; schedules?: Schedule[] }> = ({ logs, currentDate, schedules = [] }) => {
  // Convert schedules to timeline items for the current date
  const scheduleItems: TimelineItem[] = schedules
    .filter(schedule => {
      if (!schedule.Date) return false;
      const scheduleDate = new Date(schedule.Date);
      return scheduleDate.getDate() === currentDate.getDate() &&
             scheduleDate.getMonth() === currentDate.getMonth() &&
             scheduleDate.getFullYear() === currentDate.getFullYear();
    })
    .map(schedule => {
      const scheduleDate = schedule.Date ? new Date(schedule.Date) : currentDate;
      
      // Process each block in the schedule
      return schedule.Blocks?.map((block, blockIdx): TimelineItem => {
        const [startHour, startMin] = block.StartTime.split(':').map(Number);
        const [endHour, endMin] = block.EndTime.split(':').map(Number);
        
        const startTime = new Date(scheduleDate);
        startTime.setHours(startHour, startMin, 0, 0);
        
        const endTime = new Date(scheduleDate);
        endTime.setHours(endHour, endMin, 0, 0);
        
        return {
          id: `schedule-${schedule.ID}-${blockIdx}`,
          workerName: schedule.Staff?.Name || 'Unassigned',
          role: schedule.Staff?.Type || 'Schedule',
          projectId: '',
          projectName: '',
          scheduledStart: startTime,
          scheduledEnd: endTime,
          actualStart: null,
          actualEnd: null,
          status: LogStatus.PENDING,
          isSchedule: true,
          scheduleData: schedule,
          blockData: block,
        };
      }) || [];
    }).flat();
  
  // Combine logs and schedule items
  const allItems: TimelineItem[] = [...logs.map(log => ({ ...log, isSchedule: false })), ...scheduleItems];
  
  if (allItems.length === 0) return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Clock className="w-10 h-10 mb-2 opacity-20" />
          <p>No active shifts recorded for {currentDate.toLocaleDateString()}.</p>
      </div>
  );

  let minTime = new Date(currentDate);
  minTime.setHours(8, 0, 0, 0);
  let maxTime = new Date(currentDate);
  maxTime.setHours(18, 0, 0, 0);

  allItems.forEach(item => {
    if (item.scheduledStart < minTime) minTime = new Date(item.scheduledStart);
    if (item.scheduledEnd > maxTime) maxTime = new Date(item.scheduledEnd);
    if (item.actualStart && item.actualStart < minTime) minTime = new Date(item.actualStart);
    const endRef = item.actualEnd || new Date();
    // Only extend for "live" logs if they belong to today. If viewing past, clip it? 
    // For simplicity, just use the endRef.
    if (endRef > maxTime) maxTime = endRef;
  });

  minTime = new Date(minTime.getTime() - 30 * 60000);
  maxTime = new Date(maxTime.getTime() + 30 * 60000);
  const totalDuration = maxTime.getTime() - minTime.getTime();
  const getPos = (date: Date) => Math.max(0, Math.min(100, ((date.getTime() - minTime.getTime()) / totalDuration) * 100));

  const markers = [];
  const curr = new Date(minTime);
  curr.setMinutes(0, 0, 0);
  if (curr < minTime) curr.setHours(curr.getHours() + 1);
  while (curr < maxTime) {
    markers.push(new Date(curr));
    curr.setHours(curr.getHours() + 1);
  }

  const now = new Date();
  const isToday = currentDate.getDate() === now.getDate() && 
                  currentDate.getMonth() === now.getMonth() && 
                  currentDate.getFullYear() === now.getFullYear();
                  
  const currentPos = getPos(now);

  return (
    <div className="mt-4 relative overflow-x-auto">
      {/* Container with min-width to ensure scroll on mobile */}
      <div className="min-w-[600px] pb-4">
        <div className="relative h-6 w-full border-b border-gray-200 mb-4">
            {markers.map((time, i) => (
            <div key={i} className="absolute bottom-0 text-[10px] text-gray-400 transform -translate-x-1/2 border-l border-gray-200 h-full pl-1" style={{ left: `${getPos(time)}%` }}>
                {time.getHours()}:00
            </div>
            ))}
        </div>
        <div className="space-y-6">
            {allItems.map((item) => {
            const schedLeft = getPos(item.scheduledStart);
            const schedWidth = getPos(item.scheduledEnd) - schedLeft;
            const actualStart = item.actualStart || (item.isSchedule ? null : item.scheduledStart);
            const actualEnd = item.actualEnd || (item.isSchedule ? null : (isToday ? now : item.scheduledEnd));
            const isLive = !item.actualEnd && !item.isSchedule && isToday;
            
            const actualLeft = actualStart ? getPos(actualStart) : schedLeft;
            const actualWidth = actualStart ? Math.max(1, getPos(actualEnd) - actualLeft) : 0;
            
            // Status colors - schedules use different styling
            let barColor = 'bg-indigo-500';
            if (!item.isSchedule) {
              barColor = isLive ? 'bg-green-500' : (item.status === LogStatus.APPROVED ? 'bg-blue-500' : 'bg-amber-400');
            }

            return (
                <div key={item.id} className="group flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                    <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              item.isSchedule ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                                {item.workerName.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.workerName}</p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {item.isSchedule ? 'Scheduled' : item.role}
                                </p>
                            </div>
                    </div>
                </div>
                <div className="flex-1 relative h-8 bg-gray-50 rounded border border-gray-100 overflow-hidden">
                        {markers.map((time, i) => (<div key={i} className="absolute top-0 bottom-0 w-px bg-gray-200 opacity-30" style={{ left: `${getPos(time)}%` }}></div>))}
                        <div 
                          className={`absolute top-1.5 h-5 rounded-sm ${
                            item.isSchedule 
                              ? 'bg-indigo-100 border border-indigo-300' 
                              : 'bg-indigo-100/50 border border-indigo-200 border-dashed'
                          }`} 
                          style={{ left: `${schedLeft}%`, width: `${schedWidth}%` }}
                        >
                          {item.isSchedule && item.blockData && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-indigo-700">
                              {item.blockData.Hrs}h
                            </span>
                          )}
                        </div>
                        {!item.isSchedule && item.actualStart && (
                            <div className={`absolute top-2.5 h-3 rounded-full shadow-sm ${barColor} transition-all duration-500`} style={{ left: `${actualLeft}%`, width: `${actualWidth}%` }}>
                                {isLive && <span className="absolute -right-1 top-0 bottom-0 w-2 bg-white/30 animate-pulse rounded-full"></span>}
                            </div>
                        )}
                </div>
                <div className="w-24 text-right flex-shrink-0">
                    {item.isSchedule ? (
                      <>
                        <div className="text-xs font-bold text-indigo-600">Scheduled</div>
                        <div className="text-[10px] text-gray-400">
                          {formatTime(item.scheduledStart)} - {formatTime(item.scheduledEnd)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`text-xs font-bold ${isLive ? 'text-green-600' : 'text-gray-600'}`}>{isLive ? 'Active' : 'Done'}</div>
                        <div className="text-[10px] text-gray-400">
                          {item.actualStart ? formatTime(item.actualStart) : '--'} - {isLive ? '...' : (item.actualEnd ? formatTime(item.actualEnd) : '--')}
                        </div>
                      </>
                    )}
                </div>
                </div>
            );
            })}
        </div>
        {isToday && currentPos > 0 && currentPos < 100 && (
            <div className="absolute top-8 bottom-4 w-px bg-red-400 z-10 pointer-events-none border-l border-dashed border-red-500" style={{ left: `${currentPos}%` }}>
                <div className="absolute -top-1 -translate-x-1/2 text-[9px] bg-red-500 text-white px-1 rounded shadow-sm whitespace-nowrap">Now</div>
            </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-[10px] text-gray-500 justify-end flex-wrap">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-300"></div> Schedule</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-200 border-dashed"></div> Log Scheduled</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Active</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Completed</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded-full"></div> Pending Review</div>
      </div>
    </div>
  );
};

// --- Main Detail Component ---

interface SimPROProjectDetailProps {
  project: Project;
  logs: WorkerLog[];
  onBack: () => void;
  onAnalyze: (p: Project) => void;
}

export const SimPROProjectDetail: React.FC<SimPROProjectDetailProps> = ({ project, logs, onBack, onAnalyze }) => {
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

  // Filter logs for selected Date
  const displayLogs = logs.filter(l => 
    l.scheduledStart.getDate() === currentDate.getDate() && 
    l.scheduledStart.getMonth() === currentDate.getMonth() &&
    l.scheduledStart.getFullYear() === currentDate.getFullYear()
  );
  
  // Filter schedules for selected Date
  const displaySchedules = project.schedules?.filter(s => {
    if (!s.Date) return false;
    const scheduleDate = new Date(s.Date);
    return scheduleDate.getDate() === currentDate.getDate() &&
           scheduleDate.getMonth() === currentDate.getMonth() &&
           scheduleDate.getFullYear() === currentDate.getFullYear();
  }) || [];

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
                                <WorkerGanttChart logs={displayLogs} currentDate={currentDate} schedules={displaySchedules} />
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
                        <div className="animate-in fade-in duration-300 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Project Overview</h3>
                            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</label>
                                    <p className="text-gray-700 mt-2 leading-relaxed">{project.description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Start Date</label>
                                        <p className="text-gray-900 mt-1 font-medium">{project.scheduledStart.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Projected End</label>
                                        <p className="text-gray-900 mt-1 font-medium">{project.scheduledEnd.toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tags</label>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                {tag}
                                            </span>
                                        ))}
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
