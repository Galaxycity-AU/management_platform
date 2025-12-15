import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// API Routes - all prefixed with /api to avoid conflicts with React Router
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/simpro', simproRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientBuildPath));
    
    // Catch-all handler: send back React's index.html file for any non-API routes
    // This allows React Router to handle client-side routing
    app.get('*', (req, res, next) => {
        // Don't serve index.html for API routes - let 404 handler deal with them
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// 404 handler (must be after all routes)
// In production, this only catches unmatched API routes
// In development, this catches all unmatched routes
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
