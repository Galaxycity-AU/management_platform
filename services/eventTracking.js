const processLogsByProject = (logs) => {
    const projectMap = {};

    // Group by ProjectID
    logs.forEach(log => {
      const projectId = log.WorkOrder.ProjectID;
      
      if (!projectMap[projectId]) {
        projectMap[projectId] = {
          projectId,
          workers: {},
          totalLogs: 0,
          lastActivity: null,
          startTime: null,
          endTime: null
        };
      }

      const project = projectMap[projectId];
      const staffId = log.Staff.ID;
      const logDate = new Date(log.DateLogged);

      // Track per worker
      if (!project.workers[staffId]) {
        project.workers[staffId] = {
          id: staffId,
          name: log.Staff.Name,
          status: log.Status.Name,
          statusColor: log.Status.Color,
          lastActivity: logDate,
          startTime: null,
          endTime: null,
          totalMinutes: 0,
          breakMinutes: 0,
          activities: [],
          isActivelyWorking: false,
          currentSessionStart: null
        };
      }

      const worker = project.workers[staffId];
      worker.activities.push(log);
      
      project.totalLogs++;
      
      // Project-level times
      if (!project.lastActivity || logDate > project.lastActivity) {
        project.lastActivity = logDate;
      }
      if (!project.startTime || logDate < project.startTime) {
        project.startTime = logDate;
      }
    });

    // Process each worker's activities chronologically to calculate proper work time
    Object.values(projectMap).forEach(project => {
      Object.values(project.workers).forEach(worker => {
        // Sort activities chronologically
        worker.activities.sort((a, b) => new Date(a.DateLogged) - new Date(b.DateLogged));
        
        let totalWorkMinutes = 0;
        let breakMinutes = 0;
        let sessionStart = null;
        let lastStatus = null;
        
        worker.activities.forEach((activity, index) => {
          const activityDate = new Date(activity.DateLogged);
          const statusName = activity.Status.Name;
          
          // Set first activity as overall start
          if (index === 0) {
            worker.startTime = activityDate;
          }
          
          // Track session start when going Onsite
          if (statusName === 'Onsite' && !sessionStart) {
            sessionStart = activityDate;
            worker.currentSessionStart = activityDate;
          }
          
          // When Break, End Of Day, or Completed - close current session
          if ((statusName === 'Break' || statusName === 'End Of Day' || statusName === 'Completed') && sessionStart) {
            const sessionMinutes = Math.round((activityDate - sessionStart) / 1000 / 60);
            totalWorkMinutes += sessionMinutes;
            sessionStart = null;
            worker.currentSessionStart = null;
          }
          
          // Track break time
          if (statusName === 'Break') {
            breakMinutes += 5; // Estimate 5 min per break log
          }
          
          // Update last activity and status
          worker.lastActivity = activityDate;
          worker.status = statusName;
          worker.statusColor = activity.Status.Color;
          lastStatus = statusName;
          
          // If this is the last activity
          if (index === worker.activities.length - 1) {
            if (statusName === 'End Of Day' || statusName === 'Completed') {
              worker.endTime = activityDate;
              worker.isActivelyWorking = false;
            } else if (statusName === 'Onsite') {
              worker.isActivelyWorking = true;
              // Don't set endTime for active workers
            }
          }
        });
        
        worker.totalMinutes = totalWorkMinutes;
        worker.breakMinutes = breakMinutes;
        worker.workMinutes = totalWorkMinutes; // Already excludes breaks
      });
    });

    // Calculate project-level aggregates
    return Object.values(projectMap).map(project => {
      const workers = Object.values(project.workers);
      
      // Determine project status based on latest worker statuses
      const allCompleted = workers.every(w => w.status === 'End Of Day' || w.status === 'Completed');
      const anyOnsite = workers.some(w => w.status === 'Onsite');
      const anyBreak = workers.some(w => w.status === 'Break');
      const hasActiveWorkers = workers.some(w => w.isActivelyWorking);
      
      let projectStatus = 'Unknown';
      let statusColor = '#gray';
      
      if (allCompleted) {
        projectStatus = 'Completed';
        statusColor = '#4c4cff';
      } else if (anyOnsite) {
        projectStatus = 'In Progress';
        statusColor = '#64ff4c';
      } else if (anyBreak) {
        projectStatus = 'On Break';
        statusColor = '#5bff4c';
      }

      // Calculate total work time for project (sum of completed sessions only)
      const totalWorkMinutes = workers.reduce((sum, w) => sum + (w.workMinutes || 0), 0);
      const totalBreakMinutes = workers.reduce((sum, w) => sum + w.breakMinutes, 0);

      // Simple on-time calculation
      const expectedMinutesPerDay = 480; // 8 hours
      const expectedTotal = workers.length * expectedMinutesPerDay;
      const isOnTime = totalWorkMinutes >= expectedTotal * 0.8; // 80% threshold

      return {
        ...project,
        workers,
        projectStatus,
        statusColor,
        totalWorkMinutes,
        totalBreakMinutes,
        isOnTime,
        workerCount: workers.length,
        hasActiveWorkers
      };
    }).sort((a, b) => b.lastActivity - a.lastActivity);
  };

  export { processLogsByProject };