import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Menu, Clock, Filter } from 'lucide-react';

const SimproScheduleView = () => {
  const [blockHeight] = useState(1);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAll, setShowAll] = useState(true);
  const dateScrollRef = useRef(null);
  const resourceListScrollRef = useRef(null);
  const scheduleGridScrollRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Sample resources (staff members)
  const resources = [
    { id: 1854, name: 'Abel Van Rinh', hours: 1.5 },
    { id: 1859, name: 'Ash Mohammadi', hours: 10.5 },
    { id: 1860, name: 'Atefeh Halili', hours: 10.5 },
    { id: 1852, name: 'Beau Gray', hours: 2 },
    { id: 1577, name: 'Behrooz Ghaemi', hours: 0.25 },
    { id: 1855, name: 'Boardroom - Avengers', hours: 10.5 },
    { id: 1856, name: 'Boardroom - Batman', hours: 10.5 },
    { id: 1857, name: 'Boardroom - Captain America', hours: 10.5 },
    { id: 1858, name: 'Boardroom - Doctor Strange', hours: 10.5 },
    { id: 1859, name: 'Boardroom - Iron Man', hours: 10.5 },
    { id: 1860, name: 'Boardroom - Thor', hours: 10.5 },
    { id: 1861, name: 'Boardroom - Wolverine', hours: 10.5 },
    { id: 1862, name: 'Boardroom - X-Men', hours: 10.5 },
    { id: 1863, name: 'Boardroom - X-Men 2', hours: 10.5 },
    { id: 1864, name: 'Boardroom - X-Men 3', hours: 10.5 },
    { id: 1865, name: 'Boardroom - X-Men 4', hours: 10.5 },
    { id: 1866, name: 'Boardroom - X-Men 5', hours: 10.5 },
    { id: 1867, name: 'Boardroom - X-Men 6', hours: 10.5 },
    { id: 1868, name: 'Boardroom - X-Men 7', hours: 10.5 },
    { id: 1869, name: 'Boardroom - X-Men 8', hours: 10.5 },
    { id: 1870, name: 'Boardroom - X-Men 9', hours: 10.5 },
    { id: 1871, name: 'Boardroom - X-Men 10', hours: 10.5 },
  ];

  // Sample scheduled jobs
  const scheduledJobs = [
    {
      id: 1,
      resourceId: 1854,
      title: '(9HRS) 7 SPRINGFIELD RD, BORONIA BORONIA',
      startHour: 7,
      duration: 9,
      date: new Date(2025, 11, 4),
      color: '#67e8f9',
      type: 'job'
    },
    {
      id: 2,
      resourceId: 1852,
      title: '(8.5HRS) LOT 1, 40 LIVERPOOL RD, KILSYTH KILSYTH',
      subtitle: 'Travel',
      startHour: 7,
      duration: 8.5,
      date: new Date(2025, 11, 4),
      color: '#818cf8',
      type: 'job'
    },
    {
      id: 3,
      resourceId: 1577,
      title: '(10.75HRS) MELBOURNE BUSINESS PARK TRUGANINA 1300452285',
      subtitle: 'Section 4 RFO Response Pricing Template',
      startHour: 7,
      duration: 10.75,
      date: new Date(2025, 11, 4),
      color: '#67e8f9',
      type: 'job'
    },
    {
      id: 4,
      resourceId: 1855,
      title: '(10HRS) PARADISE',
      startHour: 7,
      duration: 10,
      date: new Date(2025, 11, 9),
      color: '#818cf8',
      type: 'job'
    },
    {
      id: 5,
      resourceId: 1859,
      title: '(8HRS) DOWNTOWN PROJECT',
      startHour: 8,
      duration: 8,
      date: new Date(2025, 11, 9),
      color: '#67e8f9',
      type: 'job'
    }
  ];

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
  }, []);

  const rowHeight = 60 * blockHeight;

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
              <label className="flex items-center gap-2 text-xs text-gray-600 ml-2">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="rounded"
                />
                Show All
              </label>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <Menu className="w-4 h-4" />
            </button>
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
                      <div className="font-semibold truncate">{job.title}</div>
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

export default SimproScheduleView;