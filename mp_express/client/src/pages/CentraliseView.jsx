import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { fetchWorkers, fetchJobs, fetchProjects } from '../utils/apiUtils';

const CentraliseView = () => {
  const [blockHeight] = useState(1);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [resources, setResources] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const resourceListScrollRef = useRef(null);
  const scheduleGridScrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Helper function to calculate duration in hours from start and end datetime
  const calculateDuration = (startDatetime, endDatetime) => {
    if (!startDatetime || !endDatetime) return 0;
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    const durationMs = end.getTime() - start.getTime();
    return durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
  };

  // Generate a consistent color for each project based on project ID
  const getProjectColor = (projectId) => {
    // Predefined color palette with good contrast
    const colorPalette = [
      '#818cf8', // indigo
      '#fbbf24', // amber
      '#34d399', // emerald
      '#f87171', // red
      '#60a5fa', // blue
      '#a78bfa', // violet
      '#fb7185', // rose
      '#4ade80', // green
      '#fbbf24', // yellow
      '#38bdf8', // sky
      '#c084fc', // purple
      '#fb923c', // orange
      '#22d3ee', // cyan
      '#f472b6', // pink
      '#84cc16', // lime
      '#94a3b8', // slate
    ];
    
    // Use modulo to cycle through colors based on project ID
    return colorPalette[projectId % colorPalette.length];
  };

  const parseTimeToHours = (datetimeString) => {
    if (!datetimeString) return 0;
    const date = new Date(datetimeString);
    return date.getHours() + date.getMinutes() / 60;
  };

  // Data loading function
  const loadData = useCallback(async () => {
    try {
      console.log('Starting to fetch data from database...');
      setLoading(true);
      setError(null);
      
      console.log('Fetching workers, jobs, and projects...');
      const [workersData, jobsData, projectsData] = await Promise.all([
        fetchWorkers(),
        fetchJobs(),
        fetchProjects()
      ]);

      console.log('Data fetched:', {
        workers: workersData?.length || 0,
        jobs: jobsData?.length || 0,
        projects: projectsData?.length || 0
      });

      // Create a map of projects for quick lookup
      const projectsMap = new Map(projectsData.map((p) => [p.id, p]));

      // Transform workers to resources format
      const transformedResources = workersData.map((worker) => {
        // Calculate total hours for this worker from their jobs
        const workerJobs = jobsData.filter((job) => job.worker_id === worker.id);
        const totalHours = workerJobs.reduce((sum, job) => {
          // Use scheduled times, or actual times, or modified times
          const startTime = job.actual_start || job.modified_start || job.schedule_start;
          const endTime = job.actual_end || job.modified_end || job.schedule_end;
          if (startTime && endTime) {
            return sum + calculateDuration(startTime, endTime);
          }
          return sum;
        }, 0);

        return {
          id: worker.id,
          name: worker.name,
          hours: totalHours,
          phone: worker.phone || undefined,
          email: worker.email || undefined,
          position: worker.position || undefined
        };
      });

      console.log('Transformed resources:', transformedResources.length);
      setResources(transformedResources);

      // Transform jobs to scheduledJobs format
      const transformedJobs = jobsData
        .filter((job) => {
          // Use schedules_start or modified_start or actual_start
          const startTime = job.schedule_start;
          const endTime = job.schedule_end;
          return startTime && endTime; // Only include jobs with valid time data
        })
        .map((job) => {
          const project = projectsMap.get(job.project_id);
          const projectName = project?.name || `Project ${job.project_id}`;
          
          // Use the most relevant times (actual > modified > scheduled)
          const startDatetime = job.schedule_start;
          const endDatetime = job.schedule_end;
          
          const startHour = parseTimeToHours(startDatetime);
          const duration = calculateDuration(startDatetime, endDatetime);
          
          // Skip jobs with invalid duration
          if (duration <= 0) return null;
          
          // Parse date from datetime
          const jobDate = new Date(startDatetime);
          
          // Skip invalid dates
          if (isNaN(jobDate.getTime())) return null;
          
          // Generate color based on project ID (each project gets a consistent color)
          const color = getProjectColor(job.project_id);

          return {
            id: job.id,
            resourceId: job.worker_id,
            projectId: job.project_id,
            title: `(${duration.toFixed(1)}H) ${projectName}`,
            subtitle: project?.description || undefined,
            startHour: startHour,
            duration: duration,
            date: jobDate,
            color: color,
            type: 'job',
            scheduledStart: job.schedule_start,
            scheduledEnd: job.schedule_end,
            actualStart: job.actual_start || null,
            actualEnd: job.actual_end || null,
            status: job.status,
            // Include flag fields from database
            is_flag: job.is_flag || false,
            flag_reason: job.flag_reason || null
          };
        })
        .filter((job) => job !== null); // Remove null entries

      console.log('Transformed jobs:', transformedJobs.length);
      setScheduledJobs(transformedJobs);
      console.log('Data loading completed successfully');
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error?.message || 'Failed to load schedule data. Please check if the server is running.';
      setError(errorMessage);
      // Set empty arrays on error so the UI doesn't break
      setResources([]);
      setScheduledJobs([]);
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  }, []);

  // Fetch data from database on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      dates.push(date);
    }
    
    return dates;
  };

  const dates = generateDates();

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getDateNumber = (date) => {
    return date.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isSelectedDate = (date) => {
    return isSameDay(date, selectedDate);
  };

  const getJobsForResourceOnSelectedDate = (resourceId) => {
    return scheduledJobs.filter(job => 
      job.resourceId === resourceId && isSameDay(job.date, selectedDate)
    );
  };

  // Get late reason for a specific job - use stored flag from database
  const getJobLateReason = (job) => {
    if (!job) return null;

    // Don't show late condition if job is approved or rejected
    if (job.status === 'approved' || job.status === 'rejected') return null;

    // Use stored flag from database (calculated on backend)
    // Handle both boolean true and numeric 1 from MySQL
    const isFlagged = job.is_flag === true || job.is_flag === 1;
    return isFlagged ? job.flag_reason : null;
  };

  // Check if a worker has any late conditions (comprehensive check)
  const hasLateConditions = (resourceId) => {
    const jobs = getJobsForResourceOnSelectedDate(resourceId);
    if (jobs.length === 0) return false;

    return jobs.some(job => getJobLateReason(job) !== null);
  };

  const getWorkerStatus = (resourceId) => {
    const now = new Date();
    const jobsToday = scheduledJobs.filter(job => 
      job.resourceId === resourceId && isSameDay(job.date, selectedDate)
    );

    if (jobsToday.length === 0) {
      return { status: 'no-job', label: 'No Jobs', color: 'bg-gray-400' };
    }

    if (!isToday(selectedDate)) {
      return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' };
    }

    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const activeJob = jobsToday.find(job => job.actualStart && !job.actualEnd);
    if (activeJob) {
      const startTime = new Date(activeJob.actualStart);
      const startTimeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { 
        status: 'in-progress', 
        label: `Started ${startTimeStr}`, 
        color: 'bg-green-500',
        time: startTimeStr
      };
    }

    const completedJob = jobsToday.find(job => job.actualStart && job.actualEnd);
    if (completedJob) {
      const endTime = new Date(completedJob.actualEnd);
      const endTimeStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { 
        status: 'completed', 
        label: `Ended ${endTimeStr}`, 
        color: 'bg-gray-600',
        time: endTimeStr
      };
    }

    const lateJob = jobsToday.find(job => {
      const scheduledStart = parseTimeToHours(job.scheduleStart);
      return currentHour > scheduledStart + 0.25 && !job.actualStart;
    });
    
    if (lateJob) {
      const scheduledTime = new Date(lateJob.scheduleStart);
      const scheduledTimeStr = scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { 
        status: 'late', 
        label: `Late (${scheduledTimeStr})`, 
        color: 'bg-red-500',
        time: scheduledTimeStr
      };
    }

    const upcomingJob = jobsToday.find(job => {
      const scheduledStart = parseTimeToHours(job.scheduleStart);
      return currentHour < scheduledStart;
    });

    if (upcomingJob) {
      const scheduledTime = new Date(upcomingJob.scheduleStart);
      const scheduledTimeStr = scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { 
        status: 'scheduled', 
        label: `Starts ${scheduledTimeStr}`, 
        color: 'bg-blue-500',
        time: scheduledTimeStr
      };
    }

    return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' };
  };

  const timeSlots = [];
  for (let hour = 0; hour <= 23; hour++) {
    timeSlots.push(hour);
  }

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${period}`;
  };

  const getFilteredResources = () => {
    if (showAll) {
      const workersWithJobs = new Set(
        scheduledJobs
          .filter(job => isSameDay(job.date, selectedDate))
          .map(job => job.resourceId)
      );
      return resources.filter(resource => workersWithJobs.has(resource.id));
    } else {
      return resources;
    }
  };

  const calculateJobPosition = (startHour) => {
    return (startHour / 24) * 100;
  };

  const calculateJobWidth = (duration) => {
    return (duration / 24) * 100;
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    
    if (!isToday(selectedDate)) return null;
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalHours = 24;
    const hoursFromStart = currentHour;
    const minutesOffset = currentMinute / 60;
    const positionPercent = ((hoursFromStart + minutesOffset) / totalHours) * 100;
    
    return positionPercent;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const goToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setCurrentMonth(tomorrow);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const getMonthYearDisplay = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    // Wait for resources to load and DOM to be ready
    if (loading || resources.length === 0) return;

    const resourceList = resourceListScrollRef.current;
    const scheduleGrid = scheduleGridScrollRef.current;

    if (!resourceList || !scheduleGrid) return;

    const handleResourceScroll = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      scheduleGrid.scrollTop = resourceList.scrollTop;
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    };

    const handleScheduleScroll = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      resourceList.scrollTop = scheduleGrid.scrollTop;
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    };

    resourceList.addEventListener('scroll', handleResourceScroll);
    scheduleGrid.addEventListener('scroll', handleScheduleScroll);

    return () => {
      resourceList.removeEventListener('scroll', handleResourceScroll);
      scheduleGrid.removeEventListener('scroll', handleScheduleScroll);
    };
  }, [loading, resources.length, showAll, selectedDate]);

  const rowHeight = 60 * blockHeight;

  // Format time for tooltip
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Format date and time together
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Calculate job status: Done, In Progress, or Not Started
  const getJobStatus = (job) => {
    if (!job) return 'Not Started';
    
    // If job has both actual start and end, it's Done
    if (job.actualStart && job.actualEnd) {
      return 'Done';
    }
    
    // If job has actual start but no end, it's In Progress
    if (job.actualStart && !job.actualEnd) {
      return 'In Progress';
    }
    
    // Otherwise, it's Not Started
    return 'Not Started';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Not Started':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const filteredRes = getFilteredResources();
    const total = filteredRes.length;
    let working = 0, late = 0, completed = 0, upcoming = 0, off = 0;
    
    filteredRes.forEach(resource => {
      const status = getWorkerStatus(resource.id);
      if (status.status === 'in-progress') working++;
      else if (status.status === 'late') late++;
      else if (status.status === 'completed') completed++;
      else if (status.status === 'scheduled') upcoming++;
      else if (status.status === 'no-job') off++;
    });
    
    return { total, working, late, completed, upcoming, off };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading schedule data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="text-lg text-red-600 font-semibold mb-2">Error Loading Data</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          </button>
          <span className="text-sm font-medium text-blue-600 min-w-[200px] text-center">
            {getMonthYearDisplay()}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            TODAY
          </button>
          <button
            onClick={goToTomorrow}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            TOMORROW
          </button>
        </div>
      </div>

      {/* Date Selector Strip */}
      <div className="border-b border-gray-200 bg-gray-50">
        <style>{`
          .date-scroll-container::-webkit-scrollbar {
            height: 12px;
            display: block;
          }
          .date-scroll-container::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 6px;
          }
          .date-scroll-container::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 6px;
            border: 2px solid #f7fafc;
          }
          .date-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}</style>
        <div 
          className="date-scroll-container overflow-x-auto"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc'
          }}
        >
          <div className="flex">
            {dates.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`flex-shrink-0 w-16 text-center py-2 border-r border-gray-200 transition select-none hover:bg-gray-100 ${
                  isSelectedDate(date)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : isToday(date)
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-white'
                }`}
              >
                <div className="text-xs font-medium">{getDayName(date)}</div>
                <div className="text-xl font-semibold">{getDateNumber(date)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Resources */}
        <div className="w-64 flex flex-col bg-gray-50 border-r border-gray-200">
          {/* Filter Section */}
          <div 
            className="px-4 bg-white flex-shrink-0 flex items-center justify-between border-b border-gray-200" 
            style={{ 
              height: `${rowHeight}px`,
              minHeight: `${rowHeight}px`,
              maxHeight: `${rowHeight}px`,
              boxSizing: 'border-box'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Individual Resources</span>
              <label className="flex items-center gap-2 text-xs text-gray-600 ml-2">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="rounded"
                />
                Show Schedules
              </label>
            </div>
          </div>

          {/* Resource List */}
          <div 
            ref={resourceListScrollRef}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {getFilteredResources().map((resource) => {
              return (
                <div
                  key={resource.id}
                  className="flex items-center px-4 hover:bg-gray-50 cursor-pointer bg-white"
                  style={{ 
                    height: `${rowHeight}px`, 
                    minHeight: `${rowHeight}px`,
                    maxHeight: `${rowHeight}px`,
                    boxSizing: 'border-box',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  {/* Worker Info */}
                  <span className="flex items-center text-sm font-semibold text-gray-900 flex-1 min-w-0">
                    <span className="truncate">{resource.name}</span>

                    {hasLateConditions(resource.id) && (
                      <AlertTriangle
                        className="w-5 h-5 text-red-500 ml-auto animate-pulse"
                        aria-hidden="true"
                        style={{ animationDuration: "1.5s" }}
                      />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Time Header */}
          <div 
            className="bg-gray-50 relative flex-shrink-0"
            style={{ 
              height: `${rowHeight}px`, 
              minHeight: `${rowHeight}px`,
              maxHeight: `${rowHeight}px`,
              boxSizing: 'border-box',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <div className="flex text-xs text-gray-500 relative h-full items-center">
              {timeSlots.map((hour, hourIdx) => (
                <div
                  key={hourIdx}
                  className="flex-1 text-center border-r border-gray-200"
                >
                  {hour % 2 === 0 && formatHour(hour)}
                </div>
              ))}
              {(() => {
                const currentTimePos = getCurrentTimePosition();
                if (currentTimePos === null) return null;
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ left: `${currentTimePos}%` }}
                  />
                );
              })()}
            </div>
          </div>

          {/* Resource Rows */}
          <div 
            ref={scheduleGridScrollRef}
            className="overflow-y-auto overflow-x-hidden"
          >
            {getFilteredResources().map((resource) => (
              <div 
                key={resource.id} 
                className="bg-white"
                style={{ 
                  height: `${rowHeight}px`, 
                  minHeight: `${rowHeight}px`,
                  maxHeight: `${rowHeight}px`,
                  boxSizing: 'border-box',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <div className="relative h-full w-full">
                  {/* Time Grid Lines */}
                  <div className="absolute inset-0 flex">
                    {timeSlots.map((hour, hourIdx) => (
                      <div
                        key={hourIdx}
                        className="flex-1 border-r border-gray-100"
                      />
                    ))}
                  </div>

                  {/* Current Time Indicator */}
                  {(() => {
                    const currentTimePos = getCurrentTimePosition();
                    if (currentTimePos === null) return null;
                    return (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${currentTimePos}%` }}
                      />
                    );
                  })()}

                  {/* Scheduled Jobs */}
                  {getJobsForResourceOnSelectedDate(resource.id).map((job) => {
                    const now = new Date();
                    const currentHour = now.getHours() + now.getMinutes() / 60;
                    
                    // Calculate actual progress
                    let actualStartHour = null;
                    let actualEndHour = null;
                    let isLate = false;
                    
                    if (job.actualStart) {
                      const actualStartDate = new Date(job.actualStart);
                      actualStartHour = actualStartDate.getHours() + actualStartDate.getMinutes() / 60;
                    }
                    
                    if (job.actualEnd) {
                      const actualEndDate = new Date(job.actualEnd);
                      actualEndHour = actualEndDate.getHours() + actualEndDate.getMinutes() / 60;
                    }
                    
                    // Check if late (should have started but hasn't)
                    if (!job.actualStart && isToday(selectedDate) && currentHour > job.startHour + 0.25) {
                      isLate = true;
                    }
                    
                    // Determine colors
                    const baseColor = job.color;
                    const lightColor = job.color + '30'; // Light for scheduled
                    const darkColor = job.color; // Dark for actual
                    const lateBorder = '#ef4444'; // Red border for late
                    
                    return (
                      <div
                        onClick={() => setSelectedJob(job)}
                        key={job.id}
                        className="absolute top-1 bottom-1"
                        style={{
                          left: `${calculateJobPosition(job.startHour)}%`,
                          width: `${calculateJobWidth(job.duration)}%`,
                        }}
                      >
                        {/* Scheduled time bar (project color with red border if late) */}
                        <div
                          className={`absolute inset-0 rounded px-2 py-1 text-xs font-medium overflow-hidden border-2 ${isLate ? 'animate-pulse' : ''}`}
                          style={{
                            backgroundColor: lightColor,
                            borderColor: isLate ? lateBorder : darkColor,
                            borderStyle: isLate ? 'dashed' : 'solid',
                            color: '#000',
                            animationDuration: isLate ? '1.5s' : undefined
                          }}
                        >
                          <div className="font-semibold truncate relative z-10">{job.title}</div>
                        </div>
                        
                        {/* Actual time worked bar (dark color) - overlays but keeps text visible */}
                        {actualStartHour !== null && (
                          <>
                            <div
                              className="absolute top-0 bottom-0 rounded shadow-sm"
                              style={{
                                backgroundColor: darkColor,
                                opacity: 0.7,
                                left: `${Math.max(0, ((actualStartHour - job.startHour) / job.duration) * 100)}%`,
                                width: actualEndHour !== null 
                                  ? `${((actualEndHour - actualStartHour) / job.duration) * 100}%`
                                  : `${((currentHour - actualStartHour) / job.duration) * 100}%`,
                                minWidth: '3px',
                                pointerEvents: 'none'
                              }}
                            />
                            
                            {/* Subtle pulse for in-progress work */}
                            {!job.actualEnd && isToday(selectedDate) && (
                              <div
                                className="absolute top-0 bottom-0 animate-pulse"
                                style={{
                                  backgroundColor: darkColor,
                                  opacity: 0.2,
                                  left: `${Math.max(0, ((actualStartHour - job.startHour) / job.duration) * 100)}%`,
                                  width: `${((currentHour - actualStartHour) / job.duration) * 100}%`,
                                  pointerEvents: 'none',
                                  animationDuration: '2s'
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT INFO PANEL - Only show when a schedule is clicked */}
        {selectedJob && (() => {
          const worker = resources.find(resource => resource.id === selectedJob.resourceId);
          const jobStatus = getJobStatus(selectedJob);
          const projectName = selectedJob.title.replace(/^\(\d+\.\d+H\)\s/, '');
          const lateReason = getJobLateReason(selectedJob);
          
          return (
            <div className="w-96 border-l border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex-shrink-0">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold">Job Details</h2>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-white hover:text-gray-200 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(jobStatus)}`}>
                    {jobStatus}
                  </div>
                  {lateReason && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{lateReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Project Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{projectName}</p>
                    </div>
                    {selectedJob.subtitle && (
                      <div>
                        <p className="text-sm text-gray-600 leading-relaxed">{selectedJob.subtitle}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <button 
                        onClick={() => window.open(`/projects/${selectedJob.projectId}`, '_blank')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        View Project Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Worker Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Worker</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-base font-medium text-gray-900">{worker?.name || 'Not Assigned'}</p>
                      {worker?.position && (
                        <p className="text-sm text-gray-600">{worker.position}</p>
                      )}
                    </div>
                    {worker?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${worker.phone}`} className="hover:text-blue-600">{worker.phone}</a>
                      </div>
                    )}
                    {worker?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${worker.email}`} className="hover:text-blue-600">{worker.email}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Schedule</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Scheduled Time</p>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedJob.scheduleStart)}
                          </p>
                          {selectedJob.scheduleEnd && (
                            <p className="text-sm text-gray-600">
                              to {formatDateTime(selectedJob.scheduleEnd)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {(selectedJob.actualStart || selectedJob.actualEnd) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Actual Time</p>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            {selectedJob.actualStart ? (
                              <p className="text-sm font-medium text-gray-900">
                                {formatDateTime(selectedJob.actualStart)}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">Not started</p>
                            )}
                            {selectedJob.actualEnd ? (
                              <p className="text-sm text-gray-600">
                                to {formatDateTime(selectedJob.actualEnd)}
                              </p>
                            ) : selectedJob.actualStart ? (
                              <p className="text-sm text-blue-600 font-medium">In Progress</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900">{selectedJob.duration.toFixed(1)} hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default CentraliseView;

