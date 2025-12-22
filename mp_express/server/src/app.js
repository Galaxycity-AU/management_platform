import express from 'express';
import cors from 'cors';
import db from './config/database.js';

import projectRoutes from './routes/projects.js';
import jobRoutes from './routes/jobs.js';
import workerRoutes from './routes/workers.js';
import approvalRoutes from './routes/approvals.js';
import simproRoutes from './routes/simpro.js';
import dotenv from 'dotenv';

// Middleware imports
import { requestLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Test Database Connection
db.getConnection()
    .then(connection => {
        console.log("SQL Database connected successfully");
        connection.release();
    })
    .catch(err => console.error("Database connection error:", err));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/simpro', simproRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
