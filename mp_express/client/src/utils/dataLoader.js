/**
 * Centralized data loading utility
 * Provides shared functions for fetching and transforming projects, jobs, and workers data
 */
import { fetchProjects, fetchJobs, fetchWorkers } from './apiUtils';
import { LogStatus } from '../types';

/**
 * Safely parse a date value
 * @param {Date|string|null} d - Date value to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const toSafeDate = (d) => {
  if (d == null) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Map job status string to LogStatus enum
 * @param {string} status - Job status string
 * @returns {string} - LogStatus enum value
 */
export const mapJobStatus = (status) => {
  switch (status) {
    case 'schedule': return LogStatus.SCHEDULE;
    case 'active': return LogStatus.ACTIVE;
    case 'approved': return LogStatus.APPROVED;
    case 'rejected': return LogStatus.REJECTED;
    case 'waiting_approval': return LogStatus.WAITING_APPROVAL;
    default: return LogStatus.SCHEDULE;
  }
};

/**
 * Transform raw project data from API
 * @param {Array} projectsData - Raw projects from API
 * @returns {Array} - Transformed projects with safe dates and defaults
 */
export const transformProjects = (projectsData) => {
  return projectsData.map((p) => ({
    ...p,
    deadline: toSafeDate(p.deadline),
    spent: p.spent || 0,
    budget: p.budget || 0,
    progress: p.progress || 0,
  }));
};

/**
 * Transform a job to log format
 * @param {Object} job - Raw job from API
 * @param {Map} workersMap - Map of worker id to worker data
 * @param {Map} projectsMap - Map of project id to project data
 * @param {Object} options - Additional options
 * @param {boolean} options.includeProjectManager - Whether to include project manager info
 * @returns {Object} - Transformed log object
 */
export const transformJobToLog = (job, workersMap, projectsMap, options = {}) => {
  const worker = workersMap.get(job.worker_id);
  const project = projectsMap.get(job.project_id);
  
  const scheduledStart = new Date(job.schedule_start);
  const scheduledEnd = new Date(job.schedule_end);
  const actualStart = job.actual_start ? new Date(job.actual_start) : null;
  const actualEnd = job.actual_end ? new Date(job.actual_end) : null;

  const log = {
    id: String(job.id),
    workerName: worker?.name || 'Unknown Worker',
    role: worker?.position || 'Worker',
    projectId: String(job.project_id),
    projectName: project?.name || 'Unknown Project',
    scheduledStart,
    scheduledEnd,
    actualStart,
    actualEnd,
    originalActualStart: actualStart,
    originalActualEnd: actualEnd,
    status: mapJobStatus(job.status),
    notes: `Job #${job.id}`,
    adjustmentReason: job.modified_start ? 'Job rescheduled' : undefined,
    approvedAt: actualEnd || undefined,
    approvedBy: actualEnd ? 'System' : undefined,
    is_flag: job.is_flag || false,
    flag_reason: job.flag_reason || null
  };

  // Include project manager if requested
  if (options.includeProjectManager && project) {
    const projectsManagerMap = options.projectsManagerMap;
    if (projectsManagerMap) {
      const projectManager = projectsManagerMap.get(project.manager_id);
      log.projectManager = projectManager?.name || 'Unknown Manager';
    }
  }

  return log;
};

/**
 * Transform jobs to logs format
 * @param {Array} jobsData - Raw jobs from API
 * @param {Array} workersData - Raw workers from API  
 * @param {Array} projectData - Transformed projects
 * @param {Object} options - Additional options
 * @param {boolean} options.includeProjectManager - Whether to include project manager info
 * @returns {Array} - Transformed logs
 */
export const transformJobsToLogs = (jobsData, workersData, projectData, options = {}) => {
  const workersMap = new Map(workersData.map((w) => [w.id, w]));
  const projectsMap = new Map(projectData.map((p) => [Number(p.id), p]));
  
  // Create manager map if needed
  let projectsManagerMap = null;
  if (options.includeProjectManager) {
    projectsManagerMap = new Map(projectData.map((p) => [Number(p.manager_id), p]));
  }

  return jobsData
    .filter((job) => {
      const startTime = job.actual_start || job.modified_start || job.schedule_start;
      const endTime = job.actual_end || job.modified_end || job.schedule_end;
      return startTime && endTime;
    })
    .map((job) => transformJobToLog(job, workersMap, projectsMap, {
      ...options,
      projectsManagerMap
    }));
};

/**
 * Load all projects and logs data from the API
 * @param {Object} options - Loading options
 * @param {boolean} options.includeProjectManager - Whether to include project manager info in logs
 * @returns {Promise<{projects: Array, logs: Array, workers: Array, jobs: Array}>}
 */
export const loadProjectsAndLogs = async (options = {}) => {
  const [projectsData, jobsData, workersData] = await Promise.all([
    fetchProjects(),
    fetchJobs(),
    fetchWorkers()
  ]);

  const projects = transformProjects(projectsData);
  const logs = transformJobsToLogs(jobsData, workersData, projects, options);

  return {
    projects,
    logs,
    workers: workersData,
    jobs: jobsData
  };
};

/**
 * Custom hook pattern helper for loading data with state management
 * Returns a loadData function and handles loading/error states
 * @param {Object} options - Options passed to loadProjectsAndLogs
 * @returns {Function} - Async function that returns {projects, logs}
 */
export const createDataLoader = (options = {}) => {
  return async () => {
    return await loadProjectsAndLogs(options);
  };
};

