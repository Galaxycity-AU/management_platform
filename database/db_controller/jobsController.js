import db from '../database.js';

export const getAllJobs = async (req, res) => {
  const [jobs] = await db.query('SELECT * FROM jobs');
  res.json(jobs);
};

export const getJobsByProject = async (req, res) => {
  const [jobs] = await db.query('SELECT * FROM jobs WHERE project_id = ?', [req.params.projectId]);
  res.json(jobs);
};

export const createJob = async (req, res) => {
  const { project_id, worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, modified_start, modified_end } = req.body;
  const [result] = await db.query(
    `INSERT INTO jobs (project_id, worker_id, status, scheduled_start, scheduled_end, 
     actual_start, actual_end, modified_start, modified_end) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [project_id, worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, modified_start, modified_end]
  );
  res.json({ id: result.insertId, ...req.body });
};

export const updateJob = async (req, res) => {
  const { worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, modified_start, modified_end } = req.body;
  await db.query(
    `UPDATE jobs SET worker_id=?, status=?, scheduled_start=?, scheduled_end=?, 
     actual_start=?, actual_end=?, modified_start=?, modified_end=? 
     WHERE id=?`,
    [worker_id, status, scheduled_start, scheduled_end, actual_start, actual_end, modified_start, modified_end, req.params.id]
  );
  res.json({ success: true });
};

export const deleteJob = async (req, res) => {
  await db.query('DELETE FROM jobs WHERE id=?', [req.params.id]);
  res.json({ success: true });
};
