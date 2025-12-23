import db from '../config/database.js';

// Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const [projects] = await db.query('SELECT * FROM projects');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const [projects] = await db.query(`  SELECT
      j.id AS job_id,
      j.status,
      j.status_code,
      j.schedule_start,
      j.schedule_end,
      j.actual_start,
      j.actual_end,
      j.work_minutes,
      j.break_minutes,
      j.is_currently_active,
      j.schedule_date,

      w.id AS worker_id,
      w.name AS worker_name,

      p.name AS project_name,
      pm.name AS manager_name

    FROM jobs j
    JOIN projects p ON p.id = j.project_id
    LEFT JOIN workers w ON w.id = j.worker_id
    LEFT JOIN workers pm ON pm.id = p.project_manager_id
    WHERE j.project_id = ?
    ORDER BY j.schedule_start
  `, [req.params.id]);
    res.json(projects);
    // console.log(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create project
export const createProject = async (req, res) => {
  try {
    const { name, description, deadline, status, client, manager } = req.body;
    const [result] = await db.query(
      'INSERT INTO projects (name, description, deadline, status, client, manager) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, deadline, status, client, manager]
    );
    res.json({ id: result.insertId, name, description, deadline, status, client, manager });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { name, description, deadline, status, client, manager } = req.body;
    await db.query(
      'UPDATE projects SET name=?, description=?, deadline=?, status=?, client=?, manager=? WHERE id=?',
      [name, description, deadline, status, client, manager, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    await db.query('DELETE FROM projects WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get project note
export const getProjectNote = async (req, res) => {
  try {
    const { projectId } = req.params;
    const query = `
      SELECT 
        p.id as project_id,
        p.note,
        p.note_updated_at,
        p.note_updated_by,
        w.name as updated_by_name
      FROM projects p
      LEFT JOIN workers w ON p.note_updated_by = w.id
      WHERE p.id = ?
    `;
    const [rows] = await db.query(query, [projectId]);
    const note = rows[0] || null;
    res.json({ success: true, note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Save/Update project note
export const saveProjectNote = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, updatedBy } = req.body;
    
    if (content === null || content === undefined) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const query = `
      UPDATE projects 
      SET 
        note = ?,
        note_updated_at = CURRENT_TIMESTAMP,
        note_updated_by = ?
      WHERE id = ?
    `;
    await db.query(query, [content.trim(), updatedBy, projectId]);
    
    // Fetch updated note with worker name
    const fetchQuery = `
      SELECT 
        p.id as project_id,
        p.note,
        p.note_updated_at,
        p.note_updated_by,
        w.name as updated_by_name
      FROM projects p
      LEFT JOIN workers w ON p.note_updated_by = w.id
      WHERE p.id = ?
    `;
    const [rows] = await db.query(fetchQuery, [projectId]);
    const note = rows[0] || null;
    
    res.json({ success: true, note });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};