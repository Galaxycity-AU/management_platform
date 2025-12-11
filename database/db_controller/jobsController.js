import db from '../database.js';

export const getAllJobs = async (req, res) => {
  const [jobs] = await db.query(
    `SELECT j.*, a.modified_start, a.modified_end 
     FROM jobs j 
     LEFT JOIN approvals a ON j.approval_id = a.id`
  );
  res.json(jobs);
};

export const getJobsByProject = async (req, res) => {
  const [jobs] = await db.query(
    `SELECT j.*, a.modified_start, a.modified_end 
     FROM jobs j 
     LEFT JOIN approvals a ON j.approval_id = a.id 
     WHERE j.project_id = ?`,
    [req.params.projectId]
  );
  res.json(jobs);
};

export const createJob = async (req, res) => {
  const { project_id, worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, approval_id } = req.body;
  const [result] = await db.query(
    `INSERT INTO jobs (project_id, worker_id, status, scheduled_start, scheduled_end, 
     actual_start, actual_end, approval_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [project_id, worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, approval_id]
  );
  
  // If status is 'waiting_approval', automatically create an approval with only job_id (approver_id is NULL)
  if (status === 'waiting_approval') {
    const [approvalResult] = await db.query(
      `INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end)
       VALUES (?, NULL, NULL, NULL, NULL)`,
      [result.insertId]
    );
    
    // Link the job to the approval
    await db.query(
      `UPDATE jobs SET approval_id = ? WHERE id = ?`,
      [approvalResult.insertId, result.insertId]
    );
  }
  
  res.json({ id: result.insertId, ...req.body });
};

export const updateJob = async (req, res) => {
  const { worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, approval_id } = req.body;
  const jobId = req.params.id;
  
  // Get current job status to check if it's changing to waiting_approval
  const [currentJob] = await db.query('SELECT status, approval_id FROM jobs WHERE id = ?', [jobId]);
  const currentStatus = currentJob[0]?.status;
  const currentApprovalId = currentJob[0]?.approval_id;
  
  await db.query(
    `UPDATE jobs SET worker_id=?, status=?, scheduled_start=?, scheduled_end=?, 
     actual_start=?, actual_end=?, approval_id=? 
     WHERE id=?`,
    [worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, approval_id, jobId]
  );
  
  // If status changed to 'waiting_approval' and no approval exists yet, create one
  if (status === 'waiting_approval' && currentStatus !== 'waiting_approval' && !currentApprovalId) {
    const [approvalResult] = await db.query(
      `INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end)
       VALUES (?, NULL, NULL, NULL, NULL)`,
      [jobId]
    );
    
    // Link the job to the approval
    await db.query(
      `UPDATE jobs SET approval_id = ? WHERE id = ?`,
      [approvalResult.insertId, jobId]
    );
  }
  
  res.json({ success: true });
};

export const deleteJob = async (req, res) => {
  await db.query('DELETE FROM jobs WHERE id=?', [req.params.id]);
  res.json({ success: true });
};
