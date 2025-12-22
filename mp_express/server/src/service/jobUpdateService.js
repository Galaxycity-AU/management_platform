/**
 * Job Update Service
 * 
 * Updates jobs table with processed log data
 * Matches logs to jobs using: worker_id + project_id + cc_id + date
 */

import db from '../config/database.js';

/**
 * Helper: Get date string in Melbourne timezone (UTC+11)
 * @param {Date|string} dateInput - Date to convert
 * @returns {string} Date string in YYYY-MM-DD format in Melbourne timezone
 */
function getDateInMelbourneTime(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  // Use Intl.DateTimeFormat to format date in Melbourne timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Returns YYYY-MM-DD format
  return formatter.format(date);
}

/**
 * Update jobs table from processed log data
 * @param {Array} processedProjects - Processed projects from groupLogsByProjectWorkerWorkOrder()
 */
export async function updateJobsFromProcessedLogs(processedProjects) {
  let updatedCount = 0;
  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const project of processedProjects) {
    for (const worker of project.workers) {
      for (const workOrder of worker.workOrders) {
        try {
          // Extract date only (year-month-day, no time) from startTime in Melbourne timezone
          const logDate = getDateInMelbourneTime(workOrder.startTime);

          
          
          // Find matching job using composite key: worker_id + project_id + cc_id + date
          // Match by date only (year-month-day), ignoring time
          const [matchingJobs] = await db.query(`
            SELECT id, schedules_id, schedules_start, schedules_end, work_order_id
            FROM jobs
            WHERE worker_id = ?
              AND project_id = ?
              AND cc_id = ?
              AND DATE(schedule_date) = ?
            LIMIT 1
          `, [
            worker.workerId,
            project.projectId,
            workOrder.costCenterId || null,
            logDate  // YYYY-MM-DD format
          ]);

          let status = null;
          let is_currently_active = 0;
          let actual_end = null;
          if (workOrder.statusCode === 40) {
            status = 'active';
            is_currently_active = 1;
          } else if (workOrder.statusCode != 40) {
            status = 'waiting_approval';
            is_currently_active = 0;
            actual_end = workOrder.endTime;
          }
          
          const jobData = {
            work_order_id: workOrder.workOrderId,
            status: status,
            status_code: workOrder.statusCode,
            actual_start: workOrder.startTime,
            actual_end: actual_end,
            work_minutes: workOrder.workMinutes || 0,
            break_minutes: workOrder.breakMinutes || 0,
            is_currently_active: is_currently_active,
            last_log_time: workOrder.endTime || workOrder.startTime || new Date(),
            log_count: workOrder.logCount || 0
          };
          
          if (matchingJobs.length > 0) {
            // Update existing job
            const jobId = matchingJobs[0].id;
            await db.query(`
              UPDATE jobs 
              SET work_order_id = ?,
                  status = ?,
                  status_code = ?,
                  actual_start = ?,
                  actual_end = ?,
                  work_minutes = ?,
                  break_minutes = ?,
                  is_currently_active = ?,
                  last_log_time = ?,
                  log_count = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [
              jobData.work_order_id,
              jobData.status,
              jobData.status_code,
              jobData.actual_start,
              jobData.actual_end,
              jobData.work_minutes,
              jobData.break_minutes,
              jobData.is_currently_active,
              jobData.last_log_time,
              jobData.log_count,
              jobId
            ]);
            
            updatedCount++;
            console.log(`✓ Updated job ${jobId} - Worker: ${worker.workerName}, WO: ${workOrder.workOrderId || 'N/A'}, Minutes: ${jobData.work_minutes}`);
          } else {
            // No matching schedule found
            // Log for review - don't create job without schedule
            skippedCount++;
            console.log(`⚠ No matching schedule - Worker: ${worker.workerId}, Project: ${project.projectId}, CC: ${workOrder.costCenterId}, Date: ${logDate}`);
            console.log(`   WO: ${workOrder.workOrderId || 'N/A'}, Minutes: ${workOrder.workMinutes}, Status: ${workOrder.status}`);
            
            // Optionally: Log to a separate table for unscheduled work review
            // await logUnscheduledWork(worker, project, workOrder, logDate);
          }
        } catch (error) {
          errors.push({
            worker: worker.workerName,
            workOrder: workOrder.workOrderId || 'N/A',
            error: error.message
          });
          console.error(`✗ Error updating job - Worker: ${worker.workerName}, WO: ${workOrder.workOrderId || 'N/A'}:`, error.message);
        }
      }
    }
  }

  console.log(`\n=== Job Update Summary ===`);
  console.log(`Updated: ${updatedCount} jobs`);
  console.log(`Skipped (no schedule): ${skippedCount} work orders`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e.worker}, WO ${e.workOrder}: ${e.error}`));
  }

  return {
    updated: updatedCount,
    skipped: skippedCount,
    errors: errors.length,
    errorDetails: errors
  };
}

/**
 * Helper: Log unscheduled work for manual review
 * (Optional - create unscheduled_work table if needed)
 */
async function logUnscheduledWork(worker, project, workOrder, logDate) {
  try {
    await db.query(`
      INSERT INTO unscheduled_work (
        worker_id, project_id, cc_id, work_order_id,
        work_minutes, break_minutes, status, status_code,
        actual_start, actual_end, log_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      worker.workerId,
      project.projectId,
      workOrder.costCenterId,
      workOrder.workOrderId,
      workOrder.workMinutes,
      workOrder.breakMinutes,
      workOrder.status,
      workOrder.statusCode,
      workOrder.startTime,
      workOrder.endTime,
      logDate
    ]);
  } catch (error) {
    // Table might not exist - that's okay
    console.log('Note: unscheduled_work table not available');
  }
}

