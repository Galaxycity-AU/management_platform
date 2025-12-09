/**
 * API base URL configuration
 */
export const API_BASE_URL = 'http://localhost:3001/api/simpro';

/**
 * Make an API call to the SimPRO backend
 */
export async function callAPI(endpoint: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  
  return data;
}

/**
 * Debug logging utility with timestamp
 */
export const debugLog = (message: string, data?: any): string => {
  const timestamp = new Date().toISOString();
  const logMessage = `[DEBUG ${timestamp}] ${message}`;
  console.log(logMessage, data !== undefined ? data : '');
  return logMessage;
};

