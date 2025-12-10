import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Menu, Clock, Filter } from 'lucide-react';
import { fetchWorkers, fetchJobs, fetchProjects } from '../utils/apiUtils';

const CentraliseView = () => {
  const [blockHeight] = useState(1);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAll, setShowAll] = useState(true);
  const [resources, setResources] = useState<Array<{ id: number; name: string; hours: number }>>([]);
  const [scheduledJobs, setScheduledJobs] = useState<Array<{
    id: number;
    resourceId: number;
    title: string;
    subtitle?: string;
    startHour: number;
    duration: number;
    date: Date;
    color: string;
    type: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dateScrollRef = useRef(null);
  const resourceListScrollRef = useRef(null);
  const scheduleGridScrollRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Helper function to parse time string (HH:MM:SS or HH:MM) to hours
  const parseTimeToHours = (timeString: string): number => {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours + minutes / 60;
  };

  // Helper function to calculate duration in hours from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = parseTimeToHours(startTime);
    const end = parseTimeToHours(endTime);
    return end - start;
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
      const projectsMap = new Map(projectsData.map((p: any) => [p.id, p]));

      // Transform workers to resources format
      const transformedResources = workersData.map((worker: any) => {
        // Calculate total hours for this worker from their jobs
        const workerJobs = jobsData.filter((job: any) => job.workerId === worker.id);
        const totalHours = workerJobs.reduce((sum: number, job: any) => {
          if (job.startTime && job.endTime) {
            return sum + calculateDuration(job.startTime, job.endTime);
          }
          return sum;
        }, 0);

        return {
          id: worker.id,
          name: worker.name,
          hours: totalHours
        };
      });

      console.log('Transformed resources:', transformedResources.length);
      setResources(transformedResources);

      // Transform jobs to scheduledJobs format
      const transformedJobs = jobsData
        .filter((job: any) => job.startTime && job.endTime && job.jobDate) // Only include jobs with valid time data
        .map((job: any) => {
          const project = projectsMap.get(job.projectId);
          const projectTitle = project?.title || `Project ${job.projectId}`;
          
          const startHour = parseTimeToHours(job.startTime);
          const duration = calculateDuration(job.startTime, job.endTime);
          
          // Skip jobs with invalid duration
          if (duration <= 0) return null;
          
          // Parse jobDate to Date object
          const jobDate = new Date(job.jobDate);
          
          // Skip invalid dates
          if (isNaN(jobDate.getTime())) return null;
          
          // Generate color based on job id (for visual distinction)
          const colors = ['#67e8f9', '#818cf8', '#a78bfa', '#f472b6', '#fb7185'];
          const color = colors[job.id % colors.length];

          return {
            id: job.id,
            resourceId: job.workerId,
            title: `(${duration.toFixed(2)}HRS) ${projectTitle}`,
            subtitle: project?.description || undefined,
            startHour: startHour,
            duration: duration,
            date: jobDate,
            color: color,
            type: 'job'
          };
        })
        .filter((job: any) => job !== null); // Remove null entries

      console.log('Transformed jobs:', transformedJobs.length);
      setScheduledJobs(transformedJobs);
      console.log('Data loading completed successfully');
      setError(null);
    } catch (error: any) {
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

  const timeSlots = [];
  for (let hour = 0; hour <= 23; hour++) {
    timeSlots.push(hour);
  }

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${period}`;
  };

  const getJobsForResourceOnSelectedDate = (resourceId) => {
    return scheduledJobs.filter(job => 
      job.resourceId === resourceId && isSameDay(job.date, selectedDate)
    );
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
    if (dateScrollRef.current) {
      const todayIndex = dates.findIndex(date => isToday(date));
      if (todayIndex !== -1) {
        const scrollPosition = todayIndex * 64 - dateScrollRef.current.clientWidth / 2 + 32;
        dateScrollRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      } else {
        dateScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [dates, currentMonth]);

  useEffect(() => {
    // Wait for resources to load before setting up scroll synchronization
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
  }, [loading, resources.length]);

  const rowHeight = 60 * blockHeight;

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
          <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            FILTER
          </button>
        </div>
      </div>

      {/* Date Selector Strip */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div 
          ref={dateScrollRef}
          className="overflow-x-auto" 
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex">
            {dates.map((date, idx) => (
              <button
                key={`${date.getTime()}-${idx}`}
                onClick={() => handleDateClick(date)}
                className={`flex-shrink-0 w-16 text-center py-2 border-r border-gray-200 transition cursor-pointer hover:bg-gray-100 ${
                  isSelectedDate(date) ? 'bg-blue-500 text-white hover:bg-blue-600' : 
                  isToday(date) ? 'bg-blue-100 text-blue-900' : 'bg-white'
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
          {/* Filter Section - Same height as Time Header */}
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
              <label className="flex items-center gap-2 text-xxs text-gray-600 ml-2">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="rounded"
                />
                Show All
              </label>
            </div>
          </div>

          {/* Resource List with synchronized scroll */}
          <div 
            ref={resourceListScrollRef}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className="flex items-center justify-between px-4 hover:bg-gray-100 cursor-pointer bg-white"
                style={{ 
                  height: `${rowHeight}px`, 
                  minHeight: `${rowHeight}px`,
                  maxHeight: `${rowHeight}px`,
                  boxSizing: 'border-box',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-blue-600 hover:underline">
                    {resource.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Grid - Single Day View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Time Header - Fixed position */}
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
              {/* Current Time Indicator in Header */}
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

          {/* Resource Rows - Scrollable */}
          <div 
            ref={scheduleGridScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
          >
            {resources.map((resource, index) => (
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

                  {/* Current Time Indicator - Red Line */}
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
                  {getJobsForResourceOnSelectedDate(resource.id).map((job) => (
                    <div
                      key={job.id}
                      className="absolute top-1 bottom-1 rounded px-2 py-1 text-xs font-medium overflow-hidden cursor-pointer hover:opacity-90 transition shadow"
                      style={{
                        left: `${calculateJobPosition(job.startHour)}%`,
                        width: `${calculateJobWidth(job.duration)}%`,
                        backgroundColor: job.color,
                        color: '#000'
                      }}
                    >
                      <div className="font-semibold truncate">{job.resourceId} - {job.title}</div>
                      {job.subtitle && (
                        <div className="text-xs opacity-80 truncate mt-0.5">{job.subtitle}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CentraliseView;