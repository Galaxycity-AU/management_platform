import express from 'express';
import cors from 'cors';
import { sequelize, Project, Job, Worker, Approval } from '../models/models/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Create database connection pool
const db = mysql.createPool({
    database: process.env.DATABASE_NAME,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
db.getConnection()
    .then(connection => {
        console.log("SQL Database connected successfully");
        connection.release();
    })
    .catch(err => console.error("Database connection error:", err));

// ----------------- PROJECT ROUTES -----------------
app.get("/projects", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM projects");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------- JOB ROUTES -----------------
app.get("/jobs", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM jobs");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/jobs/project/:projectId", async (req, res) => {
    try {
        const { projectId } = req.params;
        const [rows] = await db.query("SELECT * FROM jobs WHERE projectId = ?", [projectId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/jobs/:id/justify", async (req, res) => {
    try {
        const { id } = req.params;
        const { approverId, status, comments } = req.body;
        
        // Check if job exists
        const [jobs] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
        if (jobs.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (status !== undefined) {
            updates.push("status = ?");
            values.push(status);
        }
        if (approverId !== undefined) {
            updates.push("approverId = ?");
            values.push(approverId);
        }
        if (comments !== undefined) {
            updates.push("comments = ?");
            values.push(comments);
        }
        
        if (updates.length > 0) {
            values.push(id);
            await db.query(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`, values);
        }
        
        // Fetch updated job
        const [updatedJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
        res.json(updatedJob[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/jobs/:id/timeframe", async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime } = req.body;
        
        // Check if job exists
        const [jobs] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
        if (jobs.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (startTime !== undefined) {
            updates.push("editedInTime = ?");
            values.push(startTime);
        }
        if (endTime !== undefined) {
            updates.push("editedOutTime = ?");
            values.push(endTime);
        }
        
        if (updates.length > 0) {
            values.push(id);
            await db.query(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`, values);
        }
        
        // Fetch updated job
        const [updatedJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
        res.json(updatedJob[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/jobs", async (req, res) => {
    try {
        const jobData = req.body;
        const fields = Object.keys(jobData);
        const values = Object.values(jobData);
        const placeholders = fields.map(() => "?").join(", ");
        
        const [result] = await db.query(
            `INSERT INTO jobs (${fields.join(", ")}) VALUES (${placeholders})`,
            values
        );
        
        const [newJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [result.insertId]);
        res.status(201).json(newJob[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------- WORKER ROUTES -----------------
app.get("/workers", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM workers");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

// ----------------- START SERVER -----------------
const API_PORT = process.env.API_PORT || 3001;
app.listen(API_PORT, () => console.log(`API running on http://localhost:${API_PORT}`));