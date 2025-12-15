import { useState, useEffect } from 'react';
import { fetchProjects, fetchJobs } from '../utils/apiUtils';
import { ProjectStatus, LogStatus } from '../types';

export const useStats = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    delayedProjects: 0,
    pendingApprovals: 0,
    simproProjects: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [projectsData, jobsData] = await Promise.all([
          fetchProjects().catch(() => []),
          fetchJobs().catch(() => [])
        ]);

        const projects = projectsData || [];
        const jobs = jobsData || [];

        const logs = jobs
          .filter((job) => {
            const startTime = job.actual_start || job.modified_start || job.scheduled_start;
            const endTime = job.actual_end || job.modified_end || job.scheduled_end;
            return startTime && endTime;
          })
          .map((job) => {
            const logStatus = job.status === 'schedule' ? LogStatus.SCHEDULE :
              job.status === 'active' ? LogStatus.ACTIVE :
                job.status === 'approved' ? LogStatus.APPROVED :
                  job.status === 'rejected' ? LogStatus.REJECTED :
                    job.status === 'waiting_approval' ? LogStatus.WAITING_APPROVAL :
                      LogStatus.SCHEDULE;
            return { status: logStatus };
          });

        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
          delayedProjects: projects.filter(p => p.status === ProjectStatus.DELAYED).length,
          pendingApprovals: logs.filter(l => l.status === LogStatus.WAITING_APPROVAL).length,
          simproProjects: 0, // Will be updated when SimPRO data loads
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
};
