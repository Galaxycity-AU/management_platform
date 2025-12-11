import db from '../database.js';

// Get all approvals for a job
export const getApprovalsByJob = async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.*, w.name as approver_name FROM approvals a
     LEFT JOIN workers w ON a.approver_id = w.id
     WHERE a.job_id = ?`,
    [req.params.jobId]
  );
  res.json(rows);
};

// Create approval request
export const createApproval = async (req, res) => {
  const { job_id, approver_id, comments, modified_start, modified_end } = req.body;
  const [result] = await db.query(
    'INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end) VALUES (?, ?, ?, ?, ?)',
    [job_id, approver_id, comments, modified_start || null, modified_end || null]
  );
  
  // Update job to reference this approval
  await db.query('UPDATE jobs SET approval_id = ? WHERE id = ?', [result.insertId, job_id]);
  
  res.json({ id: result.insertId, job_id, approver_id, comments, modified_start, modified_end });
};

// Update approval (when someone approves/rejects - sets approver_id, comments, modified times)
export const updateApproval = async (req, res) => {
  const { approver_id, comments, modified_start, modified_end } = req.body;
  await db.query(
    'UPDATE approvals SET approver_id=?, comments=?, modified_start=?, modified_end=? WHERE id=?',
    [approver_id || null, comments || null, modified_start || null, modified_end || null, req.params.id]
  );
  res.json({ success: true });
};

// Delete approval
export const deleteApproval = async (req, res) => {
  await db.query('DELETE FROM approvals WHERE id=?', [req.params.id]);
  res.json({ success: true });
};
