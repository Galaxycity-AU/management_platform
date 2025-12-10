import express from 'express';
import * as controller from '../db_controller/jobsController.js';

const router = express.Router();

router.get('/', controller.getAllJobs);
router.get('/project/:projectId', controller.getJobsByProject);
router.post('/', controller.createJob);
router.put('/:id', controller.updateJob);
router.delete('/:id', controller.deleteJob);

export default router;