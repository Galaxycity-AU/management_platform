import db from '../database.js';

// Get all workers
export const getAllWorkers = async (req, res) => {
  const [workers] = await db.query('SELECT * FROM workers');
  res.json(workers);
};

// Get worker by ID
export const getWorkerById = async (req, res) => {
  const [workers] = await db.query('SELECT * FROM workers WHERE id = ?', [req.params.id]);
  res.json(workers[0]);
};

// Create worker
export const createWorker = async (req, res) => {
  const { name, position, email, phone } = req.body;
  const [result] = await db.query(
    'INSERT INTO workers (name, position, email, phone) VALUES (?, ?, ?, ?)',
    [name, position, email, phone]
  );
  res.json({ id: result.insertId, name, position, email, phone });
};

// Update worker
export const updateWorker = async (req, res) => {
  const { name, position, email, phone } = req.body;
  await db.query(
    'UPDATE workers SET name=?, position=?, email=?, phone=? WHERE id=?',
    [name, position, email, phone, req.params.id]
  );
  res.json({ success: true });
};

// Delete worker
export const deleteWorker = async (req, res) => {
  await db.query('DELETE FROM workers WHERE id=?', [req.params.id]);
  res.json({ success: true });
};
