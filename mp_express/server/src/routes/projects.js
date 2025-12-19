import express from 'express';
import * as controller from '../controllers/projectsController.js';

const router = express.Router();

router.get('/', controller.getAllProjects);
router.post('/', controller.createProject);

// Project note routes (must come before /:id routes)
router.get('/:projectId/note', controller.getProjectNote);
router.post('/:projectId/note', controller.saveProjectNote);

router.get('/:id', controller.getProjectById);
router.put('/:id', controller.updateProject);
router.delete('/:id', controller.deleteProject);

export default router;
