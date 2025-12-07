
import React, { useState, useMemo } from 'react';
import { WorkerLog, LogStatus } from '../types';
import { Check, X, Wand2, AlertTriangle, Clock, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { suggestApprovalAction } from '../services/geminiService';

interface ApprovalQueueProps {
  logs: WorkerLog[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

// --- Helper Components ---

const TimelineComparison: React.FC<{ log: WorkerLog }> = ({ log }) => {
  const schedStart = log.scheduledStart;
  const schedEnd = log.scheduledEnd;
  const actStart = log.actualStart || schedStart;
  const actEnd = log.actualEnd || schedEnd;

  // Calculate view range (min start to max end + padding)
  let minTime = new Date(Math.min(schedStart.getTime(), actStart.getTime()));
  let maxTime = new Date(Math.max(schedEnd.getTime(), actEnd.getTime()));
  
  // Add 30 mins padding
  minTime = new Date(minTime.getTime() - 30 * 60000);
  maxTime = new Date(maxTime.getTime() + 30 * 60000);

  const totalDuration = maxTime.getTime() - minTime.getTime();

  const getPos = (d: Date) => ((d.getTime() - minTime.getTime()) / totalDuration) * 100;
  const getWidth = (s: Date, e: Date) => Math.max(1, getPos(e) - getPos(s));

  // Determine status color based on adherence
  // If actual duration is significantly longer (> 30 mins), warn
  const actDuration = actEnd.getTime() - actStart.getTime();
  const schedDuration = schedEnd.getTime() - schedStart.getTime();
  const isOvertime = actDuration > schedDuration + 30 * 60000;
  const isUndertime = actDuration < schedDuration - 30 * 60000;
  
  const barColor = isOvertime ? 'bg-amber-500' : (isUndertime ? 'bg-indigo-300' : 'bg-indigo-600');

  return (
    <div className="flex flex-col w-full mt-2">
      <div className="relative h-12 w-full bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        {/* Grid lines (hourly) */}
        {Array.from({ length: 12 }).map((_, i) => {
            const t = new Date(minTime.getTime() + i * 60 * 60000);
            if (t > maxTime) return null;
            return (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-200 opacity-50" style={{ left: `${getPos(t)}%` }}></div>
            );
        })}

        {/* Scheduled Bar (Top Half) */}
        <div 
          className="absolute top-2 h-3 bg-gray-300 rounded-sm opacity-60"
          style={{ left: `${getPos(schedStart)}%`, width: `${getWidth(schedStart, schedEnd)}%` }}
          title={`Scheduled: ${schedStart.toLocaleTimeString()} - ${schedEnd.toLocaleTimeString()}`}
        ></div>
        <span className="absolute top-2 text-[9px] text-gray-500 font-medium ml-1" style={{ left: `${getPos(schedEnd)}%` }}>
            Sched
        </span>

        {/* Actual Bar (Bottom Half) */}
        <div 
          className={`absolute top-6 h-4 rounded-md shadow-sm ${barColor}`}
          style={{ left: `${getPos(actStart)}%`, width: `${getWidth(actStart, actEnd)}%` }}
          title={`Actual: ${actStart.toLocaleTimeString()} - ${actEnd.toLocaleTimeString()}`}
        ></div>
        <span className={`absolute top-6 text-[9px] font-bold ml-1 ${isOvertime ? 'text-amber-600' : 'text-indigo-600'}`} style={{ left: `${getPos(actEnd)}%` }}>
            Actual
        </span>
      </div>
    </div>
  );
};

const VarianceBadge: React.FC<{ label: string; type: 'warning' | 'error' | 'success' | 'neutral' }> = ({ label, type }) => {
    const colors = {
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        error: 'bg-red-50 text-red-700 border-red-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        neutral: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${colors[type]}`}>
            {label}
        </span>
    );
};

const LogApprovalCard: React.FC<{ 
    log: WorkerLog; 
    onApprove: (id: string) => void; 
    onReject: (id: string) => void; 
}> = ({ log, onApprove, onReject }) => {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    const handleAiSuggest = async () => {
        setLoadingAI(true);
        const result = await suggestApprovalAction(log);
        setSuggestion(result);
        setLoadingAI(false);
    };

    // Calculate Variances
    const startDiff = log.actualStart ? (log.actualStart.getTime() - log.scheduledStart.getTime()) / 60000 : 0;
    const endDiff = log.actualEnd ? (log.actualEnd.getTime() - log.scheduledEnd.getTime()) / 60000 : 0; // +ve means worked late
    
    // Logic for "Problems"
    const lateStart = startDiff > 10; // 10 mins grace
    const leftEarly = endDiff < -10;
    const overTime = endDiff > 15;
    
    const hasIssues = lateStart || leftEarly || overTime;

    return (
        <div className={`p-4 bg-white border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${hasIssues ? 'bg-amber-50/10' : ''}`}>
            <div className="flex flex-col md:flex-row gap-4">
                
                {/* 1. Worker Info */}
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
                    {/* Variance Badges - stacked on desktop, inline on mobile */}
                    <div className="mt-2 md:flex flex-wrap gap-1 hidden">
                        {lateStart && <VarianceBadge type="warning" label={`Late Start +${Math.round(startDiff)}m`} />}
                        {leftEarly && <VarianceBadge type="warning" label={`Left Early ${Math.round(endDiff)}m`} />}
                        {overTime && <VarianceBadge type="error" label={`Overtime +${Math.round(endDiff)}m`} />}
                        {!hasIssues && <VarianceBadge type="success" label="On Track" />}
                    </div>
                </div>
                
                {/* Variance Badges Mobile Only */}
                <div className="flex flex-wrap gap-1 md:hidden">
                    {lateStart && <VarianceBadge type="warning" label={`Late +${Math.round(startDiff)}m`} />}
                    {leftEarly && <VarianceBadge type="warning" label={`Early ${Math.round(endDiff)}m`} />}
                    {overTime && <VarianceBadge type="error" label={`Over +${Math.round(endDiff)}m`} />}
                    {!hasIssues && <VarianceBadge type="success" label="On Track" />}
                </div>

                {/* 2. Visualization & Times */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between text-xs mb-1 gap-1">
                        <span className="text-gray-400">Schedule vs Actual</span>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                            <span>
                                <span className="text-gray-400 mr-1">Sched:</span> 
                                <span className="font-medium text-gray-700">
                                    {log.scheduledStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.scheduledEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </span>
                            </span>
                            <span>
                                <span className="text-gray-400 mr-1">Act:</span> 
                                <span className={`font-bold ${hasIssues ? 'text-amber-600' : 'text-indigo-600'}`}>
                                    {log.actualStart?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {log.actualEnd?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) || 'Now'}
                                </span>
                            </span>
                        </div>
                    </div>
                    <TimelineComparison log={log} />
                    
                    {log.notes && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                            <span className="font-semibold text-gray-500">Note:</span>
                            <span className="italic">"{log.notes}"</span>
                        </div>
                    )}

                     {/* {suggestion && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                            <div className={`text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${suggestion === 'Approve' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                <Wand2 className="w-3 h-3" />
                                <span>AI Recommendation: <strong>{suggestion}</strong></span>
                            </div>
                        </div>
                    )} */}
                </div>

                {/* 3. Actions */}
                <div className="flex flex-row md:flex-col items-center justify-between gap-2 md:w-24 md:border-l md:border-gray-100 md:pl-4 mt-2 md:mt-0">
                    <button 
                        onClick={() => onApprove(log.id)}
                        className="flex-1 w-full flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 p-3 md:p-2 rounded-lg text-sm md:text-xs font-medium transition-colors"
                    >
                        <Check className="w-4 h-4" /> Approve
                    </button>
                    <button 
                        onClick={() => onReject(log.id)}
                        className="flex-1 w-full flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 p-3 md:p-2 rounded-lg text-sm md:text-xs font-medium transition-colors"
                    >
                        <X className="w-4 h-4" /> Reject
                    </button>
                    {/* <button 
                         onClick={handleAiSuggest}
                         disabled={!!suggestion || loadingAI}
                         className="flex-1 md:flex-none w-full flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-3 md:p-2 rounded-lg text-sm md:text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        {loadingAI ? <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {loadingAI ? '' : <span className="md:hidden">AI</span>}
                        <span className="hidden md:inline">AI Audit</span>
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ logs, onApprove, onReject }) => {
  const pendingLogs = logs.filter(l => l.status === LogStatus.PENDING);
  
  // Group logs by project
  const groupedLogs = useMemo(() => {
    const groups: Record<string, { projectName: string, logs: WorkerLog[] }> = {};
    pendingLogs.forEach(log => {
        if (!groups[log.projectId]) {
            groups[log.projectId] = { projectName: log.projectName, logs: [] };
        }
        groups[log.projectId].logs.push(log);
    });
    return Object.values(groups);
  }, [pendingLogs]);

  if (pendingLogs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mt-8">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">All Caught Up!</h3>
        <p className="text-gray-500 mt-2">No pending time logs to approve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
            <p className="text-gray-500 text-sm">Review worker timesheets against scheduled hours.</p>
          </div>
          <div className="text-right">
              <span className="text-2xl font-bold text-indigo-600">{pendingLogs.length}</span>
              <span className="text-gray-500 text-sm ml-1">items pending</span>
          </div>
      </div>

      {groupedLogs.map((group) => (
        <div key={group.projectName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2 max-w-[80%]">
                    <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <h3 className="font-bold text-gray-800 truncate">{group.projectName}</h3>
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                        {group.logs.length}
                    </span>
                </div>
            </div>
            
            <div className="divide-y divide-gray-100">
                {group.logs.map(log => (
                    <LogApprovalCard 
                        key={log.id} 
                        log={log} 
                        onApprove={onApprove} 
                        onReject={onReject} 
                    />
                ))}
            </div>
        </div>
      ))}
    </div>
  );
};
