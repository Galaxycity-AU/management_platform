
/**
 * Flag Calculator Utility
 * 
 * Centralized logic for calculating job alert flags
 * Used to determine if a job is overdue, late, etc.
 * 
 * Conditions checked:
 * 1. No actual start time when current time > schedule_start (Not Started On Time)
 * 2. No actual end time when current time > schedule_end (Not Ended On Time)
 * 3. Actual start > schedule_start (Started Late)
 */

const THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
const DEBUG = false; // Set to false to disable debug logs

/**
 * Debug logger
 */
function log(jobId, message, data = {}) {
  if (DEBUG) {
    console.log(`[FLAG_CALC] Job ${jobId}: ${message}`, data);
  }
}

/**
 * Calculate alert flags for a job
 * @param {Object} job - Job object with schedule_start, schedule_end, actual_start, actual_end, status
 * @param {Date} now - Current date/time (defaults to now)
 * @returns {Object} { is_flag: boolean, flag_reason: string | null }
 */
export function calculateJobFlags(job, now = new Date()) {
  const {
    id,
    schedule_start,
    schedule_end,
    actual_start,
    actual_end,
    status
  } = job;

  const jobId = id || 'unknown';
  
  log(jobId, 'Starting flag calculation', {
    schedule_start,
    schedule_end,
    actual_start,
    actual_end,
    status
  });

  // Don't show flags for approved or rejected jobs
  if (status === 'approved' || status === 'rejected' || status === 'waiting_approval') {
    log(jobId, `Skipping - status is ${status}`);
    return { is_flag: false, flag_reason: null };
  }

  // Ensure we have scheduled start time
  if (!schedule_start) {
    log(jobId, 'Skipping - no schedule_start');
    return { is_flag: false, flag_reason: null };
  }

  // Parse dates
  const scheduledStart = new Date(schedule_start);
  const scheduledEnd = schedule_end ? new Date(schedule_end) : null;
  const actualStart = actual_start ? new Date(actual_start) : null;
  const actualEnd = actual_end ? new Date(actual_end) : null;
  const currentTime = new Date(now);

  // log(jobId, 'Parsed dates', {
  //   scheduledStart: scheduledStart.toISOString(),
  //   scheduledEnd: scheduledEnd?.toISOString() || 'N/A',
  //   actualStart: actualStart?.toISOString() || 'N/A',
  //   actualEnd: actualEnd?.toISOString() || 'N/A',
  //   currentTime: currentTime.toISOString()
  // });

  // Calculate time differences
  const timeFromScheduledStart = currentTime.getTime() - scheduledStart.getTime();
  const timeFromScheduledEnd = scheduledEnd ? currentTime.getTime() - scheduledEnd.getTime() : null;
  const actualStartDelay = actualStart ? actualStart.getTime() - scheduledStart.getTime() : null;
  const actualEndDelay = (actualEnd && scheduledEnd) ? actualEnd.getTime() - scheduledEnd.getTime() : null;

  log(jobId, 'Time calculations', {
    timeFromScheduledStart_ms: timeFromScheduledStart,
    timeFromScheduledStart_min: Math.round(timeFromScheduledStart / 60000),
    timeFromScheduledEnd_ms: timeFromScheduledEnd,
    timeFromScheduledEnd_min: timeFromScheduledEnd ? Math.round(timeFromScheduledEnd / 60000) : 'N/A',
    actualStartDelay_ms: actualStartDelay,
    actualStartDelay_min: actualStartDelay ? Math.round(actualStartDelay / 60000) : 'N/A',
    threshold_ms: THRESHOLD_MS,
    threshold_min: THRESHOLD_MS / 60000
  });

  // ==========================================
  // CONDITION 1: No actual start when current time > schedule_start + threshold
  // ==========================================
  const notStartedOnTime = !actualStart && 
                           (timeFromScheduledStart > THRESHOLD_MS);
  
  if (notStartedOnTime) {
    const delayMinutes = Math.round(timeFromScheduledStart / 60000);
    log(jobId, '🚨 FLAG: Not Started On Time', {
      condition: 'No actual_start AND current time > schedule_start + threshold',
      delay_minutes: delayMinutes,
      scheduled_start: scheduledStart.toISOString(),
      current_time: currentTime.toISOString()
    });
  }

  // ==========================================
  // CONDITION 2: No actual end when current time > schedule_end + threshold
  // ==========================================
  const notEndedOnTime = !actualEnd && 
                         scheduledEnd != null &&
                         (timeFromScheduledEnd > THRESHOLD_MS);
  
  if (notEndedOnTime) {
    const delayMinutes = Math.round(timeFromScheduledEnd / 60000);
    log(jobId, '🚨 FLAG: Not Ended On Time', {
      condition: 'No actual_end AND current time > schedule_end + threshold',
      delay_minutes: delayMinutes,
      scheduled_end: scheduledEnd.toISOString(),
      current_time: currentTime.toISOString(),
      has_actual_start: !!actualStart
    });
  }

  // ==========================================
  // CONDITION 3: Actual start > schedule_start + threshold
  // ==========================================
  const startedLate = actualStart != null && 
                      (actualStartDelay > THRESHOLD_MS);
  
  if (startedLate) {
    const delayMinutes = Math.round(actualStartDelay / 60000);
    log(jobId, '🚨 FLAG: Started Late', {
      condition: 'actual_start > schedule_start + threshold',
      delay_minutes: delayMinutes,
      scheduled_start: scheduledStart.toISOString(),
      actual_start: actualStart.toISOString()
    });
  }

  // ==========================================
  // PRIORITY: Determine which flag to show
  // Priority order: Not Started > Started Late > Not Ended
  // ==========================================
  if (notStartedOnTime) {
    const delayMinutes = Math.round(timeFromScheduledStart / 60000);
    log(jobId, '✅ Final Flag: Not Started On Time', { delay_minutes: delayMinutes });
    return { 
      is_flag: true, 
      flag_reason: 'Not Started',
      delay_minutes: delayMinutes
    };
  } else if (startedLate) {
    const delayMinutes = Math.round(actualStartDelay / 60000);
    log(jobId, '✅ Final Flag: Started Late', { delay_minutes: delayMinutes });
    return { 
      is_flag: true, 
      flag_reason: 'Late',
      delay_minutes: delayMinutes
    };
  } else if (notEndedOnTime) {
    const delayMinutes = Math.round(timeFromScheduledEnd / 60000);
    log(jobId, '✅ Final Flag: Not Ended On Time', { delay_minutes: delayMinutes });
    return { 
      is_flag: true, 
      flag_reason: 'Not Ended',
      delay_minutes: delayMinutes
    };
  }

  log(jobId, '✅ No flags - job is on time');
  return { is_flag: false, flag_reason: null };
}

/**
 * Batch calculate flags for multiple jobs
 * @param {Array} jobs - Array of job objects
 * @param {Date} now - Current date/time (defaults to now)
 * @returns {Array} Array of { job_id, is_flag, flag_reason, delay_minutes }
 */
export function calculateJobFlagsBatch(jobs, now = new Date()) {
  log('BATCH', `Processing ${jobs.length} jobs`);
  
  const results = jobs.map(job => {
    const flags = calculateJobFlags(job, now);
    return {
      job_id: job.id,
      ...flags
    };
  });

  const flaggedCount = results.filter(r => r.is_flag).length;
  log('BATCH', `Completed: ${flaggedCount} jobs flagged out of ${jobs.length}`);
  
  return results;
}

/**
 * Get summary statistics of flagged jobs
 * @param {Array} jobs - Array of job objects
 * @param {Date} now - Current date/time (defaults to now)
 * @returns {Object} Summary statistics
 */
export function getFlagSummary(jobs, now = new Date()) {
  const results = calculateJobFlagsBatch(jobs, now);
  
  const summary = {
    total_jobs: jobs.length,
    flagged_jobs: 0,
    not_started_on_time: 0,
    started_late: 0,
    not_ended_on_time: 0,
    no_flags: 0
  };

  results.forEach(result => {
    if (result.is_flag) {
      summary.flagged_jobs++;
      if (result.flag_reason === 'Not Started On Time') {
        summary.not_started_on_time++;
      } else if (result.flag_reason === 'Started Late') {
        summary.started_late++;
      } else if (result.flag_reason === 'Not Ended On Time') {
        summary.not_ended_on_time++;
      }
    } else {
      summary.no_flags++;
    }
  });

  console.log('📊 FLAG SUMMARY:', summary);
  return summary;
}