import express from 'express';
import * as controller from './simproController.js';

const router = express.Router();

// SIMPRO API PROXY ROUTES
router.get('/jobs/:id', controller.getJobById);
router.get('/schedules', controller.getAllSchedules);
router.get('/schedules/:id', controller.getScheduleById);
router.get('/logs/mobileStatus', controller.getMobileStatusLog);
router.post('/createScheduleWebhook', controller.createScheduleWebhook);

// SIMPRO PROJECTS JSON ROUTES
router.get('/projects', controller.getAllProjects);
router.post('/projects', controller.createProject);
router.post('/projects/batch', controller.batchCreateProjects);
router.post('/projects/schedules', controller.updateProjectSchedules);

export default router;
