import { getJob, getAllSchedule, getDetailSchedule, getLog } from './simpro.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Get project root directory (go up from simpro/ to project root)
const projectRoot = path.resolve(__dirname, '..');
const getProjectsFilePath = () => path.join(projectRoot, 'data', 'simproProjects.json');

// SIMPRO API PROXY CONTROLLERS

export const getJobById = async (req, res) => {
    try {
        const data = await getJob(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllSchedules = async (req, res) => {
    try {
        const data = await getAllSchedule();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getScheduleById = async (req, res) => {
    try {
        const data = await getDetailSchedule(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMobileStatusLog = async (req, res) => {
    try {
        const data = await getLog();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createScheduleWebhook = async (req, res) => {
    try {
        const { data } = req.body;
        
        // Log the webhook payload for debugging
        console.log("Schedule webhook received:", JSON.stringify(data, null, 2));
        
        // Validate that we received data
        if (!data) {
            return res.status(400).json({ error: "No data received in webhook payload" });
        }
        
        // TODO: Process the schedule update here
        // Examples of what you might want to do:
        // - Update schedule in database
        // - Fetch full schedule details using getDetailSchedule(data.ID)
        // - Update related Jobs
        // - Trigger notifications
        // - Invalidate cache if you have one
        
        // Send success response to Simpro
        res.status(200).json({ 
            success: true, 
            message: "Schedule webhook processed successfully",
            scheduleId: data?.ID || null
        });
    } catch (error) {
        console.error("Error processing schedule webhook:", error);
        res.status(500).json({ error: error.message });
    }
};

// SIMPRO PROJECTS JSON CONTROLLERS

export const getAllProjects = async (req, res) => {
    try {
        const filePath = getProjectsFilePath();
        
        // Read existing file or initialize empty structure
        let data;
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            // Check if file is empty or just whitespace
            if (!fileContent.trim()) {
                data = { projects: [], logs: [] };
            } else {
                data = JSON.parse(fileContent);
                // Ensure data.projects exists and is an array
                if (!data.projects || !Array.isArray(data.projects)) {
                    data.projects = [];
                }
                // Ensure data.logs exists and is an array (preserve existing logs)
                if (!data.logs || !Array.isArray(data.logs)) {
                    data.logs = data.logs || [];
                }
            }
        } catch (parseError) {
            // File doesn't exist, is invalid JSON, or is empty - create new structure
            console.warn(`simproProjects.json is invalid or empty at ${filePath}, initializing with empty structure:`, parseError.message);
            data = { projects: [], logs: [] };
            // Optionally write the new structure back to file
            try {
                // Ensure the data directory exists
                const dataDir = path.dirname(filePath);
                await fs.mkdir(dataDir, { recursive: true });
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
            } catch (writeError) {
                console.error(`Error writing initial structure to ${filePath}:`, writeError);
            }
        }
        
        res.json(data);
    } catch (error) {
        const filePath = getProjectsFilePath();
        console.error(`Error reading simproProjects.json at ${filePath}:`, error);
        res.status(500).json({ error: error.message, filePath });
    }
};

export const createProject = async (req, res) => {
    try {
        const { project } = req.body;
        if (!project || !project.id) {
            return res.status(400).json({ error: "Project data with id is required" });
        }
        
        const filePath = getProjectsFilePath();
        
        // Read existing file or initialize empty structure
        let data;
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist or is invalid, create new structure
            data = { projects: [], logs: [] };
        }
        
        // Ensure data.projects exists and is an array
        if (!data.projects || !Array.isArray(data.projects)) {
            data.projects = [];
        }
        
        // Check if project with this id already exists
        const existingIndex = data.projects.findIndex(p => p.id === project.id);
        
        if (existingIndex >= 0) {
            // Update existing project
            data.projects[existingIndex] = { ...data.projects[existingIndex], ...project };
        } else {
            // Add new project
            data.projects.push(project);
        }
        
        // Ensure the data directory exists
        const dataDir = path.dirname(filePath);
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true, project: existingIndex >= 0 ? data.projects[existingIndex] : project });
    } catch (error) {
        console.error(`Error writing simproProjects.json at ${filePath}:`, error);
        res.status(500).json({ error: error.message, filePath });
    }
};

export const batchCreateProjects = async (req, res) => {
    try {
        const { projects } = req.body;
        if (!Array.isArray(projects)) {
            return res.status(400).json({ error: "Projects array is required" });
        }
        
        const filePath = getProjectsFilePath();
        
        // Read existing file or initialize empty structure
        let data;
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist or is invalid, create new structure
            data = { projects: [] };
        }
        
        // Ensure data.projects exists and is an array
        if (!data.projects || !Array.isArray(data.projects)) {
            data.projects = [];
        }
        
        // Create a map of existing projects by id
        const existingMap = new Map();
        data.projects.forEach((p, index) => {
            existingMap.set(p.id, index);
        });
        
        // Update or add projects
        projects.forEach(project => {
            if (!project.id) return; // Skip projects without id
            
            const existingIndex = existingMap.get(project.id);
            if (existingIndex !== undefined) {
                // Update existing project
                data.projects[existingIndex] = { ...data.projects[existingIndex], ...project };
            } else {
                // Add new project
                data.projects.push(project);
                existingMap.set(project.id, data.projects.length - 1);
            }
        });
        
        // Ensure the data directory exists
        const dataDir = path.dirname(filePath);
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true, count: projects.length });
    } catch (error) {
        console.error(`Error batch writing simproProjects.json at ${filePath}:`, error);
        res.status(500).json({ error: error.message, filePath });
    }
};

export const updateProjectSchedules = async (req, res) => {
    try {
        const { jobSchedules } = req.body;
        if (!jobSchedules || typeof jobSchedules !== 'object') {
            return res.status(400).json({ error: "jobSchedules object is required" });
        }
        
        const filePath = getProjectsFilePath();
        
        // Read existing file or initialize empty structure
        let data;
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist or is invalid, create new structure
            data = { projects: [], logs: [] };
        }
        
        // Ensure data.projects exists and is an array
        if (!data.projects || !Array.isArray(data.projects)) {
            data.projects = [];
        }
        
        // Update schedules for each job
        let updatedCount = 0;
        Object.keys(jobSchedules).forEach(jobId => {
            const projectIndex = data.projects.findIndex(p => String(p.id) === String(jobId));
            if (projectIndex >= 0) {
                // Initialize schedules array if it doesn't exist
                if (!data.projects[projectIndex].schedules) {
                    data.projects[projectIndex].schedules = [];
                }
                // Add schedules for this job (replace existing schedules or merge)
                data.projects[projectIndex].schedules = jobSchedules[jobId];
                updatedCount++;
            }
        });
        
        // Ensure the data directory exists
        const dataDir = path.dirname(filePath);
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true, updatedCount });
    } catch (error) {
        console.error(`Error updating project schedules at ${filePath}:`, error);
        res.status(500).json({ error: error.message, filePath });
    }
};


// ============================================================
// BACKEND API ROUTES
// ============================================================

// Get project note
router.get('/projects/:projectId/note', async (req, res) => {
    try {
        const { projectId } = req.params;
        const note = await getProjectNote(projectId);
        res.json({ success: true, note });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save/Update project note
router.post('/projects/:projectId/note', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { content, updatedBy } = req.body;
        
        if (content === null || content === undefined) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }
        
        await saveProjectNote(projectId, content.trim(), updatedBy);
        const note = await getProjectNote(projectId);
        
        res.json({ success: true, note });
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// DATABASE FUNCTIONS
// ============================================================

// Get project note
async function getProjectNote(projectId) {
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
    const [rows] = await db.execute(query, [projectId]);
    return rows[0] || null;
}

// Save/Update project note
async function saveProjectNote(projectId, content, updatedBy = null) {
    const query = `
        UPDATE projects 
        SET 
            note = ?,
            note_updated_at = CURRENT_TIMESTAMP,
            note_updated_by = ?
        WHERE id = ?
    `;
    await db.execute(query, [content, updatedBy, projectId]);
}

// ============================================================
// REACT COMPONENT - Simplified Single Note
// ============================================================

function ProjectNote({ projectId, currentUserId }) {
    const [note, setNote] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [updatedByName, setUpdatedByName] = useState(null);
    const [noteSaved, setNoteSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch note when component mounts
    useEffect(() => {
        if (projectId) {
            fetchNote();
        }
    }, [projectId]);

    // Fetch note
    const fetchNote = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/note`);
            
            if (response.data.success && response.data.note) {
                setNote(response.data.note.note || '');
                setLastUpdated(response.data.note.note_updated_at);
                setUpdatedByName(response.data.note.updated_by_name);
            }
        } catch (err) {
            console.error('Error fetching note:', err);
            setError('Failed to load note');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle note change
    const handleNoteChange = (value) => {
        setNote(value);
        setNoteSaved(false);
    };

    // Save note
    const handleSaveNote = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/note`, {
                content: note,
                updatedBy: currentUserId
            });

            if (response.data.success) {
                setLastUpdated(response.data.note.note_updated_at);
                setUpdatedByName(response.data.note.updated_by_name);
                setNoteSaved(true);
                
                // Hide "Saved" indicator after 3 seconds
                setTimeout(() => setNoteSaved(false), 3000);
            }
        } catch (err) {
            console.error('Error saving note:', err);
            setError('Failed to save note');
        } finally {
            setIsLoading(false);
        }
    };

    // Clear note
    const handleClearNote = () => {
        setNote('');
        setNoteSaved(false);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg text-gray-800">Project Notes</h4>
                        {lastUpdated && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Updated {new Date(lastUpdated).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                                {updatedByName && ` by ${updatedByName}`}
                            </p>
                        )}
                    </div>
                </div>
                {noteSaved && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" />
                        Saved
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <textarea
                    value={note}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    maxLength={500}
                    disabled={isLoading}
                    className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y text-sm text-gray-700 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Add notes about today's operations, issues, achievements, or important updates..."
                />
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {note.length} / 500 characters
                    </div>
                    <div className="flex gap-2">
                        {note.trim() && (
                            <button
                                onClick={handleClearNote}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={handleSaveNote}
                            disabled={isLoading}
                            className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            {isLoading ? 'Saving...' : 'Save Notes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectNote;
