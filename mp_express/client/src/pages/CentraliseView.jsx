// // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
// // import { fetchWorkers, fetchJobs, fetchProjects } from '../utils/apiUtils';

// // const CentraliseView = () => {
// //   const [blockHeight] = useState(1);
// //   const today = new Date();
// //   const [currentMonth, setCurrentMonth] = useState(today);
// //   const [selectedDate, setSelectedDate] = useState(today);
// //   const [showAll, setShowAll] = useState(false);
// //   const [resources, setResources] = useState([]);
// //   const [scheduledJobs, setScheduledJobs] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const resourceListScrollRef = useRef(null);
// //   const scheduleGridScrollRef = useRef(null);
// //   const dateStripScrollRef = useRef(null);
// //   const todayButtonRef = useRef(null);
// //   const isScrollingRef = useRef(false);
// //   const hasScrolledToTodayRef = useRef(false);
// //   const [selectedJob, setSelectedJob] = useState(null);

// //   // Helper function to calculate duration in hours from start and end datetime
// //   const calculateDuration = (startDatetime, endDatetime) => {
// //     if (!startDatetime || !endDatetime) return 0;
// //     const start = new Date(startDatetime);
// //     const end = new Date(endDatetime);
// //     const durationMs = end.getTime() - start.getTime();
// //     return durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
// //   };

// //   // Generate a consistent color for each project based on project ID
// //   const getProjectColor = (projectId) => {
// //     // Predefined color palette with good contrast
// //     const colorPalette = [
// //       '#818cf8', // indigo
// //       '#fbbf24', // amber
// //       '#34d399', // emerald
// //       '#f87171', // red
// //       '#60a5fa', // blue
// //       '#a78bfa', // violet
// //       '#fb7185', // rose
// //       '#4ade80', // green
// //       '#fbbf24', // yellow
// //       '#38bdf8', // sky
// //       '#c084fc', // purple
// //       '#fb923c', // orange
// //       '#22d3ee', // cyan
// //       '#f472b6', // pink
// //       '#84cc16', // lime
// //       '#94a3b8', // slate
// //     ];
    
// //     // Use modulo to cycle through colors based on project ID
// //     return colorPalette[projectId % colorPalette.length];
// //   };

// //   const parseTimeToHours = (datetimeString) => {
// //     if (!datetimeString) return 0;
// //     const date = new Date(datetimeString);
// //     return date.getHours() + date.getMinutes() / 60;
// //   };

// //   // Data loading function
// //   const loadData = useCallback(async () => {
// //     try {
// //       console.log('Starting to fetch data from database...');
// //       setLoading(true);
// //       setError(null);
      
// //       console.log('Fetching workers, jobs, and projects...');
// //       const [workersData, jobsData, projectsData] = await Promise.all([
// //         fetchWorkers(),
// //         fetchJobs(),
// //         fetchProjects()
// //       ]);

// //       console.log('Data fetched:', {
// //         workers: workersData?.length || 0,
// //         jobs: jobsData?.length || 0,
// //         projects: projectsData?.length || 0
// //       });

// //       // Create a map of projects for quick lookup
// //       const projectsMap = new Map(projectsData.map((p) => [p.id, p]));

// //       // Transform workers to resources format
// //       const transformedResources = workersData.map((worker) => {
// //         // Calculate total hours for this worker from their jobs
// //         const workerJobs = jobsData.filter((job) => job.worker_id === worker.id);
// //         const totalHours = workerJobs.reduce((sum, job) => {
// //           // Use scheduled times, or actual times, or modified times
// //           const startTime = job.actual_start || job.modified_start || job.schedule_start;
// //           const endTime = job.actual_end || job.modified_end || job.schedule_end;
// //           if (startTime && endTime) {
// //             return sum + calculateDuration(startTime, endTime);
// //           }
// //           return sum;
// //         }, 0);

// //         return {
// //           id: worker.id,
// //           name: worker.name,
// //           hours: totalHours,
// //           phone: worker.phone || undefined,
// //           email: worker.email || undefined,
// //           position: worker.position || undefined
// //         };
// //       });

// //       console.log('Transformed resources:', transformedResources.length);
// //       setResources(transformedResources);

// //       // Transform jobs to scheduledJobs format
// //       const transformedJobs = jobsData
// //         .filter((job) => {
// //           // Use schedules_start or modified_start or actual_start
// //           const startTime = job.schedule_start;
// //           const endTime = job.schedule_end;
// //           return startTime && endTime; // Only include jobs with valid time data
// //         })
// //         .map((job) => {
// //           const project = projectsMap.get(job.project_id);
// //           const projectName = project?.name || `Project ${job.project_id}`;
          
// //           // Use the most relevant times (actual > modified > scheduled)
// //           const startDatetime = job.schedule_start;
// //           const endDatetime = job.schedule_end;
          
// //           const startHour = parseTimeToHours(startDatetime);
// //           const duration = calculateDuration(startDatetime, endDatetime);
          
// //           // Skip jobs with invalid duration
// //           if (duration <= 0) return null;
          
// //           // Parse date from datetime
// //           const jobDate = new Date(startDatetime);
          
// //           // Skip invalid dates
// //           if (isNaN(jobDate.getTime())) return null;
          
// //           // Generate color based on project ID (each project gets a consistent color)
// //           const color = getProjectColor(job.project_id);

// //           return {
// //             id: job.id,
// //             resourceId: job.worker_id,
// //             projectId: job.project_id,
// //             title: `(${duration.toFixed(1)}H) ${projectName}`,
// //             subtitle: project?.description || undefined,
// //             startHour: startHour,
// //             duration: duration,
// //             date: jobDate,
// //             color: color,
// //             type: 'job',
// //             scheduledStart: job.schedule_start,
// //             scheduledEnd: job.schedule_end,
// //             actualStart: job.actual_start || null,
// //             actualEnd: job.actual_end || null,
// //             status: job.status,
// //             // Include flag fields from database
// //             is_flag: job.is_flag || false,
// //             flag_reason: job.flag_reason || null
// //           };
// //         })
// //         .filter((job) => job !== null); // Remove null entries

// //       console.log('Transformed jobs:', transformedJobs.length);
// //       setScheduledJobs(transformedJobs);
// //       console.log('Data loading completed successfully');
// //       setError(null);
// //     } catch (error) {
// //       console.error('Error loading data:', error);
// //       const errorMessage = error?.message || 'Failed to load schedule data. Please check if the server is running.';
// //       setError(errorMessage);
// //       // Set empty arrays on error so the UI doesn't break
// //       setResources([]);
// //       setScheduledJobs([]);
// //     } finally {
// //       setLoading(false);
// //       console.log('Loading state set to false');
// //     }
// //   }, []);

// //   // Fetch data from database on mount
// //   useEffect(() => {
// //     loadData();
// //   }, [loadData]);

// //   const generateDates = () => {
// //     const dates = [];
// //     const year = currentMonth.getFullYear();
// //     const month = currentMonth.getMonth();
    
// //     const firstDay = new Date(year, month, 1);
// //     const lastDay = new Date(year, month + 1, 0);
    
// //     for (let day = 1; day <= lastDay.getDate(); day++) {
// //       const date = new Date(year, month, day);
// //       dates.push(date);
// //     }
    
// //     return dates;
// //   };

// //   const dates = generateDates();

// //   const getDayName = (date) => {
// //     return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
// //   };

// //   // Auto-scroll to center today's date in the date strip
// //   useEffect(() => {
// //     hasScrolledToTodayRef.current = false;
// //   }, [currentMonth]);

// //   useEffect(() => {
// //     if (hasScrolledToTodayRef.current) return;
    
// //     const scrollToToday = () => {
// //       const container = dateStripScrollRef.current;
// //       const todayButton = todayButtonRef.current;
      
// //       if (!container || !todayButton) {
// //         // Retry if elements not ready
// //         setTimeout(scrollToToday, 50);
// //         return;
// //       }
      
// //       const containerRect = container.getBoundingClientRect();
// //       const buttonRect = todayButton.getBoundingClientRect();
// //       const currentScroll = container.scrollLeft;
      
// //       // Calculate position to center the today button
// //       const buttonCenter = buttonRect.left - containerRect.left + currentScroll + (buttonRect.width / 2);
// //       const containerCenter = containerRect.width / 2;
// //       const scrollPos = buttonCenter - containerCenter;
      
// //       container.scrollLeft = Math.max(0, scrollPos);
// //       hasScrolledToTodayRef.current = true;
// //     };
    
// //     // Wait for DOM to be ready
// //     setTimeout(scrollToToday, 300);
// //   }, [dates.length]);

// //   const getDateNumber = (date) => {
// //     return date.getDate();
// //   };

// //   const isToday = (date) => {
// //     const today = new Date();
// //     return date.toDateString() === today.toDateString();
// //   };

// //   const isSameDay = (date1, date2) => {
// //     return date1.toDateString() === date2.toDateString();
// //   };

// //   const isSelectedDate = (date) => {
// //     return isSameDay(date, selectedDate);
// //   };

// //   const getJobsForResourceOnSelectedDate = (resourceId) => {
// //     return scheduledJobs.filter(job => 
// //       job.resourceId === resourceId && isSameDay(job.date, selectedDate)
// //     );
// //   };

// //   // Get late reason for a specific job - use stored flag from database
// //   const getJobLateReason = (job) => {
// //     if (!job) return null;

// //     // Don't show late condition if job is approved or rejected
// //     if (job.status === 'approved' || job.status === 'rejected') return null;

// //     // Use stored flag from database (calculated on backend)
// //     // Handle both boolean true and numeric 1 from MySQL
// //     const isFlagged = job.is_flag === true || job.is_flag === 1;
// //     return isFlagged ? job.flag_reason : null;
// //   };

// //   // Check if a worker has any late conditions (comprehensive check)
// //   const hasLateConditions = (resourceId) => {
// //     const jobs = getJobsForResourceOnSelectedDate(resourceId);
// //     if (jobs.length === 0) return false;

// //     return jobs.some(job => getJobLateReason(job) !== null);
// //   };

// //   const getWorkerStatus = (resourceId) => {
// //     const now = new Date();
// //     const jobsToday = scheduledJobs.filter(job => 
// //       job.resourceId === resourceId && isSameDay(job.date, selectedDate)
// //     );

// //     if (jobsToday.length === 0) {
// //       return { status: 'no-job', label: 'No Jobs', color: 'bg-gray-400' };
// //     }

// //     if (!isToday(selectedDate)) {
// //       return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' };
// //     }

// //     const currentHour = now.getHours() + now.getMinutes() / 60;
    
// //     const activeJob = jobsToday.find(job => job.actualStart && !job.actualEnd);
// //     if (activeJob) {
// //       const startTime = new Date(activeJob.actualStart);
// //       const startTimeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// //       return { 
// //         status: 'in-progress', 
// //         label: `Started ${startTimeStr}`, 
// //         color: 'bg-green-500',
// //         time: startTimeStr
// //       };
// //     }

// //     const completedJob = jobsToday.find(job => job.actualStart && job.actualEnd);
// //     if (completedJob) {
// //       const endTime = new Date(completedJob.actualEnd);
// //       const endTimeStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// //       return { 
// //         status: 'completed', 
// //         label: `Ended ${endTimeStr}`, 
// //         color: 'bg-gray-600',
// //         time: endTimeStr
// //       };
// //     }

// //     const lateJob = jobsToday.find(job => {
// //       const scheduledStart = parseTimeToHours(job.scheduleStart);
// //       return currentHour > scheduledStart + 0.25 && !job.actualStart;
// //     });
    
// //     if (lateJob) {
// //       const scheduledTime = new Date(lateJob.scheduleStart);
// //       const scheduledTimeStr = scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// //       return { 
// //         status: 'late', 
// //         label: `Late (${scheduledTimeStr})`, 
// //         color: 'bg-red-500',
// //         time: scheduledTimeStr
// //       };
// //     }

// //     const upcomingJob = jobsToday.find(job => {
// //       const scheduledStart = parseTimeToHours(job.scheduleStart);
// //       return currentHour < scheduledStart;
// //     });

// //     if (upcomingJob) {
// //       const scheduledTime = new Date(upcomingJob.scheduleStart);
// //       const scheduledTimeStr = scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// //       return { 
// //         status: 'scheduled', 
// //         label: `Starts ${scheduledTimeStr}`, 
// //         color: 'bg-blue-500',
// //         time: scheduledTimeStr
// //       };
// //     }

// //     return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' };
// //   };

// //   const timeSlots = [];
// //   for (let hour = 0; hour <= 23; hour++) {
// //     timeSlots.push(hour);
// //   }

// //   const formatHour = (hour) => {
// //     const period = hour >= 12 ? 'PM' : 'AM';
// //     const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
// //     return `${displayHour}${period}`;
// //   };



// //   const getFilteredResources = () => {
// //     if (showAll) {
// //       const workersWithJobs = new Set(
// //         scheduledJobs
// //           .filter(job => isSameDay(job.date, selectedDate))
// //           .map(job => job.resourceId)
// //       );
// //       return resources.filter(resource => workersWithJobs.has(resource.id));
// //     } else {
// //       return resources;
// //     }
// //   };

// //   const calculateJobPosition = (startHour) => {
// //     return (startHour / 24) * 100;
// //   };

// //   const calculateJobWidth = (duration) => {
// //     return (duration / 24) * 100;
// //   };

// //   const getCurrentTimePosition = () => {
// //     const now = new Date();
    
// //     if (!isToday(selectedDate)) return null;
    
// //     const currentHour = now.getHours();
// //     const currentMinute = now.getMinutes();
// //     const totalHours = 24;
// //     const hoursFromStart = currentHour;
// //     const minutesOffset = currentMinute / 60;
// //     const positionPercent = ((hoursFromStart + minutesOffset) / totalHours) * 100;
    
// //     return positionPercent;
// //   };

// //   const navigateMonth = (direction) => {
// //     const newDate = new Date(currentMonth);
// //     newDate.setMonth(currentMonth.getMonth() + direction);
// //     setCurrentMonth(newDate);
// //   };

// //   const goToToday = () => {
// //     const today = new Date();
// //     setSelectedDate(today);
// //     setCurrentMonth(today);
// //   };

// //   const goToTomorrow = () => {
// //     const tomorrow = new Date();
// //     tomorrow.setDate(tomorrow.getDate() + 1);
// //     setSelectedDate(tomorrow);
// //     setCurrentMonth(tomorrow);
// //   };

// //   const handleDateClick = (date) => {
// //     setSelectedDate(date);
// //   };

// //   const getMonthYearDisplay = () => {
// //     return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
// //   };

// //   useEffect(() => {
// //     // Wait for resources to load and DOM to be ready
// //     if (loading || resources.length === 0) return;

// //     const resourceList = resourceListScrollRef.current;
// //     const scheduleGrid = scheduleGridScrollRef.current;

// //     if (!resourceList || !scheduleGrid) return;

// //     const handleResourceScroll = () => {
// //       if (isScrollingRef.current) return;
// //       isScrollingRef.current = true;
// //       scheduleGrid.scrollTop = resourceList.scrollTop;
// //       requestAnimationFrame(() => {
// //         isScrollingRef.current = false;
// //       });
// //     };

// //     const handleScheduleScroll = () => {
// //       if (isScrollingRef.current) return;
// //       isScrollingRef.current = true;
// //       resourceList.scrollTop = scheduleGrid.scrollTop;
// //       requestAnimationFrame(() => {
// //         isScrollingRef.current = false;
// //       });
// //     };

// //     resourceList.addEventListener('scroll', handleResourceScroll);
// //     scheduleGrid.addEventListener('scroll', handleScheduleScroll);

// //     return () => {
// //       resourceList.removeEventListener('scroll', handleResourceScroll);
// //       scheduleGrid.removeEventListener('scroll', handleScheduleScroll);
// //     };
// //   }, [loading, resources.length, showAll, selectedDate]);

// //   const rowHeight = 60 * blockHeight;

// //   // Format time for tooltip
// //   const formatTime = (dateString) => {
// //     if (!dateString) return 'N/A';
// //     const date = new Date(dateString);
// //     return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// //   };

// //   // Format date and time together
// //   const formatDateTime = (dateString) => {
// //     if (!dateString) return 'N/A';
// //     const date = new Date(dateString);
// //     return date.toLocaleString('en-US', { 
// //       month: 'short', 
// //       day: 'numeric', 
// //       hour: 'numeric', 
// //       minute: '2-digit', 
// //       hour12: true 
// //     });
// //   };

// //   // Calculate job status: Done, In Progress, or Not Started
// //   const getJobStatus = (job) => {
// //     if (!job) return 'Not Started';
    
// //     // If job has both actual start and end, it's Done
// //     if (job.actualStart && job.actualEnd) {
// //       return 'Done';
// //     }
    
// //     // If job has actual start but no end, it's In Progress
// //     if (job.actualStart && !job.actualEnd) {
// //       return 'In Progress';
// //     }
    
// //     // Otherwise, it's Not Started
// //     return 'Not Started';
// //   };

// //   // Get status badge color
// //   const getStatusColor = (status) => {
// //     switch (status) {
// //       case 'Done':
// //         return 'bg-green-100 text-green-800 border-green-300';
// //       case 'In Progress':
// //         return 'bg-blue-100 text-blue-800 border-blue-300';
// //       case 'Not Started':
// //         return 'bg-red-100 text-red-800 border-red-300';
// //       default:
// //         return 'bg-gray-100 text-gray-800 border-gray-300';
// //     }
// //   };

// //   // Calculate statistics
// //   const getStatistics = () => {
// //     const filteredRes = getFilteredResources();
// //     const total = filteredRes.length;
// //     let working = 0, late = 0, completed = 0, upcoming = 0, off = 0;
    
// //     filteredRes.forEach(resource => {
// //       const status = getWorkerStatus(resource.id);
// //       if (status.status === 'in-progress') working++;
// //       else if (status.status === 'late') late++;
// //       else if (status.status === 'completed') completed++;
// //       else if (status.status === 'scheduled') upcoming++;
// //       else if (status.status === 'no-job') off++;
// //     });
    
// //     return { total, working, late, completed, upcoming, off };
// //   };

// //   const stats = getStatistics();

// //   if (loading) {
// //     return (
// //       <div className="h-screen flex items-center justify-center bg-white">
// //         <div className="text-center">
// //           <div className="text-lg text-gray-600">Loading schedule data...</div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="h-screen flex items-center justify-center bg-white">
// //         <div className="text-center max-w-md">
// //           <div className="text-lg text-red-600 font-semibold mb-2">Error Loading Data</div>
// //           <div className="text-sm text-gray-600 mb-4">{error}</div>
// //           <button
// //             onClick={loadData}
// //             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
// //           >
// //             Retry
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="h-screen flex flex-col bg-white">
// //       {/* Header */}
// //       <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
// //         <div className="flex items-center gap-4">
// //         </div>

// //         <div className="flex items-center gap-3">
// //           <button
// //             onClick={() => navigateMonth(-1)}
// //             className="p-2 hover:bg-gray-100 rounded"
// //           >
// //             <ChevronLeft className="w-5 h-5 text-blue-600" />
// //           </button>
// //           <span className="text-sm font-medium text-blue-600 min-w-[200px] text-center">
// //             {getMonthYearDisplay()}
// //           </span>
// //           <button
// //             onClick={() => navigateMonth(1)}
// //             className="p-2 hover:bg-gray-100 rounded"
// //           >
// //             <ChevronRight className="w-5 h-5 text-blue-600" />
// //           </button>
// //         </div>

// //         <div className="flex items-center gap-2">
// //           <button
// //             onClick={goToToday}
// //             className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
// //           >
// //             <Clock className="w-4 h-4" />
// //             TODAY
// //           </button>
// //           <button
// //             onClick={goToTomorrow}
// //             className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
// //           >
// //             TOMORROW
// //           </button>
// //         </div>
// //       </div>

// //       {/* Date Selector Strip */}
// //       <div className="border-b border-gray-200 bg-gray-50">
// //         <style>{`
// //           .date-scroll-container::-webkit-scrollbar {
// //             height: 12px;
// //             display: block;
// //           }
// //           .date-scroll-container::-webkit-scrollbar-track {
// //             background: #f7fafc;
// //             border-radius: 6px;
// //           }
// //           .date-scroll-container::-webkit-scrollbar-thumb {
// //             background: #cbd5e0;
// //             border-radius: 6px;
// //             border: 2px solid #f7fafc;
// //           }
// //           .date-scroll-container::-webkit-scrollbar-thumb:hover {
// //             background: #a0aec0;
// //           }
// //         `}</style>
// //         <div 
// //           ref={dateStripScrollRef}
// //           className="date-scroll-container overflow-x-auto"
// //           style={{ 
// //             scrollbarWidth: 'thin',
// //             scrollbarColor: '#cbd5e0 #f7fafc'
// //           }}
// //         >
// //           <div className="flex">
// //             {dates.map((date, index) => (
// //               <button
// //                 key={index}
// //                 ref={isToday(date) ? todayButtonRef : null}
// //                 onClick={() => handleDateClick(date)}
// //                 className={`flex-shrink-0 w-16 text-center py-2 border-r border-gray-200 transition select-none hover:bg-gray-100 ${
// //                   isSelectedDate(date)
// //                     ? 'bg-blue-500 text-white hover:bg-blue-600'
// //                     : isToday(date)
// //                     ? 'bg-blue-100 text-blue-900'
// //                     : 'bg-white'
// //                 }`}
// //               >
// //                 <div className="text-xs font-medium">{getDayName(date)}</div>
// //                 <div className="text-xl font-semibold">{getDateNumber(date)}</div>
// //               </button>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Main Content */}
// //       <div className="flex flex-1 overflow-hidden">
// //         {/* Left Sidebar - Resources */}
// //         <div className="w-64 flex flex-col bg-gray-50 border-r border-gray-200">
// //           {/* Filter Section */}
// //           <div 
// //             className="px-4 bg-white flex-shrink-0 flex items-center justify-between border-b border-gray-200" 
// //             style={{ 
// //               height: `${rowHeight}px`,
// //               minHeight: `${rowHeight}px`,
// //               maxHeight: `${rowHeight}px`,
// //               boxSizing: 'border-box'
// //             }}
// //           >
// //             <div className="flex items-center gap-2">
// //               <span className="text-sm font-medium text-gray-700">Individual Resources</span>
// //               <label className="flex items-center gap-2 text-xs text-gray-600 ml-2">
// //                 <input
// //                   type="checkbox"
// //                   checked={showAll}
// //                   onChange={(e) => setShowAll(e.target.checked)}
// //                   className="rounded"
// //                 />
// //                 Show Schedules
// //               </label>
// //             </div>
// //           </div>

// //           {/* Resource List */}
// //           <div 
// //             ref={resourceListScrollRef}
// //             className="flex-1 overflow-y-auto"
// //             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
// //           >
// //             <style>{`
// //               div::-webkit-scrollbar {
// //                 display: none;
// //               }
// //             `}</style>
// //             {getFilteredResources().map((resource) => {
// //               return (
// //                 <div
// //                   key={resource.id}
// //                   className="flex items-center px-4 hover:bg-gray-50 cursor-pointer bg-white"
// //                   style={{ 
// //                     height: `${rowHeight}px`, 
// //                     minHeight: `${rowHeight}px`,
// //                     maxHeight: `${rowHeight}px`,
// //                     boxSizing: 'border-box',
// //                     borderBottom: '1px solid #e5e7eb'
// //                   }}
// //                 >
// //                   {/* Worker Info */}
// //                   <span className="flex items-center text-sm font-semibold text-gray-900 flex-1 min-w-0">
// //                     <span className="truncate">{resource.name}</span>

// //                     {hasLateConditions(resource.id) && (
// //                       <AlertTriangle
// //                         className="w-5 h-5 text-red-500 ml-auto animate-pulse"
// //                         aria-hidden="true"
// //                         style={{ animationDuration: "1.5s" }}
// //                       />
// //                     )}
// //                   </span>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         </div>

// //         {/* Schedule Grid */}
// //         <div className="flex-1 flex flex-col overflow-hidden">
// //           {/* Time Header */}
// //           <div 
// //             className="bg-gray-50 relative flex-shrink-0"
// //             style={{ 
// //               height: `${rowHeight}px`, 
// //               minHeight: `${rowHeight}px`,
// //               maxHeight: `${rowHeight}px`,
// //               boxSizing: 'border-box',
// //               borderBottom: '1px solid #e5e7eb'
// //             }}
// //           >
// //             <div className="flex text-xs text-gray-500 relative h-full items-center">
// //               {timeSlots.map((hour, hourIdx) => (
// //                 <div
// //                   key={hourIdx}
// //                   className="flex-1 text-center border-r border-gray-200"
// //                 >
// //                   {hour % 2 === 0 && formatHour(hour)}
// //                 </div>
// //               ))}
// //               {(() => {
// //                 const currentTimePos = getCurrentTimePosition();
// //                 if (currentTimePos === null) return null;
// //                 return (
// //                   <div
// //                     className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
// //                     style={{ left: `${currentTimePos}%` }}
// //                   />
// //                 );
// //               })()}
// //             </div>
// //           </div>

// //           {/* Resource Rows */}
// //           <div 
// //             ref={scheduleGridScrollRef}
// //             className="overflow-y-auto overflow-x-hidden"
// //           >
// //             {getFilteredResources().map((resource) => (
// //               <div 
// //                 key={resource.id} 
// //                 className="bg-white"
// //                 style={{ 
// //                   height: `${rowHeight}px`, 
// //                   minHeight: `${rowHeight}px`,
// //                   maxHeight: `${rowHeight}px`,
// //                   boxSizing: 'border-box',
// //                   borderBottom: '1px solid #e5e7eb'
// //                 }}
// //               >
// //                 <div className="relative h-full w-full">
// //                   {/* Time Grid Lines */}
// //                   <div className="absolute inset-0 flex">
// //                     {timeSlots.map((hour, hourIdx) => (
// //                       <div
// //                         key={hourIdx}
// //                         className="flex-1 border-r border-gray-100"
// //                       />
// //                     ))}
// //                   </div>

// //                   {/* Current Time Indicator */}
// //                   {(() => {
// //                     const currentTimePos = getCurrentTimePosition();
// //                     if (currentTimePos === null) return null;
// //                     return (
// //                       <div
// //                         className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
// //                         style={{ left: `${currentTimePos}%` }}
// //                       />
// //                     );
// //                   })()}

// //                   {/* Scheduled Jobs */}
// //                   {getJobsForResourceOnSelectedDate(resource.id).map((job) => {
// //                     const now = new Date();
// //                     const currentHour = now.getHours() + now.getMinutes() / 60;
                    
// //                     // Calculate actual progress
// //                     let actualStartHour = null;
// //                     let actualEndHour = null;
// //                     let isLate = false;
                    
// //                     if (job.actualStart) {
// //                       const actualStartDate = new Date(job.actualStart);
// //                       actualStartHour = actualStartDate.getHours() + actualStartDate.getMinutes() / 60;
// //                     }
                    
// //                     if (job.actualEnd) {
// //                       const actualEndDate = new Date(job.actualEnd);
// //                       actualEndHour = actualEndDate.getHours() + actualEndDate.getMinutes() / 60;
// //                     }
                    
// //                     // Check if late (should have started but hasn't)
// //                     if (!job.actualStart && isToday(selectedDate) && currentHour > job.startHour + 0.25) {
// //                       isLate = true;
// //                     }
                    
// //                     // Determine colors
// //                     const baseColor = job.color;
// //                     const lightColor = job.color + '30'; // Light for scheduled
// //                     const darkColor = job.color; // Dark for actual
// //                     const lateBorder = '#ef4444'; // Red border for late
                    
// //                     return (
// //                       <div
// //                         onClick={() => setSelectedJob(job)}
// //                         key={job.id}
// //                         className="absolute top-1 bottom-1"
// //                         style={{
// //                           left: `${calculateJobPosition(job.startHour)}%`,
// //                           width: `${calculateJobWidth(job.duration)}%`,
// //                         }}
// //                       >
// //                         {/* Scheduled time bar (project color with red border if late) */}
// //                         <div
// //                           className={`absolute inset-0 rounded px-2 py-1 text-xs font-medium overflow-hidden border-2 ${isLate ? 'animate-pulse' : ''}`}
// //                           style={{
// //                             backgroundColor: lightColor,
// //                             borderColor: isLate ? lateBorder : darkColor,
// //                             borderStyle: isLate ? 'dashed' : 'solid',
// //                             color: '#000',
// //                             animationDuration: isLate ? '1.5s' : undefined
// //                           }}
// //                         >
// //                           <div className="font-semibold truncate relative z-10">{job.title}</div>
// //                         </div>
                        
// //                         {/* Actual time worked bar (dark color) - overlays but keeps text visible */}
// //                         {actualStartHour !== null && (
// //                           <>
// //                             <div
// //                               className="absolute top-0 bottom-0 rounded shadow-sm"
// //                               style={{
// //                                 backgroundColor: darkColor,
// //                                 opacity: 0.7,
// //                                 left: `${Math.max(0, ((actualStartHour - job.startHour) / job.duration) * 100)}%`,
// //                                 width: actualEndHour !== null 
// //                                   ? `${((actualEndHour - actualStartHour) / job.duration) * 100}%`
// //                                   : `${((currentHour - actualStartHour) / job.duration) * 100}%`,
// //                                 minWidth: '3px',
// //                                 pointerEvents: 'none'
// //                               }}
// //                             />
                            
// //                             {/* Subtle pulse for in-progress work */}
// //                             {!job.actualEnd && isToday(selectedDate) && (
// //                               <div
// //                                 className="absolute top-0 bottom-0 animate-pulse"
// //                                 style={{
// //                                   backgroundColor: darkColor,
// //                                   opacity: 0.2,
// //                                   left: `${Math.max(0, ((actualStartHour - job.startHour) / job.duration) * 100)}%`,
// //                                   width: `${((currentHour - actualStartHour) / job.duration) * 100}%`,
// //                                   pointerEvents: 'none',
// //                                   animationDuration: '2s'
// //                                 }}
// //                               />
// //                             )}
// //                           </>
// //                         )}
// //                       </div>
// //                     );
// //                   })}
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         {/* RIGHT INFO PANEL - Only show when a schedule is clicked */}
// //         {selectedJob && (() => {
// //           const worker = resources.find(resource => resource.id === selectedJob.resourceId);
// //           const jobStatus = getJobStatus(selectedJob);
// //           const projectName = selectedJob.title.replace(/^\(\d+\.\d+H\)\s/, '');
// //           const lateReason = getJobLateReason(selectedJob);
          
// //           return (
// //             <div className="w-96 border-l border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col">
// //               {/* Header */}
// //               <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex-shrink-0">
// //                 <div className="flex items-start justify-between mb-3">
// //                   <h2 className="text-xl font-bold">Job Details</h2>
// //                   <button
// //                     onClick={() => setSelectedJob(null)}
// //                     className="text-white hover:text-gray-200 transition-colors"
// //                     aria-label="Close"
// //                   >
// //                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
// //                     </svg>
// //                   </button>
// //                 </div>
// //                 <div className="flex items-center gap-2 flex-wrap">
// //                   <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(jobStatus)}`}>
// //                     {jobStatus}
// //                   </div>
// //                   {lateReason && (
// //                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
// //                       <AlertTriangle className="w-4 h-4" />
// //                       <span>{lateReason}</span>
// //                     </div>
// //                   )}
// //                 </div>
// //               </div>

// //               {/* Content */}
// //               <div className="flex-1 overflow-y-auto p-5 space-y-6">
// //                 {/* Project Information */}
// //                 <div className="border-b border-gray-200 pb-4">
// //                   <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project</h3>
// //                   <div className="space-y-2">
// //                     <div>
// //                       <p className="text-lg font-semibold text-gray-900">{projectName}</p>
// //                     </div>
// //                     {selectedJob.subtitle && (
// //                       <div>
// //                         <p className="text-sm text-gray-600 leading-relaxed">{selectedJob.subtitle}</p>
// //                       </div>
// //                     )}
// //                     <div className="pt-2">
// //                       <button 
// //                         onClick={() => window.open(`/projects/${selectedJob.projectId}`, '_blank')}
// //                         className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
// //                       >
// //                         View Project Details
// //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
// //                         </svg>
// //                       </button>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 {/* Worker Information */}
// //                 <div className="border-b border-gray-200 pb-4">
// //                   <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Worker</h3>
// //                   <div className="space-y-2">
// //                     <div>
// //                       <p className="text-base font-medium text-gray-900">{worker?.name || 'Not Assigned'}</p>
// //                       {worker?.position && (
// //                         <p className="text-sm text-gray-600">{worker.position}</p>
// //                       )}
// //                     </div>
// //                     {worker?.phone && (
// //                       <div className="flex items-center gap-2 text-sm text-gray-600">
// //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
// //                         </svg>
// //                         <a href={`tel:${worker.phone}`} className="hover:text-blue-600">{worker.phone}</a>
// //                       </div>
// //                     )}
// //                     {worker?.email && (
// //                       <div className="flex items-center gap-2 text-sm text-gray-600">
// //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
// //                         </svg>
// //                         <a href={`mailto:${worker.email}`} className="hover:text-blue-600">{worker.email}</a>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>

// //                 {/* Schedule Information */}
// //                 <div className="border-b border-gray-200 pb-4">
// //                   <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Schedule</h3>
// //                   <div className="space-y-3">
// //                     <div>
// //                       <p className="text-xs text-gray-500 mb-1">Scheduled Time</p>
// //                       <div className="flex items-center gap-2">
// //                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                         </svg>
// //                         <div>
// //                           <p className="text-sm font-medium text-gray-900">
// //                             {formatDateTime(selectedJob.scheduleStart)}
// //                           </p>
// //                           {selectedJob.scheduleEnd && (
// //                             <p className="text-sm text-gray-600">
// //                               to {formatDateTime(selectedJob.scheduleEnd)}
// //                             </p>
// //                           )}
// //                         </div>
// //                       </div>
// //                     </div>
// //                     {(selectedJob.actualStart || selectedJob.actualEnd) && (
// //                       <div>
// //                         <p className="text-xs text-gray-500 mb-1">Actual Time</p>
// //                         <div className="flex items-center gap-2">
// //                           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                           </svg>
// //                           <div>
// //                             {selectedJob.actualStart ? (
// //                               <p className="text-sm font-medium text-gray-900">
// //                                 {formatDateTime(selectedJob.actualStart)}
// //                               </p>
// //                             ) : (
// //                               <p className="text-sm text-gray-400 italic">Not started</p>
// //                             )}
// //                             {selectedJob.actualEnd ? (
// //                               <p className="text-sm text-gray-600">
// //                                 to {formatDateTime(selectedJob.actualEnd)}
// //                               </p>
// //                             ) : selectedJob.actualStart ? (
// //                               <p className="text-sm text-blue-600 font-medium">In Progress</p>
// //                             ) : null}
// //                           </div>
// //                         </div>
// //                       </div>
// //                     )}
// //                     <div className="pt-2">
// //                       <p className="text-xs text-gray-500 mb-1">Duration</p>
// //                       <p className="text-sm font-medium text-gray-900">{selectedJob.duration.toFixed(1)} hours</p>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           );
// //         })()}
// //       </div>
// //     </div>
// //   );
// // };

// // export default CentraliseView;




// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { 
//   ChevronLeft, ChevronRight, Clock, AlertTriangle, Phone, Mail, 
//   MapPin, ExternalLink, X, Search, Filter, 
//   Users, BrainCircuit, Download, 
//   ShieldCheck, BarChart3, RotateCcw
// } from 'lucide-react';
// import { fetchWorkers, fetchJobs, fetchProjects } from '../utils/apiUtils';
// import { GoogleGenAI, Type } from "@google/genai";

// const CentraliseView = () => {
//   const [blockHeight] = useState(1);
//   const todayConst = useMemo(() => new Date(), []);
//   const [currentMonth, setCurrentMonth] = useState(todayConst);
//   const [selectedDate, setSelectedDate] = useState(todayConst);
//   const [showAll, setShowAll] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [projectFilter, setProjectFilter] = useState('all');
  
//   const [resources, setResources] = useState([]);
//   const [scheduledJobs, setScheduledJobs] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   const [aiInsights, setAiInsights] = useState([]);
//   const [isAiLoading, setIsAiLoading] = useState(false);
//   const [showAiPanel, setShowAiPanel] = useState(false);

//   const resourceListScrollRef = useRef(null);
//   const scheduleGridScrollRef = useRef(null);
//   const dateStripScrollRef = useRef(null);
//   const todayButtonRef = useRef(null);
//   const isScrollingRef = useRef(false);
  
//   const [selectedJob, setSelectedJob] = useState(null);

//   const calculateDuration = (start, end) => {
//     if (!start || !end) return 0;
//     return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60); 
//   };

//   const getProjectColor = (projectId) => {
//     const palette = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f43f5e', '#22c55e'];
//     return palette[projectId % palette.length];
//   };

//   const loadData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const [workersData, jobsData, projectsData] = await Promise.all([
//         fetchWorkers(), fetchJobs(), fetchProjects()
//       ]);
//       setProjects(projectsData);
//       const projectsMap = new Map(projectsData.map((p) => [p.id, p]));

//       const transformedResources = workersData.map((worker) => {
//         const workerJobs = jobsData.filter((job) => job.worker_id === worker.id);
//         const totalHours = workerJobs.reduce((sum, job) => sum + calculateDuration(job.schedule_start, job.schedule_end), 0);
//         return { ...worker, hours: totalHours };
//       });
//       setResources(transformedResources);

//       const rawTransformed = jobsData
//         .filter((job) => job.schedule_start && job.schedule_end)
//         .map((job) => {
//           const project = projectsMap.get(job.project_id);
//           const startDatetime = job.schedule_start;
//           const duration = calculateDuration(startDatetime, job.schedule_end);
//           if (duration <= 0) return null;
//           const jobDate = new Date(startDatetime);
//           if (isNaN(jobDate.getTime())) return null;

//           return {
//             id: job.id, resourceId: job.worker_id, projectId: job.project_id,
//             title: `(${duration.toFixed(1)}H) ${project?.name || 'Project'}`,
//             subtitle: project?.description,
//             startHour: new Date(startDatetime).getHours() + new Date(startDatetime).getMinutes() / 60,
//             duration, date: jobDate, color: getProjectColor(job.project_id),
//             type: 'job', scheduledStart: job.schedule_start, scheduledEnd: job.schedule_end,
//             actualStart: job.actual_start || null, actualEnd: job.actual_end || null,
//             status: job.status, is_flag: job.is_flag || false, flag_reason: job.flag_reason || null
//           };
//         })
//         .filter((j) => j !== null);

//       const withConflicts = rawTransformed.map(job => {
//         const hasConflict = rawTransformed.some(other => 
//           other.id !== job.id && 
//           other.resourceId === job.resourceId && 
//           new Date(other.scheduledStart) < new Date(job.scheduledEnd) && 
//           new Date(other.scheduledEnd) > new Date(job.scheduledStart)
//         );
//         return { ...job, hasConflict };
//       });

//       setScheduledJobs(withConflicts);
//     } catch (err) {
//       setError(err?.message || 'Failed to load data.');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { loadData(); }, [loadData]);

//   const dates = useMemo(() => {
//     const dArr = [];
//     const year = currentMonth.getFullYear();
//     const month = currentMonth.getMonth();
//     const lastDay = new Date(year, month + 1, 0);
//     for (let day = 1; day <= lastDay.getDate(); day++) dArr.push(new Date(year, month, day));
//     return dArr;
//   }, [currentMonth]);

//   const centerToday = useCallback((smooth = true) => {
//     const container = dateStripScrollRef.current;
//     const todayBtn = todayButtonRef.current;
//     if (container && todayBtn) {
//       const containerWidth = container.clientWidth;
//       const btnWidth = todayBtn.clientWidth;
//       const btnLeft = todayBtn.offsetLeft;
//       const scrollPos = btnLeft - (containerWidth / 2) + (btnWidth / 2);
//       container.scrollTo({ 
//         left: scrollPos, 
//         behavior: smooth ? 'smooth' : 'auto' 
//       });
//     }
//   }, []);

//   useEffect(() => {
//     if (!loading && resources.length > 0) {
//       const timer = setTimeout(() => centerToday(true), 300);
//       return () => clearTimeout(timer);
//     }
//   }, [loading, currentMonth, resources.length, centerToday]);

//   const generateAIInsights = async () => {
//     setIsAiLoading(true);
//     setShowAiPanel(true);
//     try {
//       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
//       const dailyJobs = scheduledJobs.filter(j => isSameDay(j.date, selectedDate));
//       const prompt = `Analyze this resource schedule: ${JSON.stringify(dailyJobs)}. Focus on scheduling conflicts, utilization, and attendance. Return 3 actionable insights in JSON format. Schema: [{type: 'optimization'|'warning'|'positive', message: string, impact: string}]`;

//       const response = await ai.models.generateContent({
//         model: 'gemini-3-flash-preview',
//         contents: prompt,
//         config: { 
//           responseMimeType: 'application/json',
//           responseSchema: {
//             type: Type.ARRAY,
//             items: {
//               type: Type.OBJECT,
//               properties: {
//                 type: { type: Type.STRING },
//                 message: { type: Type.STRING },
//                 impact: { type: Type.STRING }
//               }
//             }
//           }
//         }
//       });
      
//       const insights = JSON.parse(response.text || '[]');
//       setAiInsights(insights);
//     } catch (err) {
//       setAiInsights([{ type: 'warning', message: 'Insight generator is analyzing site patterns.', impact: 'System Active' }]);
//     } finally {
//       setIsAiLoading(false);
//     }
//   };

//   const isToday = (date) => date.toDateString() === todayConst.toDateString();
//   const isSameDay = (date1, date2) => date1.toDateString() === date2.toDateString();
//   const isSelectedDate = (date) => isSameDay(date, selectedDate);

//   const getFilteredResources = () => {
//     let filtered = resources;
//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || (r.position && r.position.toLowerCase().includes(q)));
//     }
//     if (showAll) {
//       const workersWithJobs = new Set(scheduledJobs.filter(job => isSameDay(job.date, selectedDate)).map(j => j.resourceId));
//       filtered = filtered.filter(r => workersWithJobs.has(r.id));
//     }
//     if (projectFilter !== 'all') {
//       const workersInProject = new Set(scheduledJobs.filter(job => isSameDay(job.date, selectedDate) && job.projectId === projectFilter).map(j => j.resourceId));
//       filtered = filtered.filter(r => workersInProject.has(r.id));
//     }
//     return filtered;
//   };

//   const stats = useMemo(() => {
//     const jobsToday = scheduledJobs.filter(j => isSameDay(j.date, selectedDate));
//     const activeWorkers = new Set(jobsToday.filter(j => j.status === 'in-progress' || j.actualStart).map(j => j.resourceId)).size;
//     const totalHours = jobsToday.reduce((acc, j) => acc + j.duration, 0);
//     const capacityHours = resources.length * 8; 
//     const utilization = resources.length > 0 ? Math.min(100, (totalHours / capacityHours) * 100) : 0;
//     const flags = jobsToday.filter(j => j.is_flag || j.hasConflict).length;
//     return { activeWorkers, totalWorkers: resources.length, utilization, flags };
//   }, [scheduledJobs, selectedDate, resources]);

//   const getCurrentTimePosition = () => {
//     if (!isToday(selectedDate)) return null;
//     const now = new Date();
//     return ((now.getHours() + now.getMinutes() / 60) / 24) * 100;
//   };

//   useEffect(() => {
//     const resourceList = resourceListScrollRef.current;
//     const scheduleGrid = scheduleGridScrollRef.current;
//     if (!resourceList || !scheduleGrid) return;
//     const handleR = () => { if (!isScrollingRef.current) { isScrollingRef.current = true; scheduleGrid.scrollTop = resourceList.scrollTop; requestAnimationFrame(() => isScrollingRef.current = false); } };
//     const handleS = () => { if (!isScrollingRef.current) { isScrollingRef.current = true; resourceList.scrollTop = scheduleGrid.scrollTop; requestAnimationFrame(() => isScrollingRef.current = false); } };
//     resourceList.addEventListener('scroll', handleR);
//     scheduleGrid.addEventListener('scroll', handleS);
//     return () => { resourceList.removeEventListener('scroll', handleR); scheduleGrid.removeEventListener('scroll', handleS); };
//   }, [loading, resources.length, showAll]);

//   const handleGoToToday = () => {
//     setSelectedDate(todayConst);
//     setCurrentMonth(todayConst);
//     setTimeout(() => centerToday(true), 100);
//   };

//   if (loading) return (
//     <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-6">
//       <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//       <p className="font-black uppercase tracking-[0.4em] text-xs text-blue-400">Loading Core</p>
//     </div>
//   );

//   return (
//     <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans selection:bg-blue-100">
//       {/* Header */}
//       <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between shadow-2xl z-[60] border-b border-white/5">
//         <div className="flex items-center gap-10">
//           <div className="flex items-center gap-4">
//             <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-xl">
//               <ShieldCheck className="w-7 h-7 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-black uppercase tracking-tight leading-none">Scheduler</h1>
//               <span className="text-[9px] font-black text-blue-400 tracking-[0.2em] uppercase">Enterprise</span>
//             </div>
//           </div>
//           <div className="h-10 w-[1px] bg-slate-700/50" />
//           <div className="flex gap-12">
//             <div className="flex flex-col">
//               <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Personnel</span>
//               <div className="flex items-center gap-2">
//                 <Users className="w-4 h-4 text-blue-400" />
//                 <span className="text-sm font-black">{stats.activeWorkers} / {stats.totalWorkers}</span>
//               </div>
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Capacity</span>
//               <div className="flex items-center gap-2">
//                 <BarChart3 className="w-4 h-4 text-emerald-400" />
//                 <span className="text-sm font-black">{stats.utilization.toFixed(0)}%</span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//           <button onClick={generateAIInsights} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 transition active:scale-95">
//             <BrainCircuit className="w-4 h-4" /> AI AUDIT
//           </button>
//           <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl">
//             <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
//             <span className="px-4 text-[10px] font-black uppercase">{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
//             <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
//           </div>
//         </div>
//       </div>

//       {/* Date Scroller */}
//       <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-50">
//         <div className="flex items-center gap-4 flex-1">
//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//             <input type="text" placeholder="Filter resource pool..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
//           </div>
//           <select className="px-4 py-2 bg-slate-50 border rounded-xl text-sm font-bold outline-none" value={projectFilter} onChange={e => setProjectFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
//             <option value="all">Global Sites</option>
//             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//           </select>
//         </div>
//         <div className="flex items-center gap-2">
//            <button onClick={handleGoToToday} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition border border-blue-100">Today</button>
//            <button onClick={() => centerToday(true)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="Center Today"><RotateCcw className="w-5 h-5" /></button>
//         </div>
//       </div>

//       <div ref={dateStripScrollRef} className="flex bg-white border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
//         {dates.map((d, i) => (
//           <button
//             key={i}
//             ref={isToday(d) ? todayButtonRef : null}
//             onClick={() => setSelectedDate(d)}
//             className={`flex-shrink-0 w-16 py-4 border-r border-slate-100 transition-all ${
//               isSelectedDate(d) ? 'bg-blue-600 text-white shadow-inner' : isToday(d) ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white text-slate-500'
//             }`}
//           >
//             <div className="text-[10px] font-black uppercase opacity-60 mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
//             <div className="text-xl font-black">{d.getDate()}</div>
//           </button>
//         ))}
//       </div>

//       <div className="flex flex-1 overflow-hidden relative">
//         <div className="w-64 flex flex-col bg-white border-r border-slate-200 z-30">
//            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
//               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team</span>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded text-blue-600" />
//                 <span className="text-[10px] font-black text-slate-500 uppercase">On-Shift</span>
//               </label>
//            </div>
//            <div ref={resourceListScrollRef} className="flex-1 overflow-y-auto no-scrollbar">
//               {getFilteredResources().map(r => {
//                 const dayJobs = scheduledJobs.filter(j => j.resourceId === r.id && isSameDay(j.date, selectedDate));
//                 return (
//                   <div key={r.id} className="px-6 py-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between">
//                     <div className="min-w-0">
//                       <p className="text-sm font-black text-slate-900 truncate">{r.name}</p>
//                       <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{r.position}</p>
//                     </div>
//                     {dayJobs.some(j => j.hasConflict) && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
//                   </div>
//                 );
//               })}
//            </div>
//         </div>

//         <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/20">
//           <div className="h-14 bg-white border-b border-slate-200 flex">
//             {Array.from({ length: 24 }).map((_, i) => (
//               <div key={i} className="flex-1 border-r border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">
//                 {i % 4 === 0 ? (i > 12 ? `${i-12}P` : i === 0 ? '12A' : i === 12 ? '12P' : `${i}A`) : '•'}
//               </div>
//             ))}
//             {getCurrentTimePosition() && (
//               <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none" style={{ left: `${getCurrentTimePosition()}%` }}>
//                 <div className="w-3 h-3 rounded-full bg-red-500 -ml-[5.5px] -mt-1.5 border-2 border-white shadow-lg" />
//               </div>
//             )}
//           </div>

//           <div ref={scheduleGridScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-white">
//             {getFilteredResources().map(r => (
//               <div key={r.id} className="h-20 border-b border-slate-50 relative hover:bg-slate-50/30">
//                 <div className="absolute inset-0 flex pointer-events-none">
//                   {Array.from({ length: 24 }).map((_, i) => <div key={i} className="flex-1 border-r border-slate-100/30 last:border-0" />)}
//                 </div>
//                 {scheduledJobs.filter(j => j.resourceId === r.id && isSameDay(j.date, selectedDate)).map(job => (
//                   <div
//                     key={job.id}
//                     onClick={() => setSelectedJob(job)}
//                     className={`absolute top-2 bottom-2 rounded-xl cursor-pointer p-3 transition-all border-l-4 ${job.hasConflict ? 'border-red-500 ring-2 ring-red-500/20 animate-pulse' : ''}`}
//                     style={{
//                       left: `${(job.startHour/24)*100}%`,
//                       width: `${(job.duration/24)*100}%`,
//                       backgroundColor: `${job.color}15`,
//                       borderColor: job.hasConflict ? '#ef4444' : job.color,
//                     }}
//                   >
//                     <div className="flex flex-col h-full overflow-hidden">
//                        <span className="text-[10px] font-black uppercase truncate" style={{ color: job.hasConflict ? '#ef4444' : job.color }}>{job.title}</span>
//                        {job.actualStart && (
//                           <div className="h-1 w-full bg-slate-200 rounded-full mt-auto overflow-hidden">
//                              <div className={`h-full ${job.actualEnd ? 'bg-emerald-500' : 'bg-blue-600 animate-shimmer'} transition-all`} style={{ width: job.actualEnd ? '100%' : '65%' }} />
//                           </div>
//                        )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* AI Insight Panel */}
//         {showAiPanel && (
//           <div className="absolute inset-y-0 right-0 w-80 bg-slate-900 border-l border-white/10 shadow-2xl z-[70] flex flex-col p-8 text-white animate-in slide-in-from-right">
//             <div className="flex items-center justify-between mb-8">
//               <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-indigo-400" /> Auditor</h3>
//               <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
//             </div>
//             {isAiLoading ? (
//               <div className="flex-1 flex flex-col items-center justify-center gap-4">
//                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
//                  <p className="text-[10px] uppercase font-black text-slate-500">Scanning metadata...</p>
//               </div>
//             ) : (
//               <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
//                 {aiInsights.map((ins, i) => (
//                   <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/5">
//                     <div className="flex items-center gap-2 mb-3">
//                        <div className={`w-2 h-2 rounded-full ${ins.type === 'warning' ? 'bg-red-500' : 'bg-emerald-500'}`} />
//                        <span className="text-[9px] font-black uppercase text-slate-500">{ins.type}</span>
//                     </div>
//                     <p className="text-xs font-bold text-slate-200 mb-4">{ins.message}</p>
//                     <div className="text-[10px] font-black text-indigo-300 uppercase">Impact: {ins.impact}</div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Detail Panel */}
//         {selectedJob && (
//           <div className="absolute inset-y-0 right-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
//             <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
//               <h2 className="text-xl font-black uppercase tracking-tighter">Shift Dossier</h2>
//               <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5" /></button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
//               {selectedJob.hasConflict && (
//                 <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4 text-red-800">
//                   <AlertTriangle className="w-6 h-6 flex-shrink-0" />
//                   <div className="text-xs font-bold leading-relaxed">Multiple site assignments detected for this resource. Correction required.</div>
//                 </div>
//               )}
//               <section>
//                 <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Site Data</h3>
//                 <div className="bg-slate-50 p-6 rounded-2xl border">
//                   <h4 className="text-xl font-black uppercase mb-2">{selectedJob.title.split(') ')[1]}</h4>
//                   <p className="text-sm text-slate-600 font-medium">{selectedJob.subtitle || "Enterprise operation."}</p>
//                 </div>
//               </section>
//               <section>
//                 <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Resource</h3>
//                 {(() => {
//                   const worker = resources.find(r => r.id === selectedJob.resourceId);
//                   return (
//                     <div className="bg-white border rounded-2xl p-6 shadow-sm">
//                       <div className="flex items-center gap-4 mb-6">
//                         <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-lg border">
//                           {worker?.name.charAt(0)}
//                         </div>
//                         <div>
//                           <p className="text-base font-black text-slate-900">{worker?.name}</p>
//                           <span className="text-[10px] font-black text-blue-600 uppercase">{worker?.position}</span>
//                         </div>
//                       </div>
//                       <div className="space-y-3">
//                         <div className="flex items-center gap-3 text-sm text-slate-600 font-bold"><Phone className="w-4 h-4" /> {worker?.phone || "N/A"}</div>
//                         <div className="flex items-center gap-3 text-sm text-slate-600 font-bold"><Mail className="w-4 h-4" /> {worker?.email || "N/A"}</div>
//                       </div>
//                     </div>
//                   );
//                 })()}
//               </section>
//               <section>
//                 <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Time Logs</h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-slate-50 p-4 rounded-xl border">
//                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Start</p>
//                     <p className="text-sm font-black text-slate-900">{new Date(selectedJob.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
//                   </div>
//                   <div className={`p-4 rounded-xl border ${selectedJob.actualStart ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50'}`}>
//                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Clock-In</p>
//                     <p className={`text-sm font-black ${selectedJob.actualStart ? 'text-emerald-700' : 'text-slate-400 italic'}`}>
//                       {selectedJob.actualStart ? new Date(selectedJob.actualStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "No Data"}
//                     </p>
//                   </div>
//                 </div>
//               </section>
//             </div>
//             <div className="p-8 border-t bg-slate-50/50 flex gap-3">
//               <button className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-[10px] rounded-xl hover:bg-slate-800 transition">Adjust Shift</button>
//               <button className="p-4 border bg-white rounded-xl hover:bg-slate-50 transition"><ExternalLink className="w-5 h-5 text-slate-500" /></button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CentraliseView;


