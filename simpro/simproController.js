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

