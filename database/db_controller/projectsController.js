import db from '../database.js';

// Get all projects
export const getAllProjects = async (req, res) => {
  const [projects] = await db.query('SELECT * FROM projects');
  res.json(projects);
};

// Get project by ID
export const getProjectById = async (req, res) => {
  const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  res.json(projects[0]);
};

// Create project
export const createProject = async (req, res) => {
  const { name, description, deadline, status, client, manager } = req.body;
  const [result] = await db.query(
    'INSERT INTO projects (name, description, deadline, status, client, manager) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, deadline, status, client, manager]
  );
  res.json({ id: result.insertId, name, description, deadline, status, client, manager });
};

// Update project
export const updateProject = async (req, res) => {
  const { name, description, deadline, status, client, manager } = req.body;
  await db.query(
    'UPDATE projects SET name=?, description=?, deadline=?, status=?, client=?, manager=? WHERE id=?',
    [name, description, deadline, status, client, manager, req.params.id]
  );
  res.json({ success: true });
};

// Delete project
export const deleteProject = async (req, res) => {
  await db.query('DELETE FROM projects WHERE id=?', [req.params.id]);
  res.json({ success: true });
};