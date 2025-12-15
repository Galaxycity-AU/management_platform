import express from 'express';
import * as controller from '../controllers/approvalsController.js';

const router = express.Router();

router.get('/', controller.getAllApprovals);
router.get('/:id', controller.getApprovalById);
router.put('/:id', controller.updateApproval);
router.delete('/:id', controller.deleteApproval);

export default router;
