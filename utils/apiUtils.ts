/**
 * API base URL configuration
 */
export const API_BASE_URL = 'http://localhost:3001/api/simpro';
export const DB_API_BASE_URL = 'http://localhost:3001';

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
 * Make an API call to the database backend
 */
export async function callDBAPI(endpoint: string): Promise<any> {
  try {
    console.log(`Fetching from: ${DB_API_BASE_URL}${endpoint}`);
    const response = await fetch(`${DB_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched from ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'data received');
    return data;
  } catch (error: any) {
    console.error(`Error calling ${endpoint}:`, error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${DB_API_BASE_URL}. Make sure the server is running.`);
    }
    throw error;
  }
}

/**
 * Fetch all workers from database
 */
export async function fetchWorkers(): Promise<any[]> {
  return await callDBAPI('/workers');
}

/**
 * Fetch all jobs from database
 */
export async function fetchJobs(): Promise<any[]> {
  return await callDBAPI('/jobs');
}

/**
 * Fetch all projects from database
 */
export async function fetchProjects(): Promise<any[]> {
  return await callDBAPI('/projects');
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

