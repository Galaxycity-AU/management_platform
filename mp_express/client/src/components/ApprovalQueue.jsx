import React, { useState, useMemo, useEffect } from 'react';
import { Check, X, Wand2, Briefcase, History, Edit2, Save, ArrowRight, Clock, AlertCircle, Filter } from 'lucide-react';
import { LogStatus } from '../types';
import { suggestApprovalAction } from '../services/geminiService';

// --- Helper Components ---

const TimelineComparison = ({ log, isHistory }) => {
  const schedStart = log.scheduledStart;
  const schedEnd = log.scheduledEnd;
  
  // For history, show the FINAL adjusted time as the main "Actual" bar
  const actStart = log.actualStart || schedStart;
  const actEnd = log.actualEnd || schedEnd;

  // Calculate view range
  let minTime = new Date(Math.min(schedStart.getTime(), actStart.getTime()));
  let maxTime = new Date(Math.max(schedEnd.getTime(), actEnd.getTime()));
  
  // If we have original times that differ, include them in range calc
  if (isHistory && log.originalActualEnd && log.originalActualEnd.getTime() > maxTime.getTime()) {
      maxTime = log.originalActualEnd;
  }

  // Padding
  minTime = new Date(minTime.getTime() - 30 * 60000);
  maxTime = new Date(maxTime.getTime() + 30 * 60000);

  const totalDuration = maxTime.getTime() - minTime.getTime();
  const getPos = (d) => ((d.getTime() - minTime.getTime()) / totalDuration) * 100;
  const getWidth = (s, e) => Math.max(1, getPos(e) - getPos(s));

  const actDuration = actEnd.getTime() - actStart.getTime();
  const schedDuration = schedEnd.getTime() - schedStart.getTime();
  const isOvertime = actDuration > schedDuration + 30 * 60000;
  
  const barColor = isOvertime ? 'bg-amber-500' : 'bg-indigo-600';

  return (
    <div className="flex flex-col w-full mt-2">
      <div className="relative h-14 w-full bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        {/* Grid lines */}
        {Array.from({ length: 12 }).map((_, i) => {
            const t = new Date(minTime.getTime() + i * 60 * 60000);
            if (t > maxTime) return null;
            return (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-200 opacity-50" style={{ left: `${getPos(t)}%` }}></div>
            );
        })}

        {/* Scheduled Bar (Top) */}
        <div 
          className="absolute top-2 h-2.5 bg-gray-300 rounded-sm opacity-60"
          style={{ left: `${getPos(schedStart)}%`, width: `${getWidth(schedStart, schedEnd)}%` }}
        ></div>
        <span className="absolute top-1 text-[9px] text-gray-500 font-medium ml-1" style={{ left: `${getPos(schedEnd)}%` }}>Sched</span>

        {/* Actual Bar (Middle/Bottom) */}
        <div 
          className={`absolute top-6 h-3.5 rounded-md shadow-sm ${barColor} z-10`}
          style={{ left: `${getPos(actStart)}%`, width: `${getWidth(actStart, actEnd)}%` }}
        ></div>
        
        {/* Original Claimed Time (Ghost Bar) - Only if different */}
        {isHistory && log.originalActualEnd && log.originalActualEnd.getTime() !== actEnd.getTime() && (
            <div 
                className="absolute top-6 h-3.5 bg-red-200/50 border border-red-300 border-dashed rounded-md z-0"
                style={{ 
                    left: `${getPos(log.originalActualStart || actStart)}%`, 
                    width: `${getWidth(log.originalActualStart || actStart, log.originalActualEnd)}%` 
                }}
                title={`Original Claim: ${log.originalActualEnd.toLocaleTimeString()}`}
            ></div>
        )}

        <span className={`absolute top-6 text-[9px] font-bold ml-1 ${isOvertime ? 'text-amber-600' : 'text-indigo-600'}`} style={{ left: `${getPos(actEnd)}%` }}>
            {isHistory ? 'Adjusted' : 'Actual'}
        </span>
      </div>
    </div>
  );
};

const LogApprovalCard = ({ log, onApprove, onReject }) => {
    const [suggestion, setSuggestion] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editStartTime, setEditStartTime] = useState(log.actualStart ? log.actualStart.toTimeString().slice(0, 5) : '');
    const [editEndTime, setEditEndTime] = useState(log.actualEnd ? log.actualEnd.toTimeString().slice(0, 5) : '');
    const [editReason, setEditReason] = useState('');

    const handleAiSuggest = async () => {
        setLoadingAI(true);
        const result = await suggestApprovalAction(log);
        setSuggestion(result);
        setLoadingAI(false);
    };

    const handleSaveAndApprove = () => {
        if (!log.actualStart || !log.actualEnd) return;

        // Reconstruct Date objects from time strings
        const [startH, startM] = editStartTime.split(':').map(Number);
        const [endH, endM] = editEndTime.split(':').map(Number);
        
        const newStart = new Date(log.actualStart);
        newStart.setHours(startH, startM);
        
        const newEnd = new Date(log.actualEnd);
        newEnd.setHours(endH, endM);

        onApprove(log.id, newStart, newEnd, editReason || 'Manual adjustment');
    };

    const startDiff = log.actualStart ? (log.actualStart.getTime() - log.scheduledStart.getTime()) / 60000 : 0;
    const endDiff = log.actualEnd ? (log.actualEnd.getTime() - log.scheduledEnd.getTime()) / 60000 : 0;
    const hasIssues = startDiff > 10 || endDiff < -10 || endDiff > 15;

    return (
        <div className={`p-4 bg-white border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${hasIssues ? 'bg-amber-50/10' : ''}`}>
            <div className="flex flex-col md:flex-row gap-4">
                {/* Worker Info */}
                <div className="w-full md:w-48 flex-shrink-0 flex items-center md:block gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {log.workerName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{log.workerName}</p>
                            <p className="text-xs text-gray-500">{log.role}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {!isEditing ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between text-xs mb-1 gap-1">
                                <span className="text-gray-400">Schedule vs Actual</span>
                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                                    <span>
                                        <span className="text-gray-400 mr-1">Act:</span> 
                                        <span className={`font-bold ${hasIssues ? 'text-amber-600' : 'text-indigo-600'}`}>
                                            {log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <TimelineComparison log={log} />
                            {log.notes && (
                                <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded italic">
                                    "{log.notes}"
                                </div>
                            )}
                            {suggestion && (
                                <div className={`mt-2 text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${suggestion === 'Approve' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                    <Wand2 className="w-3 h-3" /> AI: <strong>{suggestion}</strong>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                             <div className="flex items-center gap-2 mb-3 text-indigo-700 font-medium text-sm">
                                 <Edit2 className="w-4 h-4" /> Adjust Time Log
                             </div>
                             <div className="grid grid-cols-2 gap-4 mb-3">
                                 <div>
                                     <label className="text-xs text-gray-500 font-semibold uppercase">Start Time</label>
                                     <input 
                                        type="time" 
                                        value={editStartTime}
                                        onChange={(e) => setEditStartTime(e.target.value)}
                                        className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500 font-semibold uppercase">End Time</label>
                                     <input 
                                        type="time" 
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                        className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                     />
                                 </div>
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 font-semibold uppercase">Reason for Adjustment</label>
                                 <input 
                                    type="text" 
                                    placeholder="e.g. Lunch break not recorded, Policy adjustment..."
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                 />
                             </div>
                             <div className="flex justify-end gap-2 mt-4">
                                 <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
                                 <button 
                                    onClick={handleSaveAndApprove}
                                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-medium"
                                 >
                                     <Save className="w-3 h-3" /> Save & Approve
                                 </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isEditing && (
                    <div className="flex flex-row md:flex-col items-center gap-2 md:w-28 md:pl-4 md:border-l md:border-gray-100">
                        <button onClick={() => onApprove(log.id)} className="w-full flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 p-2 rounded-lg text-xs font-medium transition-colors">
                            <Check className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-center gap-1 bg-gray-50 text-gray-700 hover:bg-gray-100 p-2 rounded-lg text-xs font-medium transition-colors">
                            <Edit2 className="w-4 h-4" /> Adjust
                        </button>
                        <button onClick={() => onReject(log.id)} className="w-full flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 p-2 rounded-lg text-xs font-medium transition-colors">
                            <X className="w-4 h-4" /> Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoryLogCard = ({ log }) => {
    // Check if adjusted
    const isAdjusted = log.originalActualEnd && log.actualEnd && log.originalActualEnd.getTime() !== log.actualEnd.getTime();
    
    return (
        <div className="p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
             <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48 flex-shrink-0">
                     <p className="font-semibold text-gray-900 text-sm">{log.workerName}</p>
                     <p className="text-xs text-gray-500">{log.role}</p>
                     <div className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                         {log.status}
                     </div>
                </div>

                <div className="flex-1 min-w-0">
                     {isAdjusted ? (
                         <div className="mb-2 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-3">
                             <div className="mt-0.5"><Edit2 className="w-3 h-3 text-amber-600" /></div>
                             <div className="text-xs text-amber-800">
                                 <div className="flex items-center gap-2 mb-1 font-medium">
                                     <span className="text-gray-500 line-through decoration-red-400">{log.originalActualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.originalActualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                     <ArrowRight className="w-3 h-3" />
                                     <span>{log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                 </div>
                                 {log.adjustmentReason && <p>Reason: "{log.adjustmentReason}"</p>}
                             </div>
                         </div>
                     ) : (
                         <div className="text-xs text-gray-600 mb-2">
                             Actual: <span className="font-medium">{log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                         </div>
                     )}

                     <TimelineComparison log={log} isHistory />
                     
                     <div className="mt-2 flex justify-between items-end">
                         <p className="text-[10px] text-gray-400">
                             Approved {log.approvedAt ? `at ${log.approvedAt.toLocaleDateString()} ${log.approvedAt.toLocaleTimeString()}` : ''}
                         </p>
                     </div>
                </div>
             </div>
        </div>
    );
};

export const ApprovalQueue = ({ logs, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [historyProjectFilter, setHistoryProjectFilter] = useState('all');
  
  const pendingLogs = useMemo(() => logs.filter(l => l.status === LogStatus.WAITING_APPROVAL), [logs]);
  const historyLogs = useMemo(() => logs.filter(l => l.status !== LogStatus.WAITING_APPROVAL).sort((a,b) => (b.actualEnd?.getTime() || 0) - (a.actualEnd?.getTime() || 0)), [logs]);
  
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
  useEffect(() => {
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

  const selectedProject = pendingProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
          <button 
             onClick={() => setActiveTab('PENDING')}
             className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PENDING' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Clock className="w-4 h-4" />
              Pending Reviews 
              {pendingLogs.length > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{pendingLogs.length}</span>}
          </button>
          <button 
             onClick={() => setActiveTab('HISTORY')}
             className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <History className="w-4 h-4" />
               History
              {historyLogs.length > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{historyLogs.length}</span>}
          </button>
      </div>

      {activeTab === 'PENDING' && (
          <>
            {pendingLogs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mt-8">
                    <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">All Caught Up!</h3>
                    <p className="text-gray-500 mt-2">No pending time logs to approve.</p>
                </div>
            ) : (
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
                            <LogApprovalCard key={log.id} log={log} onApprove={onApprove} onReject={onReject} />
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
            )}
          </>
      )}

      {activeTab === 'HISTORY' && (
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

            {/* History Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Recent Decisions</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredHistoryLogs.slice(0, 20).map(log => (
                  <HistoryLogCard key={log.id} log={log} />
                ))}
                {filteredHistoryLogs.length === 0 && (
                  <div className="p-8 text-center text-gray-400">No history available yet.</div>
                )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
};
