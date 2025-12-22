/**
 * Format a date to a localized date string, or return 'TBD' if date is undefined
 */
export const formatDate = (date) => {
  return date ? date.toLocaleDateString() : 'TBD';
};

/**
 * Format a date-time string to a readable format
 */
export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) {
    return "N/A";
  }
  
  try {
    const date = new Date(dateTimeString);
    
    if (isNaN(date.getTime())) {
      return dateTimeString;
    }
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTimeString;
  }
};

/**
 * Check if a date is today
 */
export const isToday = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
};

/**
 * Get today's date with time set to midnight
 */
export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Check if a project matches time filter criteria
 */
export const checkTimeFilter = (project, filter) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  switch (filter) {
    case 'THIS_MONTH':
      return (project.scheduledStart.getMonth() === currentMonth && project.scheduledStart.getFullYear() === currentYear) ||
             (project.scheduledEnd.getMonth() === currentMonth && project.scheduledEnd.getFullYear() === currentYear);
    case 'NEXT_MONTH':
      const nextMonth = (currentMonth + 1) % 12;
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      return (project.scheduledStart.getMonth() === nextMonth && project.scheduledStart.getFullYear() === nextMonthYear) ||
             (project.scheduledEnd.getMonth() === nextMonth && project.scheduledEnd.getFullYear() === nextMonthYear);
    case 'OVERDUE':
      return project.scheduledEnd < now && project.progress < 100;
    default:
      return true;
  }
};

/**
 * Filter logs for today
 */
export const filterTodaysLogs = (logs) => {
  const today = getToday();
  return logs.filter(log => {
    const logDate = new Date(log.scheduleStart);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });
};

/**
 * Filter schedules for next N days
 */
export const filterUpcomingSchedules = (schedules, days = 7) => {
  const today = getToday();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  return schedules.filter(schedule => {
    if (!schedule.Date) return false;
    const scheduleDate = new Date(schedule.Date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate >= today && scheduleDate <= futureDate;
  });
};
