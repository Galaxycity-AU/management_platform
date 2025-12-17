import React, { useState, useEffect } from 'react';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { fetchJobs, fetchWorkers, fetchProjects, fetchApprovals } from '../utils/apiUtils';
import { LogStatus } from '../types';

function ApprovalsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [jobsData, workersData, projectsData, approvalsData] = await Promise.all([
                    fetchJobs(),
                    fetchWorkers(),
                    fetchProjects(),
                    fetchApprovals()
                ]);

                // Transform jobs to logs
                const workersMap = new Map(workersData.map((w) => [w.id, w]));
                const projectsMap = new Map(projectsData.map((p) => [Number(p.id), p]));
                const approvalsMap = new Map(approvalsData.map((a) => [a.job_id, a]));

                const logsData = jobsData
                    .filter((job) => {
                        const startTime = job.actual_start || job.modified_start || job.scheduled_start;
                        const endTime = job.actual_end || job.modified_end || job.scheduled_end;
                        return startTime && endTime;
                    })
                    .map((job) => {
                        const worker = workersMap.get(job.worker_id);
                        const project = projectsMap.get(job.project_id);

                        const scheduledStart = new Date(job.scheduled_start);
                        const scheduledEnd = new Date(job.scheduled_end);
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
                            workerName: worker?.name || 'Unknown Worker',
                            role: worker?.position || 'Worker',
                            projectId: String(job.project_id),
                            projectName: project?.name || 'Unknown Project',
                            scheduledStart,
                            scheduledEnd,
                            actualStart,
                            actualEnd,
                            editStartTime: job.modified_start ? new Date(job.modified_start) : null,
                            editEndTime: job.modified_end ? new Date(job.modified_end) : null,
                            editReason: approvalsMap.get(job.id)?.comments || null,
                            status: logStatus,
                            notes: `Job #${job.id}`,
                            approvedAt: actualEnd || undefined,
                            approvedBy: actualEnd ? 'System' : undefined
                        };
                    });

                setLogs(logsData);
            } catch (err) {
                console.error('Error loading approvals data:', err);
                setError('Failed to load approvals data');
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleApproveLog = (id, adjustedStart, adjustedEnd, reason) => {
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
        // TODO: Call API to update job status in backend
        console.log('Approve log:', id, { adjustedStart, adjustedEnd, reason });
    };

    const handleRejectLog = (id, rejectReason) => {
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
        // TODO: Call API to update job status in backend
        console.log('Reject log:', id);
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
        <div className="max-w-5xl mx-auto">
            <ApprovalQueue 
                logs={logs} 
                onApprove={handleApproveLog} 
                onReject={handleRejectLog} 
            />
        </div>
    );
}

export default ApprovalsPage;
