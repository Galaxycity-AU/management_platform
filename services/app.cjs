const express = require("express");
const cors = require("cors");
const { sequelize, Project, Job, Worker, Approval } = require("../models/models");

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

// ----------------- START SERVER -----------------
app.listen(3001, () => console.log("API running on http://localhost:3001"));
