import db from '../config/database.js';
import { calculateJobFlags } from '../utils/flagCalculator.js';
import { emitJobCreated, emitJobUpdated, emitJobDeleted, emitDashboardAlerts, emitStatsUpdated } from '../socket/eventEmitter.js';
import { toMySQLDateTime } from '../utils/helpers.js';

export const getAllJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, a.modified_start, a.modified_end 
       FROM jobs j 
       LEFT JOIN approvals a ON j.approval_id = a.id`
    );
    
    // Refresh stale flags (older than 5 minutes) for time-dependent calculations
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    
    const jobsToRefresh = jobs.filter(job => 
      !job.flag_calculated_at || 
      new Date(job.flag_calculated_at) < staleThreshold
    );
    
    if (jobsToRefresh.length > 0) {
      // Batch update stale flags
      for (const job of jobsToRefresh) {
        const flags = calculateJobFlags(job, now);
        await db.query(
          `UPDATE jobs SET is_flag = ?, flag_reason = ?, flag_calculated_at = ? WHERE id = ?`,
          [flags.is_flag, flags.flag_reason, now, job.id]
        );
        // Update in-memory object for response
        job.is_flag = flags.is_flag;
        job.flag_reason = flags.flag_reason;
        job.flag_calculated_at = now;
      }
    }
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobsByProject = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, a.modified_start, a.modified_end 
       FROM jobs j 
       LEFT JOIN approvals a ON j.approval_id = a.id 
       WHERE j.project_id = ?`,
      [req.params.projectId]
    );
    
    // Refresh stale flags (older than 5 minutes) for time-dependent calculations
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    
    const jobsToRefresh = jobs.filter(job => 
      !job.flag_calculated_at || 
      new Date(job.flag_calculated_at) < staleThreshold
    );
    
    if (jobsToRefresh.length > 0) {
      // Batch update stale flags
      for (const job of jobsToRefresh) {
        const flags = calculateJobFlags(job, now);
        await db.query(
          `UPDATE jobs SET is_flag = ?, flag_reason = ?, flag_calculated_at = ? WHERE id = ?`,
          [flags.is_flag, flags.flag_reason, now, job.id]
        );
        // Update in-memory object for response
        job.is_flag = flags.is_flag;
        job.flag_reason = flags.flag_reason;
        job.flag_calculated_at = now;
      }
    }
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const { project_id, worker_id, status, schedule_start, schedule_end, actual_start, actual_end, approval_id } = req.body;
    
    // Convert ISO datetime strings to MySQL format
    const mysqlScheduleStart = toMySQLDateTime(schedule_start);
    const mysqlScheduleEnd = toMySQLDateTime(schedule_end);
    const mysqlActualStart = toMySQLDateTime(actual_start);
    const mysqlActualEnd = toMySQLDateTime(actual_end);
    
    const [result] = await db.query(
      `INSERT INTO jobs (project_id, worker_id, status, schedule_start, schedule_end, 
       actual_start, actual_end, approval_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, worker_id, status, mysqlScheduleStart, mysqlScheduleEnd, mysqlActualStart, mysqlActualEnd, approval_id]
    );
    
    if (status === 'waiting_approval') {
      const [approvalResult] = await db.query(
        `INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end)
         VALUES (?, NULL, NULL, NULL, NULL)`,
        [result.insertId]
      );
      
      await db.query(
        `UPDATE jobs SET approval_id = ? WHERE id = ?`,
        [approvalResult.insertId, result.insertId]
      );
    }
    
    // Calculate and store flags for the new job
    const newJob = {
      id: result.insertId,
      project_id,
      worker_id,
      schedule_start,
      schedule_end,
      actual_start,
      actual_end,
      status
    };
    const flags = calculateJobFlags(newJob);
    await db.query(
      `UPDATE jobs SET is_flag = ?, flag_reason = ?, flag_calculated_at = ? WHERE id = ?`,
      [flags.is_flag, flags.flag_reason, new Date(), result.insertId]
    );
    
    const createdJob = { id: result.insertId, ...req.body, ...flags };
    
    // Emit socket event for job creation
    emitJobCreated(createdJob);
    
    // Also emit stats update to refresh dashboard
    emitStatsUpdated({ jobCreated: true, jobId: result.insertId });
    
    res.json(createdJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { worker_id, status, schedule_start, schedule_end, actual_start, actual_end, approval_id } = req.body;
    const jobId = req.params.id;
    
    const [currentJob] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
    const currentStatus = currentJob[0]?.status;
    const currentApprovalId = currentJob[0]?.approval_id;
    const projectId = currentJob[0]?.project_id;
    
    // Convert ISO datetime strings to MySQL format
    const mysqlScheduleStart = toMySQLDateTime(schedule_start);
    const mysqlScheduleEnd = toMySQLDateTime(schedule_end);
    const mysqlActualStart = toMySQLDateTime(actual_start);
    const mysqlActualEnd = toMySQLDateTime(actual_end);
    
    await db.query(
      `UPDATE jobs SET worker_id=?, status=?, schedule_start=?, schedule_end=?, 
       actual_start=?, actual_end=?, approval_id=? 
       WHERE id=?`,
      [worker_id, status, mysqlScheduleStart, mysqlScheduleEnd, mysqlActualStart, mysqlActualEnd, approval_id, jobId]
    );
    
    if (status === 'waiting_approval' && currentStatus !== 'waiting_approval' && !currentApprovalId) {
      const [approvalResult] = await db.query(
        `INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end)
         VALUES (?, NULL, NULL, NULL, NULL)`,
        [jobId]
      );
      
      await db.query(
        `UPDATE jobs SET approval_id = ? WHERE id = ?`,
        [approvalResult.insertId, jobId]
      );
    }
    
    // Recalculate and update flags when job data changes
    const updatedJob = {
      id: jobId,
      project_id: projectId,
      worker_id,
      schedule_start,
      schedule_end,
      actual_start,
      actual_end,
      status
    };
    const flags = calculateJobFlags(updatedJob);
    await db.query(
      `UPDATE jobs SET is_flag = ?, flag_reason = ?, flag_calculated_at = ? WHERE id = ?`,
      [flags.is_flag, flags.flag_reason, new Date(), jobId]
    );
    
    // Emit socket event for job update
    emitJobUpdated({ ...updatedJob, ...flags });
    
    // If status changed, emit stats update
    if (currentStatus !== status) {
      emitStatsUpdated({ jobUpdated: true, jobId, oldStatus: currentStatus, newStatus: status });
    }
    
    res.json({ success: true, ...flags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Get project_id before deletion for socket event
    const [job] = await db.query('SELECT project_id FROM jobs WHERE id = ?', [jobId]);
    const projectId = job[0]?.project_id;
    
    await db.query('DELETE FROM jobs WHERE id=?', [jobId]);
    
    // Emit socket event for job deletion
    emitJobDeleted(jobId, projectId);
    
    // Emit stats update
    emitStatsUpdated({ jobDeleted: true, jobId });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Dashboard alerts

export const getDashboardAlerts = async (req, res) => {
  try {
    // Query uses pre-calculated flags from database
    const [projectAlerts] = await db.query(`
     SELECT 
        p.id,
        p.name,

        
        -- Count flagged jobs by type
        COUNT(CASE WHEN j.is_flag = 1 THEN 1 END) as flaggedJobs,
        COUNT(CASE WHEN j.flag_reason = 'Not Started' THEN 1 END) as notStartedOnTime,
        COUNT(CASE WHEN j.flag_reason = 'Late' THEN 1 END) as startedLate,
        COUNT(CASE WHEN j.flag_reason = 'Not Ended' THEN 1 END) as notEndedOnTime,
        
        -- Total jobs for this project
        COUNT(j.id) as totalJobs,
        
        -- Other metrics (customize based on your needs)
        COUNT(CASE WHEN j.actual_end > j.schedule_end THEN 1 END) as lateCase,
        COUNT(CASE WHEN 
          j.actual_end IS NOT NULL 
          AND j.actual_start IS NOT NULL 
          AND TIMESTAMPDIFF(MINUTE, j.actual_start, j.actual_end) > TIMESTAMPDIFF(MINUTE, j.schedule_start, j.schedule_end)
        THEN 1 END) as overTime,
        

        
        -- Last flag calculation time
        MAX(j.flag_calculated_at) as lastFlagUpdate
        
      FROM projects p
      LEFT JOIN jobs j ON p.id = j.project_id
      and j.schedule_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY p.id, p.name
      HAVING 
        flaggedJobs > 0 
        OR lateCase > 0 
        OR overTime > 0 
      ORDER BY 
        flaggedJobs DESC,
        lateCase DESC,
        overTime desc;
    `);


    // console.log(`[DASHBOARD] Found ${projectAlerts.length} projects with alerts`);
    // console.log(projectAlerts);

    // Format response
    const formattedAlerts = projectAlerts.map(alert => ({
      id: alert.id,
      name: alert.name,
      status: alert.status,
      
      // Flag data
      flaggedJobs: parseInt(alert.flaggedJobs) || 0,
      totalJobs: parseInt(alert.totalJobs) || 0,
      flagBreakdown: {
        notStartedOnTime: parseInt(alert.notStartedOnTime) || 0,
        startedLate: parseInt(alert.startedLate) || 0,
        notEndedOnTime: parseInt(alert.notEndedOnTime) || 0
      },
      
      // Other metrics
      lateCase: parseInt(alert.lateCase) || 0,
      overTime: parseInt(alert.overTime) || 0,
      overBudget: Boolean(alert.overBudget),
      
      // Metadata
      lastFlagUpdate: alert.lastFlagUpdate
    }));

    // Calculate summary statistics
    const summary = {
      totalProjects: projectAlerts.length,
      totalFlaggedJobs: formattedAlerts.reduce((sum, p) => sum + p.flaggedJobs, 0),
      projectsWithFlags: formattedAlerts.filter(p => p.flaggedJobs > 0).length,
      breakdown: {
        notStartedOnTime: formattedAlerts.reduce((sum, p) => sum + p.flagBreakdown.notStartedOnTime, 0),
        startedLate: formattedAlerts.reduce((sum, p) => sum + p.flagBreakdown.startedLate, 0),
        notEndedOnTime: formattedAlerts.reduce((sum, p) => sum + p.flagBreakdown.notEndedOnTime, 0)
      }
    };

    const responseData = {
      success: true,
      alerts: formattedAlerts,
      summary,
      timestamp: new Date().toISOString()
    };

    // Emit socket event for dashboard alerts
    emitDashboardAlerts(responseData);

    res.json(responseData);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
