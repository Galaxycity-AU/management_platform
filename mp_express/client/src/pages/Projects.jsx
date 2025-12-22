import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectTable } from '../components/ProjectTable';
import { fetchProjects, fetchJobs, fetchWorkers } from '../utils/apiUtils';
import { LogStatus } from '../types';

function ProjectsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [projectsData, jobsData, workersData] = await Promise.all([
                    fetchProjects(),
                    fetchJobs(),
                    fetchWorkers()
                ]);

                // Transform projects
                const toSafeDate = (d) => {
                    if (d == null) return null;
                    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
                    const parsed = new Date(d);
                    return isNaN(parsed.getTime()) ? null : parsed;
                };

                const projectData = projectsData.map((p) => ({
                    ...p,
                    deadline: toSafeDate(p.deadline),
                    spent: p.spent || 0,
                    budget: p.budget || 0,
                    progress: p.progress || 0,
                }));

                setProjects(projectData);

                // Transform jobs to logs
                const workersMap = new Map(workersData.map((w) => [w.id, w]));
                const projectsMap = new Map(projectData.map((p) => [Number(p.id), p]));
                const projectsManagerMap = new Map(projectData.map((p) => [Number(p.manager_id), p]));

                const logsData = jobsData
                    .filter((job) => {
                        const startTime = job.actual_start || job.modified_start || job.schedules_start;
                        const endTime = job.actual_end || job.modified_end || job.schedules_end;
                        return startTime && endTime;
                    })
                    .map((job) => {
                        const worker = workersMap.get(job.worker_id);
                        const project = projectsMap.get(job.project_id);
                        const projectManager = projectsManagerMap.get(project.manager_id);
                        const scheduledStart = new Date(job.schedules_start);
                        const scheduledEnd = new Date(job.schedules_end);
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
                            projectManager: projectManager?.name || 'Unknown Manager',
                            scheduledStart,
                            scheduledEnd,
                            actualStart,
                            actualEnd,
                            originalActualStart: actualStart,
                            originalActualEnd: actualEnd,
                            status: logStatus,
                            notes: `Job #${job.id}`,
                            adjustmentReason: job.modified_start ? 'Job rescheduled' : undefined,
                            approvedAt: actualEnd || undefined,
                            approvedBy: actualEnd ? 'System' : undefined
                        };
                    });

                setLogs(logsData);
            } catch (err) {
                console.error('Error loading projects data:', err);
                setError('Failed to load projects data');
                setProjects([]);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSelectProject = (project) => {
        navigate(`/projects/${project.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-gray-600">Loading projects...</div>
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
        <div className="max-w-full">
            <ProjectTable 
                projects={projects} 
                onSelectProject={handleSelectProject} 
            />
        </div>
    );
}

export default ProjectsPage;
