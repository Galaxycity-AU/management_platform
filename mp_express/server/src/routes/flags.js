/**
 * Flag Routes
 * 
 * API endpoints for managing job flags
 */

import express from 'express';
import { refreshJobFlags, refreshJobFlag } from '../service/flagRefreshService.js';

const router = express.Router();

/**
 * POST /api/flags/refresh
 * Manually trigger a refresh of all stale job flags
 */
router.post('/refresh', async (req, res) => {
  try {
    const staleMinutes = parseInt(req.query.staleMinutes) || 5;
    const result = await refreshJobFlags(staleMinutes);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/flags/refresh/:jobId
 * Refresh flags for a specific job
 */
router.post('/refresh/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const result = await refreshJobFlag(jobId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

