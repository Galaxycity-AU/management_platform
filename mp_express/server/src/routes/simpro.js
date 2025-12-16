import express from 'express';
import * as simproController from '../controllers/simProController.js';

const router = express.Router();

// Placeholder for SimPRO routes
router.get('/jobs/:id', simproController.getJobById);
router.get('/schedules', simproController.getAllSchedules);
router.get('/schedules/:id', simproController.getScheduleById);
router.get('/logs/mobileStatus', simproController.getMobileStatusLog);
// router.post('simpro/createScheduleWebhook', simproController.createScheduleWebhook);
// router.get('simpro/projects', simproController.getAllProjects);
// router.post('simpro/projects', simproController.createProject);
// router.post('simpro/projects/batch', simproController.batchCreateProjects);
// router.post('simpro/projects/schedules', simproController.updateProjectSchedules);

export default router;
