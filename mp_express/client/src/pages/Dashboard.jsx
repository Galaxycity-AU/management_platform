import React, { useState, useEffect } from 'react';
import { DashboardStatsView } from '../components/DashboardStats';
import CentraliseView from '../components/CentraliseView';
import { ProjectStatus, LogStatus } from '../types';
import { loadProjectsAndLogs } from '../utils/dataLoader';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagMap, setFlagMap] = useState({});

  // Load data using centralized loader
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const { projects: projectData, logs: logsData } = await loadProjectsAndLogs();

        setProjects(projectData);
        setLogs(logsData);

        // Fetch dashboard alerts
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
            console.log('📊 Flag map loaded:', Object.keys(flagMapObj).length, 'projects');
            setFlagMap(flagMapObj);
          } else {
            console.error('Failed to fetch dashboard alerts:', response.statusText);
            setFlagMap({});
          }
        } catch (alertError) {
          console.error('Error fetching dashboard alerts:', alertError);
          setFlagMap({});
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setProjects([]);
        setLogs([]);
        setFlagMap({});
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

  const projectAlerts = React.useMemo(() => {
    console.log('🔄 Calculating project alerts with flagged jobs...');
    console.log(`📊 Processing ${projects.length} projects`);
    console.log('🔍 Flag map keys:', Object.keys(flagMap));
    console.log('🔍 Project IDs:', projects.map(p => `${p.id} (${typeof p.id})`));

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

      if (projectFlags.flaggedJobs > 0) {
        console.log(`🚨 Project ${p.id} (${p.name}):`, projectFlags);
      }

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
    console.log(`✅ Found ${sortedAlerts.length} projects with alerts`);
    console.log(`🚨 Total flagged jobs: ${totalFlaggedJobs}`);
    
    // Log top 3 projects for debugging
    sortedAlerts.slice(0, 3).forEach((alert, idx) => {
      console.log(`#${idx + 1}: ${alert.name} - ${alert.flaggedJobs} flagged jobs`, {
        notStarted: alert.flagBreakdown.notStartedOnTime,
        startedLate: alert.flagBreakdown.startedLate,
        notEnded: alert.flagBreakdown.notEndedOnTime
      });
    });

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