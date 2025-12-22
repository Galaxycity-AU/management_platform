/**
 * Flag Refresh Service
 * 
 * Periodically refreshes time-dependent flags for jobs
 * Should be run as a background job (e.g., every 5-10 minutes)
 */

import db from '../config/database.js';
import { calculateJobFlags } from '../utils/flagCalculator.js';

/**
 * Refresh flags for all jobs that might have time-dependent flags
 * This includes jobs with status 'schedule' or 'active' that haven't been calculated recently
 * @param {number} staleMinutes - Consider flags stale if older than this many minutes (default: 5)
 * @returns {Object} Summary of refresh operation
 */
export async function refreshJobFlags(staleMinutes = 5) {
  try {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - staleMinutes * 60 * 1000);
    
    // Find jobs that need flag refresh:
    // 1. Status is 'schedule' or 'active' (time-dependent flags)
    // 2. Flag hasn't been calculated recently (or never calculated)
    const [jobsToRefresh] = await db.query(`
      SELECT id, schedule_start, schedule_end, actual_start, actual_end, status
      FROM jobs
      WHERE (status IN ('schedule', 'active'))
        AND (flag_calculated_at IS NULL OR flag_calculated_at < ?)
        AND schedule_start IS NOT NULL
    `, [staleThreshold]);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const job of jobsToRefresh) {
      try {
        const flags = calculateJobFlags(job, now);
        await db.query(
          `UPDATE jobs SET is_flag = ?, flag_reason = ?, flag_calculated_at = ? WHERE id = ?`,
          [flags.is_flag, flags.flag_reason, now, job.id]
        );
        updatedCount++;
      } catch (error) {
        console.error(`Error refreshing flags for job ${job.id}:`, error);
        errorCount++;
      }
    }
    
    return {
      totalChecked: jobsToRefresh.length,
      updated: updatedCount,
      errors: errorCount,
      timestamp: now
    };
  } catch (error) {
    console.error('Error in refreshJobFlags:', error);
    throw error;
  }
}

/**
 * Refresh flags for a specific job
 * @param {number} jobId - ID of the job to refresh
 * @returns {Object} Updated flag information
 */
export async function refreshJobFlag(jobId) {
  try {
    const [jobs] = await db.query(`
      SELECT id, schedule_start, schedule_end, actual_start, actual_end, status
      FROM jobs
      WHERE id = ?
    `, [jobId]);
    
    if (jobs.length === 0) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    const job = jobs[0];
    const flags = calculateJobFlags(job);
    const now = new Date();
    
    await db.query(
      `UPDATE jobs SET is_flag = ?, flag_reason = ?, flag_calculated_at = ? WHERE id = ?`,
      [flags.is_flag, flags.flag_reason, now, jobId]
    );
    
    return {
      job_id: jobId,
      ...flags,
      flag_calculated_at: now
    };
  } catch (error) {
    console.error(`Error refreshing flag for job ${jobId}:`, error);
    throw error;
  }
}

