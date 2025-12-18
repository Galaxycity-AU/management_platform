import React, { useState, useEffect } from 'react';
import { DashboardStatsView } from '../components/DashboardStats';
import CentraliseView from '../components/CentraliseView';
import { ProjectStatus, LogStatus } from '../types';
import { fetchProjects, fetchJobs, fetchWorkers } from '../utils/apiUtils';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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

        const logsData = jobsData
          .filter((job) => {
            const startTime = job.actual_start || job.modified_start || job.schedules_start;
            const endTime = job.actual_end || job.modified_end || job.schedules_end;
            return startTime && endTime;
          })
          .map((job) => {
            const worker = workersMap.get(job.worker_id);
            const project = projectsMap.get(job.project_id);

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
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setProjects([]);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Stats Calculation
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    delayedProjects: projects.filter(p => p.status === ProjectStatus.DELAYED).length,
    pendingApprovals: logs.filter(l => l.status === LogStatus.WAITING_APPROVAL).length,
  };

  const projectStatusData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Completed', value: projects.filter(p => p.status === ProjectStatus.COMPLETED).length },
    { name: 'Delayed', value: stats.delayedProjects },
    { name: 'Planning', value: projects.filter(p => p.status === ProjectStatus.PLANNING).length },
  ];

  const projectAlerts = projects.map(p => ({
    ...p,
    alerts: p.id % 2 === 0 ? true : false,
    lateCase: p.id % 2 === 0 ? p.id + p.id : 0,
    overTime: p.id % 3 === 0 ? p.id * 2 : 0,
    overBudget: p.id == 8 ? p.id * 3 : 0,
  })).filter(p => p.alerts);

  const handleSelectProject = (project) => {
    // Navigation will be handled by the component that calls this
    console.log('Selected project:', project);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats Section */}
      <DashboardStatsView 
        stats={stats} 
        projectStatusData={projectStatusData} 
        projectAlerts={projectAlerts} 
        onSelectProject={handleSelectProject}
      />
      
      {/* CentraliseView Section */}
      <div className="mt-8">
        <CentraliseView />
      </div>
    </div>
  );
}

export default DashboardPage;
