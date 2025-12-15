import express from 'express';

const router = express.Router();

// Placeholder for SimPRO routes
router.get('/projects', (req, res) => {
  res.json({ 
    projects: [], 
    logs: []
  });
});

export default router;
