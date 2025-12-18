import db from '../config/database.js';

export const getAllJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, a.modified_start, a.modified_end 
       FROM jobs j 
       LEFT JOIN approvals a ON j.approval_id = a.id`
    );
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
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const { project_id, worker_id, status, schedules_start, schedules_end, actual_start, actual_end, approval_id } = req.body;
    const [result] = await db.query(
      `INSERT INTO jobs (project_id, worker_id, status, schedules_start, schedules_end, 
       actual_start, actual_end, approval_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, worker_id, status, schedules_start, schedules_end, actual_start, actual_end, approval_id]
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
    
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { worker_id, status, schedules_start, schedules_end, actual_start, actual_end, approval_id } = req.body;
    const jobId = req.params.id;
    
    const [currentJob] = await db.query('SELECT status, approval_id FROM jobs WHERE id = ?', [jobId]);
    const currentStatus = currentJob[0]?.status;
    const currentApprovalId = currentJob[0]?.approval_id;
    
    await db.query(
      `UPDATE jobs SET worker_id=?, status=?, schedules_start=?, schedules_end=?, 
       actual_start=?, actual_end=?, approval_id=? 
       WHERE id=?`,
      [worker_id, status, schedules_start, schedules_end, actual_start, actual_end, approval_id, jobId]
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
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    await db.query('DELETE FROM jobs WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
