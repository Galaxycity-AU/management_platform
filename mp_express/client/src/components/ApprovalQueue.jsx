import React, { useState, useMemo, useEffect } from 'react';
import {
  Check, X, Briefcase, History, Edit2, Save, ArrowRight, Clock,
  TriangleAlert, Filter, RotateCcw, Calendar, ChevronRight, Zap,
  CheckCircle2, SlidersHorizontal, User, Search
} from 'lucide-react';
import { LogStatus } from '../types';

// --- Helper Components ---

const TimelineComparison = ({ log }) => {
  const schedStart = log.schedulesStart;
  const schedEnd = log.schedulesEnd;

  // For history, show the FINAL adjusted time as the main "Actual" bar
  const actStart = log.actualStart || schedStart;
  const actEnd = log.actualEnd || schedEnd;

  // Calculate view range: lock to full 24h of the job day
  const dayStart = new Date(schedStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const minTime = dayStart;
  const maxTime = dayEnd;

  const totalDuration = maxTime.getTime() - minTime.getTime();
  const getPos = (d) => ((d.getTime() - minTime.getTime()) / totalDuration) * 100;
  const getWidth = (s, e) => Math.max(1, getPos(e) - getPos(s));

  const actDuration = actEnd.getTime() - actStart.getTime();
  const schedDuration = schedEnd.getTime() - schedStart.getTime();
  const isOvertime = actDuration > schedDuration + 30 * 60000;

  const actStartDisplay = log.editStartTime ? log.editStartTime : actStart;
  const actEndDisplay = log.editEndTime ? log.editEndTime : actEnd;

  const barColor = isOvertime ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="flex flex-col w-full mt-2">
      <div className="relative h-14 w-full bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        {/* Grid lines - every 2 hours for 24-hour view */}
        {Array.from({ length: 13 }).map((_, i) => {
          const hour = i * 2;
          const t = new Date(minTime);
          t.setHours(hour, 0, 0, 0);
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
        <span className="absolute top-1 text-[9px] text-gray-500 font-medium ml-1" style={{ left: `${getPos(schedEnd)}%` }}></span>

        {/* Actual Bar (Middle/Bottom) */}
        <div
          className={`absolute top-6 h-3.5 rounded-md shadow-sm ${barColor} z-5`}
          style={{ left: `${getPos(actStartDisplay)}%`, width: `${getWidth(actStartDisplay, actEndDisplay)}%` }}
        ></div>

        {/* Edited Time Adjustment (if any) */}
        {
          log.editStartTime && log.editStartTime - actStart > 0 ? (
            <div
              className="absolute top-6 h-3.5 bg-red-400/30 border border-red-300 border-dashed rounded-md z-2"
              style={{ left: `${getPos(actStart)}%`, width: `${getWidth(actStart, log.editStartTime)}%` }}
            >
            </div>
          ) : log.editStartTime && log.editStartTime - actStart < 0 ? (
            <div
              className="absolute top-6 h-3.5 bg-green-400/30 border border-green-300 border-dashed rounded-md z-2"
              style={{ left: `${getPos(log.editStartTime)}%`, width: `${getWidth(log.editStartTime, actStart)}%` }}
            >
            </div>
          ) : null
        }
        {
          log.editEndTime && log.editEndTime - actEnd > 0 ? (
            <div
              className="absolute top-6 h-3.5 bg-green-400/30 border border-green-300 border-dashed rounded-md z-2"
              style={{ left: `${getPos(actEnd)}%`, width: `${getWidth(actEnd, log.editEndTime)}%` }}
            >
            </div>
          ) : log.editEndTime && log.editEndTime - actEnd < 0 ? (
            <div
              className="absolute top-6 h-3.5 bg-red-400/30 border border-red-300 border-dashed rounded-md z-2"
              style={{ left: `${getPos(log.editEndTime)}%`, width: `${getWidth(log.editEndTime, actEnd)}%` }}
            >
            </div>
          ) : null
        }

        <span className={`absolute top-6 text-[9px] font-bold ml-1 ${isOvertime ? 'text-amber-600' : 'text-indigo-600'}`} style={{ left: `${getPos(actEnd)}%` }}>
        </span>
      </div>
      {/* Hour labels */}
      <div className="relative h-5 w-full mb-1">
        {Array.from({ length: 25 }).map((_, i) => {
          if (i % 2 !== 0) return null; // Show every 2 hours
          const t = new Date(minTime);
          t.setHours(i, 0, 0, 0);
          return (
            <div key={i} className="absolute text-[9px] text-gray-400 font-medium" style={{ left: `${getPos(t)}%`, transform: 'translateX(-50%)' }}>
              {i.toString().padStart(2, '0')}:00
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DraggableTimeline = ({ log, editStartTime, editEndTime, onTimeChange }) => {
  const [isDragging, setIsDragging] = useState(null); // 'start', 'end', or 'both'
  const [dragStartX, setDragStartX] = useState(0);
  const [initialTimes, setInitialTimes] = useState({ start: null, end: null });
  const timelineRef = React.useRef(null);

  const schedStart = log.schedulesStart;
  const schedEnd = log.schedulesEnd;

  // Parse current edit times
  const parseEditTime = (timeStr, baseDate) => {
    if (!timeStr || !baseDate) return baseDate;
    const [h, m] = timeStr.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(h, m, 0, 0);
    return result;
  };

  const actStart = parseEditTime(editStartTime, log.actualStart);
  const actEnd = parseEditTime(editEndTime, log.actualEnd);

  // Store original actual times for comparison
  const originalActStart = log.actualStart;
  const originalActEnd = log.actualEnd;

  // Calculate view range: lock to full 24h of the job day
  const dayStart = new Date(schedStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const minTime = dayStart;
  const maxTime = dayEnd;

  const totalDuration = maxTime.getTime() - minTime.getTime();
  const getPos = (d) => ((d.getTime() - minTime.getTime()) / totalDuration) * 100;
  const getWidth = (s, e) => Math.max(1, getPos(e) - getPos(s));

  const actDuration = actEnd.getTime() - actStart.getTime();
  const schedDuration = schedEnd.getTime() - schedStart.getTime();
  const isOvertime = actDuration > schedDuration + 30 * 60000;

  // Calculate overlap regions for visual feedback
  const overlapStart = new Date(Math.max(actStart.getTime(), originalActStart.getTime()));
  const overlapEnd = new Date(Math.min(actEnd.getTime(), originalActEnd.getTime()));
  const hasOverlap = overlapStart < overlapEnd;

  const formatTime = (date) => {
    if (!date) return '';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    setIsDragging(handle);
    setDragStartX(e.clientX);
    setInitialTimes({ start: actStart, end: actEnd });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const percentDelta = (deltaX / rect.width) * 100;
    const timeDelta = (percentDelta / 100) * totalDuration;

    let newStart = new Date(initialTimes.start.getTime());
    let newEnd = new Date(initialTimes.end.getTime());

    if (isDragging === 'start') {
      newStart = new Date(initialTimes.start.getTime() + timeDelta);
      // Round to nearest 15 minutes
      newStart.setMinutes(Math.round(newStart.getMinutes() / 15) * 15, 0, 0);
      // Don't allow start to go past end
      if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 15 * 60000);
    } else if (isDragging === 'end') {
      newEnd = new Date(initialTimes.end.getTime() + timeDelta);
      newEnd.setMinutes(Math.round(newEnd.getMinutes() / 15) * 15, 0, 0);
      // Don't allow end to go before start
      if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 15 * 60000);
    } else if (isDragging === 'both') {
      newStart = new Date(initialTimes.start.getTime() + timeDelta);
      newEnd = new Date(initialTimes.end.getTime() + timeDelta);
      newStart.setMinutes(Math.round(newStart.getMinutes() / 15) * 15, 0, 0);
      newEnd.setMinutes(Math.round(newEnd.getMinutes() / 15) * 15, 0, 0);
    }

    onTimeChange(formatTime(newStart), formatTime(newEnd));
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartX, initialTimes]);

  return (
    <div className="flex flex-col w-full mt-3">
      <div className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-2 justify-between">
        <span className="font-medium">💡 Drag the timeline handles or bars to adjust times</span>
      </div>
      <div
        ref={timelineRef}
        className={`relative h-16 w-full bg-gray-50 rounded-lg border-2 border-gray-200 overflow-visible ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        {/* Grid lines */}
        {Array.from({ length: 25 }).map((_, i) => {
          const t = new Date(minTime.getTime() + i * 60 * 60000);
          if (t > maxTime) return null;
          const label = `${String(t.getHours()).padStart(2, '0')}:00`;
          return (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-300 opacity-40" style={{ left: `${getPos(t)}%` }}>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 whitespace-nowrap">
                {label}
              </span>
            </div>
          );
        })}

        {/* Scheduled Bar (Top) */}
        <div
          className="absolute top-2 h-3 bg-gray-400 rounded-sm opacity-50"
          style={{ left: `${getPos(schedStart)}%`, width: `${getWidth(schedStart, schedEnd)}%` }}
        ></div>

        {/* Original Actual Time - Shadow/Ghost Bar */}
        <div
          className="absolute top-7 h-5 bg-gray-400 rounded-md opacity-30"
          style={{ left: `${getPos(originalActStart)}%`, width: `${getWidth(originalActStart, originalActEnd)}%` }}
        ></div>

        {/* Adjusted Bar - with color coding */}
        <div
          className="absolute top-7 h-5 rounded-md shadow-md select-none"
          style={{ left: `${getPos(actStart)}%`, width: `${getWidth(actStart, actEnd)}%` }}
        >
          {/* Blue overlap section (within original time) */}
          {hasOverlap && (
            <div
              className="absolute h-full bg-indigo-600 rounded-md"
              style={{
                left: `${((overlapStart.getTime() - actStart.getTime()) / (actEnd.getTime() - actStart.getTime())) * 100}%`,
                width: `${((overlapEnd.getTime() - overlapStart.getTime()) / (actEnd.getTime() - actStart.getTime())) * 100}%`
              }}
            ></div>
          )}

          {/* Green extension on the left (adjusted start is earlier) */}
          {actStart < originalActStart && (
            <div
              className="absolute h-full bg-green-500 rounded-l-md"
              style={{
                left: '0%',
                width: `${((Math.min(originalActStart.getTime(), actEnd.getTime()) - actStart.getTime()) / (actEnd.getTime() - actStart.getTime())) * 100}%`
              }}
            ></div>
          )}

          {/* Green extension on the right (adjusted end is later) */}
          {actEnd > originalActEnd && (
            <div
              className="absolute h-full bg-green-500 rounded-r-md"
              style={{
                left: `${((Math.max(originalActEnd.getTime(), actStart.getTime()) - actStart.getTime()) / (actEnd.getTime() - actStart.getTime())) * 100}%`,
                width: `${((actEnd.getTime() - Math.max(originalActEnd.getTime(), actStart.getTime())) / (actEnd.getTime() - actStart.getTime())) * 100}%`
              }}
            ></div>
          )}

          {/* Draggable overlay for interaction */}
          <div
            className={`absolute inset-0 rounded-md ${!isDragging ? 'cursor-move hover:ring-2 hover:ring-indigo-400' : 'cursor-grabbing'}`}
            onMouseDown={(e) => handleMouseDown(e, 'both')}
          >
            {/* Start Handle */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-white border-2 border-indigo-600 rounded-md cursor-ew-resize hover:bg-indigo-50 shadow-md z-10 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'start');
              }}
            >
              <div className="w-0.5 h-4 bg-indigo-600 rounded"></div>
            </div>

            {/* End Handle */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-8 bg-white border-2 border-indigo-600 rounded-md cursor-ew-resize hover:bg-indigo-50 shadow-md z-10 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'end');
              }}
            >
              <div className="w-0.5 h-4 bg-indigo-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LogApprovalCard = ({ log, onApprove, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Edit State
  const [startTime, setStartTime] = useState(log.actualStart ? log.actualStart.toTimeString().slice(0, 5) : "00:00");
  const [endTime, setEndTime] = useState(log.actualEnd ? log.actualEnd.toTimeString().slice(0, 5) : "00:00");
  const [reason, setReason] = useState("");

  // Variance Calc
  const sDur = log.schedulesEnd.getTime() - log.schedulesStart.getTime();
  const aDur = (log.actualEnd?.getTime() || 0) - (log.actualStart?.getTime() || 0);
  const diffMins = Math.round((aDur - sDur) / 60000);
  const hasDurationVariance = Math.abs(diffMins) > 15; // 15 min buffer

  // Timing Check
  const startDiff = Math.abs((log.actualStart?.getTime() || 0) - log.schedulesStart.getTime()) / 60000;
  const endDiff = Math.abs((log.actualEnd?.getTime() || 0) - log.schedulesEnd.getTime()) / 60000;
  const hasTimingIssue = startDiff > 10 || endDiff > 15;
  
  const hasIssues = hasDurationVariance || hasTimingIssue;

  const formatTime = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

  const handleSave = () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const newStart = new Date(log.actualStart || new Date());
    newStart.setHours(sh, sm);
    const newEnd = new Date(log.actualEnd || new Date());
    newEnd.setHours(eh, em);

    onApprove(log.id, newStart, newEnd, reason || "Manual Adjustment");
    setIsExpanded(false);
  };

  return (
    <div className={`transition-all duration-300 border-b border-gray-100 ${isExpanded ? 'bg-white shadow-lg z-10 my-4 rounded-xl border-transparent ring-1 ring-indigo-100' : 'bg-white hover:bg-gray-50'}`}>

      {/* COLLAPSED ROW VIEW */}
      {!isExpanded && (
        <div className="flex items-center p-4 gap-4">
          {/* 1. Worker Identity */}
          <div className="w-48 flex items-center gap-3 flex-shrink-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${hasIssues ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
              {log.workerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{log.workerName}</p>
              <p className="text-xs text-gray-500 truncate">{log.role}</p>
            </div>
          </div>

          {/* 2. Quick Timeline Visualization */}
          <div className="flex-1 min-w-[150px] flex flex-col justify-center gap-1">
            <TimelineComparison log={log} />
          </div>

          {/* 3. Variance Stats */}
          <div className="w-40 flex-shrink-0 text-center">
            <div className="text-sm font-mono font-medium text-gray-700">
              {formatTime(log.schedulesStart)} - {formatTime(log.schedulesEnd)}
            </div>
            <div className="text-sm font-mono font-medium text-gray-700">
              {log.actualStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.actualEnd?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {hasIssues ? (
               <div className="flex flex-col items-center">
                 {hasDurationVariance && (
                    <span className={`block text-xs font-bold ${diffMins > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                        {diffMins > 0 ? `+${diffMins}m Over` : `${diffMins}m Under`}
                    </span>
                 )}
                 {!hasDurationVariance && hasTimingIssue && (
                    <span className="block text-xs font-bold text-amber-600 flex items-center gap-1">
                        <TriangleAlert className="w-3 h-3" /> Schedule Var
                    </span>
                 )}
               </div>
            ) : (
              <span className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> On Time
              </span>
            )}
          </div>

          {/* 4. Quick Actions */}
          <div className="w-30 flex items-center justify-end gap-2 pl-4 border-l border-gray-100">
            <button
              onClick={() => onApprove(log.id)}
              className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              title="Quick Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Adjust / Edit"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EXPANDED WORKBENCH VIEW */}
      {isExpanded && (
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Adjust Time Entry</h3>
                <p className="text-sm text-gray-500">Modify start/end times for <span className="font-semibold text-gray-700">{log.workerName}</span>.</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 w-full">
            {/* Timeline */}
            <DraggableTimeline
              log={log}
              editStartTime={startTime}
              editEndTime={endTime}
              onTimeChange={(s, e) => { setStartTime(s); setEndTime(e); }}
            />

            {/* Start & End Time Inputs */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Adjustment Details - Full Width */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 w-full">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Adjustment Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => {
                    setStartTime(log.schedulesStart.toTimeString().slice(0, 5));
                    setEndTime(log.schedulesEnd.toTimeString().slice(0, 5));
                    setReason("Reverted to Schedule");
                  }}
                  className="text-left px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <History className="w-3 h-3" /> Match Schedule
                </button>
                <button
                  onClick={() => {
                    setStartTime(log.actualStart?.toTimeString().slice(0, 5) || "");
                    setEndTime(log.actualEnd?.toTimeString().slice(0, 5) || "");
                    setReason("");
                  }}
                  className="text-left px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Original
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                  placeholder="e.g. Forgot to clock out..."
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => onReject(log.id, reason)}
                  className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
                >
                  Save & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryLogCard = ({ log }) => {
  // Check if adjusted
  const isAdjusted = log.editEndTime && log.actualEnd && log.editEndTime.getTime() !== log.actualEnd.getTime();

  // Format date
  const jobDate = log.actualStart || log.schedulesStart;
  const formattedDate = jobDate ? jobDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  return (
    <div className="p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-48 flex-shrink-0">
          <p className="font-semibold text-gray-900 text-sm">{log.workerName}</p>
          <p className="text-xs text-gray-500">{log.role}</p>

          <div className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {log.status}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Job Date - Top Right */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 font-medium">
                <span className="text-gray-500 text-xs">
                    Sched: {log.schedulesStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.schedulesEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              {(isAdjusted || log.editReason) ? (
                <div className="bg-yellow-50 p-2 rounded border border-yellow-100 flex items-start gap-3">
                  <div className="mt-0.5">
                    <Edit2 className="w-3 h-3 text-yellow-600" />
                  </div>

                  <div className="text-xs text-yellow-800">
                    {isAdjusted && (
                      <div className="flex items-center gap-2 mb-1 font-medium">
                        <span className="text-gray-500 line-through decoration-red-400">
                          {log.actualStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                          {log.actualEnd?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <ArrowRight className="w-3 h-3" />

                        <span>
                          {log.editStartTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                          {log.editEndTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {log.editReason && (
                      <p className="text-[11px]">
                        Notes: “{log.editReason}”
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  Actual:{" "}
                  <span className="font-medium">
                    {log.actualStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                    {log.actualEnd?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-4">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <TimelineComparison log={log} />

          <div className="mt-2 flex justify-between items-end">
            <p className="text-[10px] text-gray-400">
              {log.approvedAt
                ? `${log.status} at ${log.approvedAt.toLocaleDateString()} ${log.approvedAt.toLocaleTimeString()}`
                : ""}
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
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const pendingLogs = useMemo(() => logs.filter(l => l.status === LogStatus.WAITING_APPROVAL), [logs]);
  const historyLogs = useMemo(() => logs.filter(l => l.status === LogStatus.APPROVED || l.status === LogStatus.REJECTED).sort((a, b) => (b.actualEnd?.getTime() || 0) - (a.actualEnd?.getTime() || 0)), [logs]);

  console.log('History Logs:', historyLogs);

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

      const startDiff = Math.abs((log.actualStart?.getTime() || 0) - log.schedulesStart.getTime()) / 60000;
      const endDiff = Math.abs((log.actualEnd?.getTime() || 0) - log.schedulesEnd.getTime()) / 60000;
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

  // Filtered History
  const filteredHistoryLogs = useMemo(() => {
    return historyLogs.filter(log => {
        const matchesProject = historyProjectFilter === 'all' || log.projectId === historyProjectFilter;
        const matchesStatus = historyStatusFilter === 'ALL' || 
                              (historyStatusFilter === 'APPROVED' && log.status === LogStatus.APPROVED) ||
                              (historyStatusFilter === 'REJECTED' && log.status === LogStatus.REJECTED);
        const matchesSearch = log.workerName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                              log.role.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                              log.projectName.toLowerCase().includes(historySearchTerm.toLowerCase());
        
        return matchesProject && matchesStatus && matchesSearch;
    });
  }, [historyLogs, historyProjectFilter, historyStatusFilter, historySearchTerm]);

  // Stats for history view
  const historyStats = useMemo(() => {
      const total = filteredHistoryLogs.length;
      const approved = filteredHistoryLogs.filter(l => l.status === LogStatus.APPROVED).length;
      const rejected = filteredHistoryLogs.filter(l => l.status === LogStatus.REJECTED).length;
      return { total, approved, rejected };
  }, [filteredHistoryLogs]);

  const selectedProject = pendingProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex h-full w-[100%] bg-gray-50 overflow-hidden rounded-lg shadow-lg border border-gray-200">
      {/* SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'PENDING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pending ({pendingLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              History
            </button>
          </div>
        </div>
        <div className='flex-1 overflow-y-auto p-3 space-y-1'>
          {
            activeTab === 'PENDING' && (
              pendingLogs.length === 0 ? (
                <div className="text-center p-8 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                pendingProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-all ${selectedProjectId === project.id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${selectedProjectId === project.id ? 'text-indigo-900' : 'text-gray-700'}`}>{project.name}</p>
                      <p className="text-xs text-gray-400">Project ID: {project.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.hasIssues && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedProjectId === project.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                        {project.count}
                      </span>
                    </div>
                  </button>
                ))
              )
            )}
          {/* History placeholder */}
          {
            activeTab === 'HISTORY' && (
              historyLogs.length === 0 ? (
                <div className="text-center p-8 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                historyProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setHistoryProjectFilter(project.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-all ${historyProjectFilter === project.id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${selectedProjectId === project.id ? 'text-indigo-900' : 'text-gray-700'}`}>{project.name}</p>
                      <p className="text-xs text-gray-400">Project ID: {project.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.hasIssues && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                    </div>
                  </button>
                ))
              )
            )
          }
        </div>
      </div>
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedProjectId && selectedProject && activeTab === 'PENDING' ? (
          <>
            {/* Sticky Header */}
            <div className="px-8 py-5 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-20 shadow-sm">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedProject.name}
                  {selectedProject.hasIssues && <TriangleAlert className="w-5 h-5 text-amber-500" />}
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {pendingLogs.length} entries awaiting review
                </p>
              </div>

              {/* Smart Actions
              {cleanLogs.length > 0 && (
                <button
                  onClick={handleBatchApprove}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                >
                  <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  Auto-Approve {cleanLogs.length} Clean Entries
                </button>
              )} */}
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-gray-100">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.max(5, (selectedProject ? ((selectedProject.count - selectedProjectLogs.length) / Math.max(selectedProject.count, 1)) * 100 : 5))}%` }}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <div className="w-48 text-center">Worker</div>
                  <div className="flex-1 text-center">Timeline Comparison</div>
                  {/* <div className="flex-2 text-center">Actuals</div> */}
                  <div className="w-50 text-center pl-4">Actions</div>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  {selectedProjectLogs.map(log => (
                    <LogApprovalCard key={log.id} log={log} onApprove={onApprove} onReject={onReject} />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {activeTab === 'HISTORY' && (
              <div className="space-y-4 p-4">
                {/* Advanced Filter Bar */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Search */}
                    <div className="md:col-span-5 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search worker, role or project..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Project Filter */}
                    <div className="md:col-span-3">
                      <select
                        value={historyProjectFilter}
                        onChange={(e) => setHistoryProjectFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="all">All Projects</option>
                        {historyProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Toggle */}
                    <div className="md:col-span-4 flex bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setHistoryStatusFilter('ALL')}
                        className={`flex-1 text-xs font-medium rounded py-1.5 transition-all ${historyStatusFilter === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('APPROVED')}
                        className={`flex-1 text-xs font-medium rounded py-1.5 transition-all ${historyStatusFilter === 'APPROVED' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Approved
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('REJECTED')}
                        className={`flex-1 text-xs font-medium rounded py-1.5 transition-all ${historyStatusFilter === 'REJECTED' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>
                </div>

                {/* History Logs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-400" /> Recent Decisions
                    </h3>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <Check className="w-3 h-3" /> {historyStats.approved} Approved
                      </span>
                      <span className="flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        <X className="w-3 h-3" /> {historyStats.rejected} Rejected
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {filteredHistoryLogs.length > 0 ? (
                      filteredHistoryLogs.map(log => (
                        <HistoryLogCard key={log.id} log={log} />
                      ))
                    ) : (
                      <div className="p-12 text-center text-gray-400">
                        <Filter className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>No records found matching your filters.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}