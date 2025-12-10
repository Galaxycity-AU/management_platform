import express from 'express';
import * as controller from '../db_controller/approvalsController.js';

const router = express.Router();

router.get('/job/:jobId', controller.getApprovalsByJob);
router.post('/', controller.createApproval);
router.put('/:id', controller.updateApproval);
router.delete('/:id', controller.deleteApproval);

export default router;