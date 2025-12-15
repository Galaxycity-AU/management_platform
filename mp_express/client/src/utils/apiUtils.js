/**
 * API base URL configuration
 * Uses environment variables with fallback to defaults
 */
const API_PORT = import.meta.env.VITE_API_PORT || 3001;
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost';


// For development, use proxy (relative URLs)
// For production, use full URL from env vars
export const API_BASE_URL = import.meta.env.PROD 
  ? `${import.meta.env.VITE_API_URL || `${API_HOST}:${API_PORT}`}/api/simpro`
  : '/api/simpro';
  
export const DB_API_BASE_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL || `${API_HOST}:${API_PORT}`}/api`
  : '/api'; // Use /api prefix for all API calls

/**
 * Make an API call to the SimPRO backend
 */
export async function callAPI(endpoint) {
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
export async function callDBAPI(endpoint) {
  try {
    console.log(`Fetching from: ${DB_API_BASE_URL}${endpoint}`);
    const response = await fetch(`${DB_API_BASE_URL}/api/${endpoint}`, {
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
  } catch (error) {
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
export async function fetchWorkers() {
  return await callDBAPI('/workers');
}

/**
 * Fetch all jobs from database
 */
export async function fetchJobs() {
  return await callDBAPI('/jobs');
}

/**
 * Fetch all projects from database
 */
export async function fetchProjects() {
  return await callDBAPI('/projects');
}

/**
 * Debug logging utility with timestamp
 */
export const debugLog = (message, data) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[DEBUG ${timestamp}] ${message}`;
  console.log(logMessage, data !== undefined ? data : '');
  return logMessage;
};
