import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStatsView } from '../components/DashboardStats';
import CentraliseView from '../components/CentraliseView';
import { ProjectStatus, LogStatus } from '../types';
import { loadProjectsAndLogs } from '../utils/dataLoader';
import { useDashboardSocket } from '../hooks/useSocket';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagMap, setFlagMap] = useState({});

  // Function to fetch dashboard alerts
  const fetchDashboardAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/jobs/dashboard/alerts');
      if (response.ok) {
        const alertsData = await response.json();
        // Convert alerts array to a map keyed by project ID
        // Handle both string and number IDs for matching
        const flagMapObj = {};
        if (alertsData.alerts && Array.isArray(alertsData.alerts)) {
          alertsData.alerts.forEach(alert => {
            // Use both string and number keys to handle ID type mismatches
            const id = alert.id;
            flagMapObj[id] = alert;
            flagMapObj[String(id)] = alert;
            flagMapObj[Number(id)] = alert;
          });
        }
        console.log('[Dashboard] Flag map loaded:', Object.keys(flagMapObj).length, 'projects');
        setFlagMap(flagMapObj);
      } else {
        console.error('Failed to fetch dashboard alerts:', response.statusText);
        setFlagMap({});
      }
    } catch (alertError) {
      console.error('Error fetching dashboard alerts:', alertError);
      setFlagMap({});
    }
  }, []);

  // Function to load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { projects: projectData, logs: logsData } = await loadProjectsAndLogs();

      setProjects(projectData);
      setLogs(logsData);

      // Fetch dashboard alerts
      await fetchDashboardAlerts();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setProjects([]);
      setLogs([]);
      setFlagMap({});
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardAlerts]);

  // Socket event handlers
  const handleAlertsUpdate = useCallback((data) => {
    console.log('[Dashboard] Received real-time alerts update:', data);
    if (data.alerts && Array.isArray(data.alerts)) {
      const flagMapObj = {};
      data.alerts.forEach(alert => {
        const id = alert.id;
        flagMapObj[id] = alert;
        flagMapObj[String(id)] = alert;
        flagMapObj[Number(id)] = alert;
      });
      setFlagMap(flagMapObj);
    }
  }, []);

  const handleStatsUpdate = useCallback((data) => {
    console.log('[Dashboard] Received real-time stats update:', data);
    // Refresh data when stats update is received
    loadData();
  }, [loadData]);

  // Set up socket listeners for real-time updates
  const { isConnected } = useDashboardSocket({
    onAlertsUpdate: handleAlertsUpdate,
    onStatsUpdate: handleStatsUpdate,
  });

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const projectAlerts = React.useMemo(() => {
    console.log('[Dashboard] Calculating project alerts with flagged jobs...');
    console.log(`[Dashboard] Processing ${projects.length} projects`);

    // Build project alerts with flags
    const alerts = projects.map(p => {
      // Try multiple ID formats to match (string, number, both)
      const projectId = p.id;
      const projectFlags = flagMap[projectId] || flagMap[String(projectId)] || flagMap[Number(projectId)] || {
        totalJobs: 0,
        flaggedJobs: 0,
        notStartedOnTime: 0,
        startedLate: 0,
        notEndedOnTime: 0,
        flaggedJobDetails: []
      };

      // A project has alerts if it has flagged jobs
      const hasAlerts = projectFlags.flaggedJobs > 0;

      return {
        ...p,
        alerts: hasAlerts,
        // Add flagged job data
        flaggedJobs: projectFlags.flaggedJobs || 0,
        totalJobs: projectFlags.totalJobs || 0,
        flagBreakdown: projectFlags.flagBreakdown || {
          notStartedOnTime: projectFlags.notStartedOnTime || 0,
          startedLate: projectFlags.startedLate || 0,
          notEndedOnTime: projectFlags.notEndedOnTime || 0
        },
        flaggedJobDetails: projectFlags.flaggedJobDetails || []
      };
    }).filter(p => p.alerts); // Only show projects with alerts

    // Sort by flagged jobs (highest first)
    const sortedAlerts = alerts.sort((a, b) => {
      const aFlags = a.flaggedJobs || 0;
      const bFlags = b.flaggedJobs || 0;
      return bFlags - aFlags;
    });

    const totalFlaggedJobs = sortedAlerts.reduce((sum, p) => sum + (p.flaggedJobs || 0), 0);
    console.log(`[Dashboard] Found ${sortedAlerts.length} projects with alerts, ${totalFlaggedJobs} total flagged jobs`);

    return sortedAlerts;
  }, [projects, logs, flagMap]);


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
      {/* Connection status indicator (optional - can be removed in production) */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm">
          Real-time updates disconnected. Data may not be current.
        </div>
      )}
      
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
