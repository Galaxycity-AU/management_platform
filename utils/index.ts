/**
 * Central export point for all utility functions
 */

// Project utilities
export {
  getStatusColor,
  getStatusColorCard,
  isAtRisk,
  getBudgetPercentage,
  isOverBudget
} from './projectUtils';

// Date utilities
export {
  formatDate,
  formatDateTime,
  isToday,
  getToday,
  checkTimeFilter,
  filterTodaysLogs,
  filterUpcomingSchedules,
  type TimeFilter
} from './dateUtils';

// String utilities
export {
  truncate,
  getFirstNChars,
  truncateClientName
} from './stringUtils';

// API utilities
export {
  API_BASE_URL,
  callAPI,
  debugLog
} from './apiUtils';

// Storage utilities
export {
  STORAGE_KEYS,
  getStoredLogs,
  saveLogs,
  getLastProcessedId,
  saveLastProcessedId
} from './storageUtils';

