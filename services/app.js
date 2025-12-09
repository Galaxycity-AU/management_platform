import express from 'express';
import cors from 'cors';
import { sequelize, Project, Job, Worker, Approval } from '../models/models/index.js';
import { getJob, getAllSchedule, getDetailSchedule, getLog } from './simpro.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Sync Database
sequelize.sync({ alter: true })
  .then(() => console.log("SQL Database synced"))
  .catch(err => console.error(err));

// ----------------- PROJECT ROUTES -----------------
app.get("/projects", async (req, res) => {
    const projects = await Project.findAll();
    res.json(projects);
});

app.get("/projects/:id", async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
});

app.post("/projects", async (req, res) => {
    const newProject = await Project.create(req.body);
    res.json(newProject);
});

app.put("/projects/:id", async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    await project.update(req.body);
    res.json(project);
});

app.delete("/projects/:id", async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    await project.destroy();
    res.json({ message: "Project deleted" });
});

// ----------------- JOB ROUTES -----------------
app.get("/jobs", async (req, res) => {
    const jobs = await Job.findAll();
    res.json(jobs);
});

app.get("/jobs/:id", async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
});

app.post("/jobs", async (req, res) => {
    const newJob = await Job.create(req.body);
    res.json(newJob);
});

app.put("/jobs/:id", async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    await job.update(req.body);
    res.json(job);
});

app.delete("/jobs/:id", async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    await job.destroy();
    res.json({ message: "Job deleted" });
});

// ----------------- WORKER ROUTES -----------------
app.get("/workers", async (req, res) => {
    const workers = await Worker.findAll();
    res.json(workers);
});

app.get("/workers/:id", async (req, res) => {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json(worker);
});

app.post("/workers", async (req, res) => {
    const newWorker = await Worker.create(req.body);
    res.json(newWorker);
});

app.put("/workers/:id", async (req, res) => {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    await worker.update(req.body);
    res.json(worker);
});

app.delete("/workers/:id", async (req, res) => {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    await worker.destroy();
    res.json({ message: "Worker deleted" });
});

// ----------------- APPROVAL ROUTES -----------------
app.get("/approvals", async (req, res) => {
    const approvals = await Approval.findAll();
    res.json(approvals);
});

app.get("/approvals/:id", async (req, res) => {
    const approval = await Approval.findByPk(req.params.id);
    if (!approval) return res.status(404).json({ error: "Approval not found" });
    res.json(approval);
});

app.post("/approvals", async (req, res) => {
    const newApproval = await Approval.create(req.body);
    res.json(newApproval);
});

app.put("/approvals/:id", async (req, res) => {
    const approval = await Approval.findByPk(req.params.id);
    if (!approval) return res.status(404).json({ error: "Approval not found" });
    await approval.update(req.body);
    res.json(approval);
});

app.delete("/approvals/:id", async (req, res) => {
    const approval = await Approval.findByPk(req.params.id);
    if (!approval) return res.status(404).json({ error: "Approval not found" });
    await approval.destroy();
    res.json({ message: "Approval deleted" });
});
// ----------------- SIMPRO API PROXY ROUTES -----------------

app.get("/api/simpro/jobs/:id", async (req, res) => {
    try {
        const data = await getJob(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/simpro/schedules", async (req, res) => {
    try {
        const data = await getAllSchedule();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/simpro/schedules/:id", async (req, res) => {
    try {
        const data = await getDetailSchedule(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/simpro/logs/mobileStatus", async (req, res) => {
    try {
        const data = await getLog();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post("/api/simpro/createScheduleWebhook", async (req, res) => {
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
});

// ----------------- SIMPRO PROJECTS JSON ROUTES -----------------

app.get("/api/simpro/projects", async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data/simproProjects.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        res.json(data);
    } catch (error) {
        console.error("Error reading simproProjects.json:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/simpro/projects", async (req, res) => {
    try {
        const { project } = req.body;
        if (!project || !project.id) {
            return res.status(400).json({ error: "Project data with id is required" });
        }
        
        const filePath = path.join(__dirname, '../data/simproProjects.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Check if project with this id already exists
        const existingIndex = data.projects.findIndex(p => p.id === project.id);
        
        if (existingIndex >= 0) {
            // Update existing project
            data.projects[existingIndex] = { ...data.projects[existingIndex], ...project };
        } else {
            // Add new project
            data.projects.push(project);
        }
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true, project: existingIndex >= 0 ? data.projects[existingIndex] : project });
    } catch (error) {
        console.error("Error writing simproProjects.json:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/simpro/projects/batch", async (req, res) => {
    try {
        const { projects } = req.body;
        if (!Array.isArray(projects)) {
            return res.status(400).json({ error: "Projects array is required" });
        }
        
        const filePath = path.join(__dirname, '../data/simproProjects.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
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
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true, count: projects.length });
    } catch (error) {
        console.error("Error batch writing simproProjects.json:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/simpro/projects/schedules", async (req, res) => {
    try {
        const { jobSchedules } = req.body;
        if (!jobSchedules || typeof jobSchedules !== 'object') {
            return res.status(400).json({ error: "jobSchedules object is required" });
        }
        
        const filePath = path.join(__dirname, '../data/simproProjects.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
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
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true, updatedCount });
    } catch (error) {
        console.error("Error updating project schedules:", error);
        res.status(500).json({ error: error.message });
    }
});
// ----------------- START SERVER -----------------
app.listen(3001, () => console.log("API running on http://localhost:3001"));