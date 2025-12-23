import React, { useState, useEffect, useCallback } from 'react';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { fetchJobs, fetchWorkers, fetchProjects, fetchApprovals } from '../utils/apiUtils';
import { LogStatus } from '../types';
import { useApprovalSocket } from '../hooks/useSocket';

function ApprovalsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Transform jobs data to logs format
    const transformJobsToLogs = useCallback((jobsData, workersData, projectsData, approvalsData) => {
        const workersMap = new Map(workersData.map((w) => [w.id, w]));
        const projectsMap = new Map(projectsData.map((p) => [Number(p.id), p]));
        const approvalsMap = new Map(approvalsData.map((a) => [a.job_id, a]));

        return jobsData
            .filter((job) => {
                const startTime = job.actual_start || job.modified_start || job.schedule_start;
                const endTime = job.actual_end || job.modified_end || job.schedule_end;
                return startTime && endTime;
            })
            .map((job) => {
                const worker = workersMap.get(job.worker_id);
                const project = projectsMap.get(job.project_id);

                const scheduleStart = new Date(job.schedule_start);
                const scheduleEnd = new Date(job.schedule_end);
                const actualStart = job.actual_start ? new Date(job.actual_start) : null;
                const actualEnd = job.actual_end ? new Date(job.actual_end) : null;

                const logStatus = job.status === 'schedule' ? LogStatus.SCHEDULE :
                    job.status === 'active' ? LogStatus.ACTIVE :
                        job.status === 'approved' ? LogStatus.APPROVED :
                            job.status === 'rejected' ? LogStatus.REJECTED :
                                job.status === 'waiting_approval' ? LogStatus.WAITING_APPROVAL :
                                    LogStatus.SCHEDULE;

                return {
                    id: String(job.id),
                    approvalId: approvalsMap.get(job.id)?.id || null,
                    workerName: worker?.name || 'Unknown Worker',
                    role: worker?.position || 'Worker',
                    projectId: String(job.project_id),
                    projectName: project?.name || 'Unknown Project',
                    scheduleStart,
                    scheduleEnd,
                    actualStart,
                    actualEnd,
                    editStartTime: job.modified_start ? new Date(job.modified_start) : null,
                    editEndTime: job.modified_end ? new Date(job.modified_end) : null,
                    editReason: approvalsMap.get(job.id)?.comments || null,
                    status: logStatus,
                    notes: `Job #${job.id}`,
                    approvedAt: actualEnd || undefined,
                    approvedBy: actualEnd ? 'System' : undefined,
                    // Include flag fields from database
                    is_flag: job.is_flag || false,
                    flag_reason: job.flag_reason || null
                };
            });
    }, []);

    // Load data function
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [jobsData, workersData, projectsData, approvalsData] = await Promise.all([
                fetchJobs(),
                fetchWorkers(),
                fetchProjects(),
                fetchApprovals()
            ]);

            const logsData = transformJobsToLogs(jobsData, workersData, projectsData, approvalsData);
            setLogs(logsData);
        } catch (err) {
            console.error('Error loading approvals data:', err);
            setError('Failed to load approvals data');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [transformJobsToLogs]);

    // Socket event handlers
    const handleApprovalUpdate = useCallback((data) => {
        console.log('[Approvals] Received real-time approval update:', data);
        // Update the specific log in state
        if (data.jobId && data.status) {
            setLogs(prev => prev.map(log => {
                if (log.id === String(data.jobId)) {
                    const newStatus = data.status === 'approved' ? LogStatus.APPROVED :
                        data.status === 'rejected' ? LogStatus.REJECTED : log.status;
                    return {
                        ...log,
                        status: newStatus,
                        approvedAt: new Date(),
                        editReason: data.approval?.comments || log.editReason
                    };
                }
                return log;
            }));
        }
    }, []);

    const handleJobUpdate = useCallback((data) => {
        console.log('[Approvals] Received real-time job update:', data);
        // Reload data to get the latest job information
        loadData();
    }, [loadData]);

    // Set up socket listeners for real-time updates
    const { isConnected } = useApprovalSocket({
        onApprovalUpdate: handleApprovalUpdate,
        onJobUpdate: handleJobUpdate,
    });

    // Initial data load
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApproveLog = async (id, adjustedStart, adjustedEnd, reason) => {
        // Find the log to get approval ID
        const log = logs.find(l => l.id === id);
        
        // Optimistically update UI
        setLogs(prev => prev.map(l => {
            if (l.id === id) {
                return {
                    ...l,
                    status: LogStatus.APPROVED,
                    editStartTime: adjustedStart || l.actualStart,
                    editEndTime: adjustedEnd || l.actualEnd,
                    editReason: reason,
                    approvedAt: new Date(),
                    approvedBy: 'Current User'
                };
            }
            return l;
        }));

        // Call API to update approval status
        try {
            if (log?.approvalId) {
                const response = await fetch(`/api/approvals/${log.approvalId}/approve`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        approver_id: 1, // TODO: Get actual user ID
                        comments: reason,
                        modified_start: adjustedStart?.toISOString() || null,
                        modified_end: adjustedEnd?.toISOString() || null,
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to approve');
                }
                console.log('[Approvals] Approved log:', id);
            } else {
                // If no approval record exists, update job directly
                const response = await fetch(`/api/jobs/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'approved',
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update job status');
                }
            }
        } catch (err) {
            console.error('Error approving log:', err);
            // Revert optimistic update on error
            loadData();
        }
    };

    const handleRejectLog = async (id, rejectReason) => {
        // Find the log to get approval ID
        const log = logs.find(l => l.id === id);
        
        // Optimistically update UI
        setLogs(prev => prev.map(l => {
            if (l.id === id) {
                return {
                    ...l,
                    status: LogStatus.REJECTED,
                    approvedAt: new Date(),
                    editReason: rejectReason
                };
            }
            return l;
        }));

        // Call API to update approval status
        try {
            if (log?.approvalId) {
                const response = await fetch(`/api/approvals/${log.approvalId}/reject`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        approver_id: 1, // TODO: Get actual user ID
                        comments: rejectReason,
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to reject');
                }
                console.log('[Approvals] Rejected log:', id);
            } else {
                // If no approval record exists, update job directly
                const response = await fetch(`/api/jobs/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'rejected',
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update job status');
                }
            }
        } catch (err) {
            console.error('Error rejecting log:', err);
            // Revert optimistic update on error
            loadData();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-gray-600">Loading approvals...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-[95vw] max-w-[90%]">
            {/* Connection status indicator */}
            {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm mb-4">
                    Real-time updates disconnected. Data may not be current.
                </div>
            )}
            <ApprovalQueue 
                logs={logs} 
                onApprove={handleApproveLog} 
                onReject={handleRejectLog} 
            />
        </div>
    );
}

export default ApprovalsPage;
