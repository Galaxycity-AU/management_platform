/**
 * Project Status Enum
 */
export const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on hold',
  DELAYED: 'delayed'
};

/**
 * Log Status Enum
 */
export const LogStatus = {
  SCHEDULE: 'schedule',
  ACTIVE: 'active',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITING_APPROVAL: 'waiting_approval'
};

/**
 * Project Type Definition
 * @typedef {Object} Project
 * @property {number|string} id - Project ID
 * @property {string} name - Project name
 * @property {string} [description] - Project description
 * @property {Date|null} deadline - Project deadline
 * @property {string} status - Project status (from ProjectStatus enum)
 * @property {string} [client] - Client name
 * @property {string} [manager] - Project manager name
 * @property {number} [spent] - Amount spent on project
 * @property {number} [budget] - Project budget
 * @property {number} [progress] - Project progress percentage (0-100)
 * @property {Date} [scheduledStart] - Scheduled start date (for SimPRO projects)
 * @property {Date} [scheduledEnd] - Scheduled end date (for SimPRO projects)
 * @property {Array} [schedules] - Schedule array (for SimPRO projects)
 */

/**
 * WorkerLog Type Definition
 * @typedef {Object} WorkerLog
 * @property {string} id - Log ID
 * @property {string} workerName - Worker's name
 * @property {string} role - Worker's role/position
 * @property {string} projectId - Associated project ID
 * @property {string} projectName - Associated project name
 * @property {Date} scheduledStart - Scheduled start time
 * @property {Date} scheduledEnd - Scheduled end time
 * @property {Date|null} actualStart - Actual start time
 * @property {Date|null} actualEnd - Actual end time
 * @property {Date|null} [originalActualStart] - Original actual start time before adjustment
 * @property {Date|null} [originalActualEnd] - Original actual end time before adjustment
 * @property {string} status - Log status (from LogStatus enum)
 * @property {string} [notes] - Additional notes
 * @property {string} [adjustmentReason] - Reason for time adjustment
 * @property {Date} [approvedAt] - Approval timestamp
 * @property {string} [approvedBy] - Who approved the log
 */

// Export type placeholders for IDE support and JSDoc
// These are not used at runtime but help with type checking in IDEs that support JSDoc
export const Project = {};
export const WorkerLog = {};
