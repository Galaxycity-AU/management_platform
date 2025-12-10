import express from 'express';
import * as controller from '../db_controller/workersController.js';

const router = express.Router();

router.get('/', controller.getAllWorkers);
router.get('/:id', controller.getWorkerById);
router.post('/', controller.createWorker);
router.put('/:id', controller.updateWorker);
router.delete('/:id', controller.deleteWorker);

export default router;