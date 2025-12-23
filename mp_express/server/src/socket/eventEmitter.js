/**
 * Socket.io event emitter utility
 * Helper functions to emit events from controllers
 */

let io = null;

/**
 * Initialize the event emitter with the Socket.io instance
 * @param {Object} socketIo - The Socket.io server instance
 */
export function initializeEventEmitter(socketIo) {
  io = socketIo;
  console.log('[EventEmitter] Initialized with Socket.io instance');
}

/**
 * Get the Socket.io instance
 * @returns {Object} The Socket.io server instance
 */
export function getIO() {
  if (!io) {
    console.warn('[EventEmitter] Socket.io not initialized');
  }
  return io;
}

/**
 * Emit a job created event
 * @param {Object} job - The created job data
 */
export function emitJobCreated(job) {
  if (!io) return;
  
  const payload = {
    job,
    projectId: job.project_id,
    workerId: job.worker_id,
    timestamp: new Date().toISOString()
  };
  
  io.emit('job:created', payload);
  
  // Also emit to specific project room
  if (job.project_id) {
    io.to(`project:${job.project_id}`).emit('job:created', payload);
  }
  
  console.log(`[EventEmitter] Emitted job:created for job ${job.id}`);
}

/**
 * Emit a job updated event
 * @param {Object} job - The updated job data
 */
export function emitJobUpdated(job) {
  if (!io) return;
  
  const payload = {
    job,
    projectId: job.project_id,
    workerId: job.worker_id,
    timestamp: new Date().toISOString()
  };
  
  io.emit('job:updated', payload);
  
  // Also emit to specific project room
  if (job.project_id) {
    io.to(`project:${job.project_id}`).emit('job:updated', payload);
  }
  
  console.log(`[EventEmitter] Emitted job:updated for job ${job.id}`);
}

/**
 * Emit a job deleted event
 * @param {number|string} jobId - The deleted job ID
 * @param {number|string} projectId - The project ID (optional)
 */
export function emitJobDeleted(jobId, projectId = null) {
  if (!io) return;
  
  const payload = {
    jobId,
    projectId,
    timestamp: new Date().toISOString()
  };
  
  io.emit('job:deleted', payload);
  
  // Also emit to specific project room
  if (projectId) {
    io.to(`project:${projectId}`).emit('job:deleted', payload);
  }
  
  console.log(`[EventEmitter] Emitted job:deleted for job ${jobId}`);
}

/**
 * Emit an approval updated event
 * @param {Object} approval - The updated approval data
 * @param {string} status - The new approval status (approved/rejected)
 */
export function emitApprovalUpdated(approval, status = null) {
  if (!io) return;
  
  const payload = {
    approval,
    jobId: approval.job_id,
    status: status || approval.status,
    timestamp: new Date().toISOString()
  };
  
  io.emit('approval:updated', payload);
  io.to('approvals').emit('approval:updated', payload);
  
  console.log(`[EventEmitter] Emitted approval:updated for approval ${approval.id}`);
}

/**
 * Emit dashboard alerts update
 * @param {Object} alertsData - The alerts data including alerts array and summary
 */
export function emitDashboardAlerts(alertsData) {
  if (!io) return;
  
  const payload = {
    alerts: alertsData.alerts,
    summary: alertsData.summary,
    timestamp: new Date().toISOString()
  };
  
  io.emit('dashboard:alerts', payload);
  io.to('dashboard').emit('dashboard:alerts', payload);
  
  console.log(`[EventEmitter] Emitted dashboard:alerts with ${alertsData.alerts?.length || 0} alerts`);
}

/**
 * Emit stats updated event
 * @param {Object} stats - The updated stats data
 */
export function emitStatsUpdated(stats) {
  if (!io) return;
  
  const payload = {
    stats,
    timestamp: new Date().toISOString()
  };
  
  io.emit('stats:updated', payload);
  io.to('dashboard').emit('stats:updated', payload);
  
  console.log('[EventEmitter] Emitted stats:updated');
}

/**
 * Emit a generic event
 * @param {string} eventName - The event name
 * @param {Object} data - The event data
 * @param {string} room - Optional room to emit to
 */
export function emitEvent(eventName, data, room = null) {
  if (!io) return;
  
  const payload = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  if (room) {
    io.to(room).emit(eventName, payload);
  } else {
    io.emit(eventName, payload);
  }
  
  console.log(`[EventEmitter] Emitted ${eventName}${room ? ` to room ${room}` : ''}`);
}

export default {
  initializeEventEmitter,
  getIO,
  emitJobCreated,
  emitJobUpdated,
  emitJobDeleted,
  emitApprovalUpdated,
  emitDashboardAlerts,
  emitStatsUpdated,
  emitEvent
};

