import express from 'express';
import * as controller from '../db_controller/projectsController.js';

const router = express.Router();

router.get('/', controller.getAllProjects);
router.get('/:id', controller.getProjectById);
router.post('/', controller.createProject);
router.put('/:id', controller.updateProject);
router.delete('/:id', controller.deleteProject);

export default router;