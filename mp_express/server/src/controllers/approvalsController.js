import db from '../config/database.js';

export const getAllApprovals = async (req, res) => {
  try {
    const [approvals] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, p.name as project_name 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN projects p ON j.project_id = p.id
    `);
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getApprovalById = async (req, res) => {
  try {
    const [approval] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, p.name as project_name 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE a.id = ?
    `, [req.params.id]);
    res.json(approval[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateApproval = async (req, res) => {
  try {
    const { approver_id, comments, modified_start, modified_end } = req.body;
    await db.query(
      `UPDATE approvals SET approver_id=?, comments=?, modified_start=?, modified_end=? WHERE id=?`,
      [approver_id, comments, modified_start, modified_end, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteApproval = async (req, res) => {
  try {
    await db.query('DELETE FROM approvals WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
