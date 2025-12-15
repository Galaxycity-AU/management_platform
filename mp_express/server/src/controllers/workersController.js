import db from '../config/database.js';

export const getAllWorkers = async (req, res) => {
  try {
    const [workers] = await db.query('SELECT * FROM workers');
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkerById = async (req, res) => {
  try {
    const [workers] = await db.query('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    res.json(workers[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createWorker = async (req, res) => {
  try {
    const { name, position, email, phone } = req.body;
    const [result] = await db.query(
      'INSERT INTO workers (name, position, email, phone) VALUES (?, ?, ?, ?)',
      [name, position, email, phone]
    );
    res.json({ id: result.insertId, name, position, email, phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const { name, position, email, phone } = req.body;
    await db.query(
      'UPDATE workers SET name=?, position=?, email=?, phone=? WHERE id=?',
      [name, position, email, phone, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    await db.query('DELETE FROM workers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
