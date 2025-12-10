import db from '../database.js';

// Get all approvals for a job
export const getApprovalsByJob = async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.*, w.name as approver_name FROM approvals a
     JOIN workers w ON a.approver_id = w.id
     WHERE a.job_id = ?`,
    [req.params.jobId]
  );
  res.json(rows);
};

// Create approval request
export const createApproval = async (req, res) => {
  const { job_id, approver_id, comments } = req.body;
  const [result] = await db.query(
    'INSERT INTO approvals (job_id, approver_id, comments) VALUES (?, ?, ?)',
    [job_id, approver_id, comments]
  );
  res.json({ id: result.insertId, job_id, approver_id, comments });
};

// Update approval (status, comments)
export const updateApproval = async (req, res) => {
  const { comments } = req.body;
  await db.query(
    'UPDATE approvals SET comments=? WHERE id=?',
    [comments, req.params.id]
  );
  res.json({ success: true });
};

// Delete approval
export const deleteApproval = async (req, res) => {
  await db.query('DELETE FROM approvals WHERE id=?', [req.params.id]);
  res.json({ success: true });
};
