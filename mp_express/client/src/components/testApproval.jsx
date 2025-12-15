import React, { useState, useMemo } from 'react';
import { 
  Check, X, Wand2, Briefcase, History, Edit2, Save, ArrowRight, 
  Clock, AlertCircle, ChevronDown, ChevronUp, Calendar, User, Filter
} from 'lucide-react';

// Mock data with different scenarios
const mockLogs = [
  // Case 1: Perfect Match - No issues
  {
    id: '1',
    workerName: 'John Smith',
    role: 'Senior Developer',
    projectId: 'p1',
    projectName: 'Website Redesign',
    scheduledStart: new Date('2025-01-15T09:00:00'),
    scheduledEnd: new Date('2025-01-15T17:00:00'),
    actualStart: new Date('2025-01-15T09:05:00'),
    actualEnd: new Date('2025-01-15T17:02:00'),
    status: 'WAITING_APPROVAL',
    notes: 'Completed all assigned tasks for the day',
  },
  
  // Case 2: Overtime - Worked extra hours
  {
    id: '2',
    workerName: 'Sarah Johnson',
    role: 'UI/UX Designer',
    projectId: 'p1',
    projectName: 'Website Redesign',
    scheduledStart: new Date('2025-01-15T09:00:00'),
    scheduledEnd: new Date('2025-01-15T17:00:00'),
    actualStart: new Date('2025-01-15T09:00:00'),
    actualEnd: new Date('2025-01-15T19:30:00'),
    status: 'WAITING_APPROVAL',
    notes: 'Client requested urgent design changes. Stayed late to complete revisions.',
  },
  
  // Case 3: Late Start - Came in late
  {
    id: '3',
    workerName: 'Mike Chen',
    role: 'Backend Developer',
    projectId: 'p2',
    projectName: 'Mobile App Development',
    scheduledStart: new Date('2025-01-15T09:00:00'),
    scheduledEnd: new Date('2025-01-15T17:00:00'),
    actualStart: new Date('2025-01-15T09:45:00'),
    actualEnd: new Date('2025-01-15T17:00:00'),
    status: 'WAITING_APPROVAL',
    notes: 'Dentist appointment in the morning',
  },
  
  // Case 4: Early Finish - Left early
  {
    id: '4',
    workerName: 'Emily Rodriguez',
    role: 'Project Manager',
    projectId: 'p2',
    projectName: 'Mobile App Development',
    scheduledStart: new Date('2025-01-15T09:00:00'),
    scheduledEnd: new Date('2025-01-15T17:00:00'),
    actualStart: new Date('2025-01-15T09:00:00'),
    actualEnd: new Date('2025-01-15T15:30:00'),
    status: 'WAITING_APPROVAL',
    notes: 'Medical emergency - left early with supervisor approval',
  },
  
  // Case 5: Both Late Start AND Overtime
  {
    id: '5',
    workerName: 'David Park',
    role: 'Full Stack Developer',
    projectId: 'p3',
    projectName: 'E-commerce Platform',
    scheduledStart: new Date('2025-01-15T09:00:00'),
    scheduledEnd: new Date('2025-01-15T17:00:00'),
    actualStart: new Date('2025-01-15T10:00:00'),
    actualEnd: new Date('2025-01-15T19:00:00'),
    status: 'WAITING_APPROVAL',
    notes: 'Traffic delay. Worked late to make up time and complete sprint tasks.',
  },
  
  // Case 6: Approved with Adjustment (History)
  {
    id: '6',
    workerName: 'Lisa Wang',
    role: 'QA Engineer',
    projectId: 'p1',
    projectName: 'Website Redesign',
    scheduledStart: new Date('2025-01-14T09:00:00'),
    scheduledEnd: new Date('2025-01-14T17:00:00'),
    originalActualStart: new Date('2025-01-14T09:00:00'),
    originalActualEnd: new Date('2025-01-14T18:30:00'),
    actualStart: new Date('2025-01-14T09:00:00'),
    actualEnd: new Date('2025-01-14T17:30:00'),
    status: 'APPROVED',
    adjustmentReason: 'Lunch break was not logged - 1 hour deducted per policy',
    approvedAt: new Date('2025-01-14T20:00:00'),
    approvedBy: 'Jane Smith',
  },
  
  // Case 7: Rejected (History)
  {
    id: '7',
    workerName: 'Tom Anderson',
    role: 'Junior Developer',
    projectId: 'p3',
    projectName: 'E-commerce Platform',
    scheduledStart: new Date('2025-01-13T09:00:00'),
    scheduledEnd: new Date('2025-01-13T17:00:00'),
    actualStart: new Date('2025-01-13T11:00:00'),
    actualEnd: new Date('2025-01-13T17:00:00'),
    status: 'REJECTED',
    notes: 'Overslept',
    approvedAt: new Date('2025-01-13T18:00:00'),
    approvedBy: 'Jane Smith',
  },
  
  // Case 8: Normal Approved (History)
  {
    id: '8',
    workerName: 'Alex Kumar',
    role: 'DevOps Engineer',
    projectId: 'p2',
    projectName: 'Mobile App Development',
    scheduledStart: new Date('2025-01-12T09:00:00'),
    scheduledEnd: new Date('2025-01-12T17:00:00'),
    actualStart: new Date('2025-01-12T09:00:00'),
    actualEnd: new Date('2025-01-12T17:00:00'),
    status: 'APPROVED',
    approvedAt: new Date('2025-01-12T17:30:00'),
    approvedBy: 'Jane Smith',
  },

  // Additional history entries
  {
    id: '9',
    workerName: 'Jessica Brown',
    role: 'Frontend Developer',
    projectId: 'p4',
    projectName: 'Dashboard Analytics',
    scheduledStart: new Date('2025-01-11T09:00:00'),
    scheduledEnd: new Date('2025-01-11T17:00:00'),
    actualStart: new Date('2025-01-11T09:10:00'),
    actualEnd: new Date('2025-01-11T17:05:00'),
    status: 'APPROVED',
    approvedAt: new Date('2025-01-11T18:00:00'),
    approvedBy: 'John Doe',
  },

  {
    id: '10',
    workerName: 'Robert Taylor',
    role: 'Data Analyst',
    projectId: 'p4',
    projectName: 'Dashboard Analytics',
    scheduledStart: new Date('2025-01-10T09:00:00'),
    scheduledEnd: new Date('2025-01-10T17:00:00'),
    actualStart: new Date('2025-01-10T09:00:00'),
    actualEnd: new Date('2025-01-10T18:30:00'),
    status: 'APPROVED',
    notes: 'Critical data migration completed',
    approvedAt: new Date('2025-01-10T19:00:00'),
    approvedBy: 'Jane Smith',
  },
];

const TimelineComparison = ({ log, isHistory }) => {
  const schedStart = log.scheduledStart;
  const schedEnd = log.scheduledEnd;
  
  const actStart = log.actualStart || schedStart;
  const actEnd = log.actualEnd || schedEnd;

  let minTime = new Date(Math.min(schedStart.getTime(), actStart.getTime()));
  let maxTime = new Date(Math.max(schedEnd.getTime(), actEnd.getTime()));
  
  if (isHistory && log.originalActualEnd && log.originalActualEnd.getTime() > maxTime.getTime()) {
    maxTime = log.originalActualEnd;
  }

  minTime = new Date(minTime.getTime() - 30 * 60000);
  maxTime = new Date(maxTime.getTime() + 30 * 60000);

  const totalDuration = maxTime.getTime() - minTime.getTime();
  const getPos = (d) => ((d.getTime() - minTime.getTime()) / totalDuration) * 100;
  const getWidth = (s, e) => Math.max(1, getPos(e) - getPos(s));

  const actDuration = actEnd.getTime() - actStart.getTime();
  const schedDuration = schedEnd.getTime() - schedStart.getTime();
  const isOvertime = actDuration > schedDuration + 30 * 60000;
  
  const barColor = isOvertime ? 'bg-amber-500' : 'bg-indigo-600';
  const overtimeMinutes = Math.max(0, (actDuration - schedDuration) / 60000);
  const overtimeHours = (overtimeMinutes / 60).toFixed(1);

  return (
    <div className="flex flex-col w-full mt-3">
      <div className="relative h-16 w-full bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => {
          const t = new Date(minTime.getTime() + i * 60 * 60000);
          if (t > maxTime) return null;
          return (
            <div key={i} className="absolute top-0 bottom-0" style={{ left: `${getPos(t)}%` }}>
              <div className="w-px h-full bg-gray-200 opacity-50"></div>
              <span className="absolute top-0 -ml-4 text-[9px] text-gray-400">
                {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        <div 
          className="absolute top-5 h-3 bg-gray-300 rounded-sm opacity-60"
          style={{ left: `${getPos(schedStart)}%`, width: `${getWidth(schedStart, schedEnd)}%` }}
        ></div>
        <span className="absolute top-4 text-[9px] text-gray-500 font-medium" style={{ left: `${getPos(schedStart)}%` }}>
          Scheduled
        </span>

        <div 
          className={`absolute top-10 h-4 rounded-md shadow-sm ${barColor} z-10 transition-all`}
          style={{ left: `${getPos(actStart)}%`, width: `${getWidth(actStart, actEnd)}%` }}
        >
          {isOvertime && overtimeMinutes > 30 && (
            <div className="absolute -top-5 right-0 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
              +{overtimeHours}h OT
            </div>
          )}
        </div>
        
        {isHistory && log.originalActualEnd && log.originalActualEnd.getTime() !== actEnd.getTime() && (
          <div 
            className="absolute top-10 h-4 bg-red-200/50 border border-red-300 border-dashed rounded-md z-0"
            style={{ 
              left: `${getPos(log.originalActualStart || actStart)}%`, 
              width: `${getWidth(log.originalActualStart || actStart, log.originalActualEnd)}%` 
            }}
          ></div>
        )}

        <span className={`absolute top-9 text-[10px] font-bold ${isOvertime ? 'text-amber-600' : 'text-indigo-600'}`} 
          style={{ left: `${getPos(actStart)}%` }}>
          {isHistory ? 'Adjusted' : 'Actual'}
        </span>
      </div>

      <div className="flex justify-between mt-2 text-[11px] text-gray-500">
        <span>Duration: {(actDuration / 3600000).toFixed(1)}h</span>
        {isOvertime && overtimeMinutes > 30 && (
          <span className="text-amber-600 font-medium">Overtime: +{overtimeHours}h</span>
        )}
      </div>
    </div>
  );
};

const LogDetailCard = ({ log, onApprove, onReject, isHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const startDiff = log.actualStart ? (log.actualStart.getTime() - log.scheduledStart.getTime()) / 60000 : 0;
  const endDiff = log.actualEnd ? (log.actualEnd.getTime() - log.scheduledEnd.getTime()) / 60000 : 0;
  const hasIssues = Math.abs(startDiff) > 10 || Math.abs(endDiff) > 15;

  const duration = log.actualEnd && log.actualStart 
    ? ((log.actualEnd.getTime() - log.actualStart.getTime()) / 3600000).toFixed(1)
    : '0.0';

  const isAdjusted = log.originalActualEnd && log.actualEnd && 
    log.originalActualEnd.getTime() !== log.actualEnd.getTime();

  if (isHistory) {
    return (
      <div className="p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold shadow flex-shrink-0">
            {log.workerName.charAt(0)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{log.workerName}</p>
                <p className="text-xs text-gray-500">{log.role}</p>
              </div>
              
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                log.status === 'APPROVED' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {log.status === 'APPROVED' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {log.status}
              </div>
            </div>

            {isAdjusted && (
              <div className="mb-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-900 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1 font-medium">
                      <span className="text-gray-500 line-through">
                        {log.originalActualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                        {log.originalActualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-amber-800 font-semibold">
                        {log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                        {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    {log.adjustmentReason && (
                      <p className="text-amber-700"><strong>Reason:</strong> {log.adjustmentReason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isAdjusted && (
              <div className="text-sm mb-2">
                <span className="text-gray-500 text-xs">Time: </span>
                <span className="font-medium text-gray-900">
                  {log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                  {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </span>
                <span className="text-xs text-gray-500 ml-2">({duration}h)</span>
              </div>
            )}

            <TimelineComparison log={log} isHistory />
            
            <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="w-3 h-3" />
              {log.approvedAt && new Date(log.approvedAt).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
              {log.approvedBy && <span className="ml-2">by {log.approvedBy}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative transition-all ${hasIssues ? 'bg-amber-50/30' : 'bg-white'}`}>
      {hasIssues && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
            {log.workerName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{log.workerName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {log.role}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{duration}h</span>
              </div>
            </div>

            {hasIssues && (
              <div className="mb-2 flex flex-wrap gap-1">
                {Math.abs(startDiff) > 10 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {startDiff > 0 ? `+${Math.round(startDiff)}min late` : `${Math.round(Math.abs(startDiff))}min early`}
                  </span>
                )}
                {Math.abs(endDiff) > 15 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {endDiff > 0 ? `+${Math.round(endDiff)}min OT` : `${Math.round(Math.abs(endDiff))}min early`}
                  </span>
                )}
              </div>
            )}

            <div className="mb-2 text-xs text-gray-500">
              Scheduled: {log.scheduledStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
              {log.scheduledEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>

            <div className="mb-2 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Actual:</span>
                <span className={`font-bold text-sm ${hasIssues ? 'text-amber-600' : 'text-indigo-600'}`}>
                  {log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                  {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>

            <TimelineComparison log={log} />

            {log.notes && (
              <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                <span className="font-semibold">Note: </span>
                <span className="italic">{log.notes}</span>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => onApprove(log.id)} 
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>

              <button 
                onClick={() => onReject(log.id)} 
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function ApprovalDemo() {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [historyProjectFilter, setHistoryProjectFilter] = useState('all');
  const [logs, setLogs] = useState(mockLogs);

  const pendingLogs = useMemo(() => logs.filter(l => l.status === 'WAITING_APPROVAL'), [logs]);
  const historyLogs = useMemo(() => 
    logs.filter(l => l.status !== 'WAITING_APPROVAL')
      .sort((a, b) => (b.approvedAt?.getTime() || 0) - (a.approvedAt?.getTime() || 0)),
    [logs]
  );

  // Get unique projects for pending
  const pendingProjects = useMemo(() => {
    const projectMap = new Map();
    pendingLogs.forEach(log => {
      if (!projectMap.has(log.projectId)) {
        projectMap.set(log.projectId, {
          id: log.projectId,
          name: log.projectName,
          count: 0,
          hasIssues: false
        });
      }
      const project = projectMap.get(log.projectId);
      project.count++;
      
      const startDiff = Math.abs((log.actualStart?.getTime() || 0) - log.scheduledStart.getTime()) / 60000;
      const endDiff = Math.abs((log.actualEnd?.getTime() || 0) - log.scheduledEnd.getTime()) / 60000;
      if (startDiff > 10 || endDiff > 15) {
        project.hasIssues = true;
      }
    });
    return Array.from(projectMap.values());
  }, [pendingLogs]);

  // Get unique projects for history filter
  const historyProjects = useMemo(() => {
    const projectMap = new Map();
    historyLogs.forEach(log => {
      if (!projectMap.has(log.projectId)) {
        projectMap.set(log.projectId, {
          id: log.projectId,
          name: log.projectName
        });
      }
    });
    return Array.from(projectMap.values());
  }, [historyLogs]);

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (activeTab === 'PENDING' && pendingProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(pendingProjects[0].id);
    }
  }, [activeTab, pendingProjects, selectedProjectId]);

  const selectedProjectLogs = useMemo(() => {
    if (!selectedProjectId) return [];
    return pendingLogs.filter(log => log.projectId === selectedProjectId);
  }, [pendingLogs, selectedProjectId]);

  const filteredHistoryLogs = useMemo(() => {
    if (historyProjectFilter === 'all') return historyLogs;
    return historyLogs.filter(log => log.projectId === historyProjectFilter);
  }, [historyLogs, historyProjectFilter]);

  const handleApprove = (id) => {
    setLogs(prev => prev.map(l => 
      l.id === id ? { ...l, status: 'APPROVED', approvedAt: new Date(), approvedBy: 'You' } : l
    ));
  };

  const handleReject = (id) => {
    setLogs(prev => prev.map(l => 
      l.id === id ? { ...l, status: 'REJECTED', approvedAt: new Date(), approvedBy: 'You' } : l
    ));
  };

  const selectedProject = pendingProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timesheet Approvals</h1>
          <p className="text-gray-600">Review and approve worker time entries by project</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-6">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'PENDING' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Reviews 
            {pendingLogs.length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {pendingLogs.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'HISTORY' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            History
            <span className="text-xs text-gray-400">({historyLogs.length})</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'PENDING' ? (
          <div className="flex gap-6">
            {/* Left Sidebar - Project List */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Projects
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {pendingProjects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Check className="w-12 h-12 mx-auto mb-2 text-green-400" />
                      <p className="text-sm">All caught up!</p>
                    </div>
                  ) : (
                    pendingProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`w-full text-left p-4 transition-colors ${
                          selectedProjectId === project.id
                            ? 'bg-indigo-50 border-l-4 border-indigo-600'
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{project.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.count} {project.count === 1 ? 'entry' : 'entries'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.hasIssues && (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              selectedProjectId === project.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {project.count}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Selected Project Details */}
            <div className="flex-1">
              {selectedProjectId && selectedProject ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedProject.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedProjectLogs.length} time {selectedProjectLogs.length === 1 ? 'entry' : 'entries'} pending approval
                        </p>
                      </div>
                      {selectedProject.hasIssues && (
                        <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Has Issues
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {selectedProjectLogs.map(log => (
                      <LogDetailCard
                        key={log.id}
                        log={log}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a project to view time entries</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // History Tab
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Filter by Project:</label>
              <select
                value={historyProjectFilter}
                onChange={(e) => setHistoryProjectFilter(e.target.value)}
                className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Projects ({historyLogs.length})</option>
                {historyProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({historyLogs.filter(l => l.projectId === project.id).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Project List for History */}
            <div className="grid grid-cols-1 gap-4">
              {historyProjects
                .filter(project => historyProjectFilter === 'all' || project.id === historyProjectFilter)
                .map(project => {
                  const projectLogs = filteredHistoryLogs.filter(log => log.projectId === project.id);
                  if (projectLogs.length === 0) return null;

                  return (
                    <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-600" />
                            {project.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {projectLogs.length} {projectLogs.length === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {projectLogs.map(log => (
                          <LogDetailCard key={log.id} log={log} isHistory />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {filteredHistoryLogs.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No history entries found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalDemo;