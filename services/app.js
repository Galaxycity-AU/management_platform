import express from 'express';
import cors from 'cors';
import db from '../database/database.js';

import projectRoutes from '../database/db_routes/projects.js';
import jobRoutes from '../database/db_routes/jobs.js';
import workerRoutes from '../database/db_routes/workers.js';
import approvalRoutes from '../database/db_routes/approvals.js';
import simproRoutes from '../simpro/simproRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); 

// Test Database Connection
db.getConnection()
    .then(connection => {
        console.log("SQL Database connected successfully");
        connection.release();
    })
    .catch(err => console.error("Database connection error:", err));

// Routes
app.use('/projects', projectRoutes);
app.use('/jobs', jobRoutes);
app.use('/workers', workerRoutes);
app.use('/approvals', approvalRoutes);
app.use('/api/simpro', simproRoutes);
// ----------------- START SERVER -----------------
const API_PORT = process.env.API_PORT || 3001;
app.listen(API_PORT, () => console.log(`API running on http://localhost:${API_PORT}`));