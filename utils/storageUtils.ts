/**
 * LocalStorage utility functions for API testing
 */

export const STORAGE_KEYS = {
  LOGS: 'api_testing_logs',
  LAST_PROCESSED_ID: 'api_testing_last_processed_id'
} as const;

/**
 * Get stored logs from localStorage
 */
export const getStoredLogs = (): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading stored logs', error);
    return [];
  }
};

/**
 * Save logs to localStorage
 */
export const saveLogs = (logs: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving logs', error);
  }
};

/**
 * Get last processed ID from localStorage
 */
export const getLastProcessedId = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_PROCESSED_ID);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error('Error reading last processed ID', error);
    return 0;
  }
};

/**
 * Save last processed ID to localStorage
 */
export const saveLastProcessedId = (id: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PROCESSED_ID, id.toString());
  } catch (error) {
    console.error('Error saving last processed ID', error);
  }
};

