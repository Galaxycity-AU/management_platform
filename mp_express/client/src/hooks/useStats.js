import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProjects, fetchJobs } from '../utils/apiUtils';
import { ProjectStatus, LogStatus } from '../types';
import { useSocketContext } from '../context/SocketContext';

export const useStats = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    delayedProjects: 0,
    pendingApprovals: 0,
    simproProjects: 0,
  });

  const { subscribe, isConnected } = useSocketContext();
  const hasConnectedOnce = useRef(false);
  
  // Track if we've ever connected
  useEffect(() => {
    if (isConnected) {
      hasConnectedOnce.current = true;
    }
  }, [isConnected]);

  const loadStats = useCallback(async () => {
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
  }, []);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Subscribe to socket events for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to stats update events
    const unsubscribeStats = subscribe('stats:updated', (data) => {
      console.log('[useStats] Received real-time stats update:', data);
      loadStats();
    });

    // Subscribe to job events that affect stats
    const unsubscribeJobCreated = subscribe('job:created', () => {
      console.log('[useStats] Job created, refreshing stats');
      loadStats();
    });

    const unsubscribeJobUpdated = subscribe('job:updated', () => {
      console.log('[useStats] Job updated, refreshing stats');
      loadStats();
    });

    const unsubscribeJobDeleted = subscribe('job:deleted', () => {
      console.log('[useStats] Job deleted, refreshing stats');
      loadStats();
    });

    // Subscribe to approval events
    const unsubscribeApproval = subscribe('approval:updated', () => {
      console.log('[useStats] Approval updated, refreshing stats');
      loadStats();
    });

    return () => {
      unsubscribeStats();
      unsubscribeJobCreated();
      unsubscribeJobUpdated();
      unsubscribeJobDeleted();
      unsubscribeApproval();
    };
  }, [isConnected, subscribe, loadStats]);

  // Fallback polling only if socket disconnects after being connected
  useEffect(() => {
    if (isConnected) return; // No polling needed when socket is connected

    // Only log if we were previously connected (not on initial mount)
    if (hasConnectedOnce.current) {
      console.log('[useStats] Socket disconnected, falling back to polling');
    }
    
    const interval = setInterval(loadStats, 60000); // Poll every 60 seconds as fallback
    return () => clearInterval(interval);
  }, [isConnected, loadStats]);

  return stats;
};
