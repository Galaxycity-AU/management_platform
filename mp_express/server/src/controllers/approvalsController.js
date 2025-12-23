import db from '../config/database.js';
import { emitApprovalUpdated, emitJobUpdated, emitStatsUpdated } from '../socket/eventEmitter.js';
import { toMySQLDateTime } from '../utils/helpers.js';

export const getAllApprovals = async (req, res) => {
  try {
    const [approvals] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, p.name as project_name 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN projects p ON j.project_id = p.id
    `);
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getApprovalById = async (req, res) => {
  try {
    const [approval] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, p.name as project_name 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE a.id = ?
    `, [req.params.id]);
    res.json(approval[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateApproval = async (req, res) => {
  try {
    const { approver_id, comments, modified_start, modified_end, status } = req.body;
    const approvalId = req.params.id;
    
    // Convert ISO datetime strings to MySQL format
    const mysqlModifiedStart = toMySQLDateTime(modified_start);
    const mysqlModifiedEnd = toMySQLDateTime(modified_end);
    
    // Update the approval record
    await db.query(
      `UPDATE approvals SET approver_id=?, comments=?, modified_start=?, modified_end=? WHERE id=?`,
      [approver_id, comments, mysqlModifiedStart, mysqlModifiedEnd, approvalId]
    );
    
    // Get the updated approval with job info
    const [updatedApproval] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, j.worker_id, p.name as project_name 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE a.id = ?
    `, [approvalId]);
    
    const approval = updatedApproval[0];
    
    // If a status is provided, update the job status as well
    if (status && approval?.job_id) {
      await db.query(
        `UPDATE jobs SET status = ? WHERE id = ?`,
        [status, approval.job_id]
      );
      
      // Get updated job data
      const [updatedJob] = await db.query('SELECT * FROM jobs WHERE id = ?', [approval.job_id]);
      
      // Emit job updated event
      if (updatedJob[0]) {
        emitJobUpdated(updatedJob[0]);
      }
    }
    
    // Emit approval updated event
    emitApprovalUpdated({ ...approval, status }, status);
    
    // Emit stats update
    emitStatsUpdated({ approvalUpdated: true, approvalId, status });
    
    res.json({ success: true, approval });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteApproval = async (req, res) => {
  try {
    await db.query('DELETE FROM approvals WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve a job - updates both approval and job status
export const approveJob = async (req, res) => {
  try {
    // console.log('Approve Job Request:', req.body);
    const { approver_id, comments, modified_start, modified_end } = req.body;
    const approvalId = req.params.id;
    // console.log('Approval ID:', approvalId);
    
    // First, get the approval to verify it exists and get the job_id
    const [approvalData] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, j.worker_id 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [approvalId]);
    
    const approval = approvalData[0];
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    // console.log('Approval Data:', approval);
    
    // Convert ISO datetime strings to MySQL format
    const mysqlModifiedStart = toMySQLDateTime(modified_start);
    const mysqlModifiedEnd = toMySQLDateTime(modified_end);
    
    // Update the approval record
    await db.query(
      `UPDATE approvals SET approver_id=?, comments=?, modified_start=?, modified_end=? WHERE id=?`,
      [approver_id, comments, mysqlModifiedStart, mysqlModifiedEnd, approvalId]
    );
    
    if (approval.job_id) {
      // Update job status to approved
      await db.query(
        `UPDATE jobs SET status = 'approved' WHERE id = ?`,
        [approval.job_id]
      );
      
      // Get updated job data
      const [updatedJob] = await db.query('SELECT * FROM jobs WHERE id = ?', [approval.job_id]);
      
      // Emit job updated event
      if (updatedJob[0]) {
        emitJobUpdated(updatedJob[0]);
      }
    }
    
    // Get updated approval data for emission
    const [updatedApprovalData] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, j.worker_id 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [approvalId]);
    
    const updatedApproval = updatedApprovalData[0] || approval;
    
    // Emit approval updated event
    emitApprovalUpdated({ ...updatedApproval, status: 'approved' }, 'approved');
    
    // Emit stats update
    emitStatsUpdated({ approvalUpdated: true, approvalId, status: 'approved' });
    
    res.json({ success: true, status: 'approved', approval: updatedApproval });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
};

// Reject a job - updates both approval and job status
export const rejectJob = async (req, res) => {
  try {
    const { approver_id, comments } = req.body;
    const approvalId = req.params.id;
    
    // First, get the approval to verify it exists and get the job_id
    const [approvalData] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, j.worker_id 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [approvalId]);
    
    const approval = approvalData[0];
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    // Update the approval record with rejection reason
    await db.query(
      `UPDATE approvals SET approver_id=?, comments=? WHERE id=?`,
      [approver_id, comments, approvalId]
    );
    
    if (approval.job_id) {
      // Update job status to rejected
      await db.query(
        `UPDATE jobs SET status = 'rejected' WHERE id = ?`,
        [approval.job_id]
      );
      
      // Get updated job data
      const [updatedJob] = await db.query('SELECT * FROM jobs WHERE id = ?', [approval.job_id]);
      
      // Emit job updated event
      if (updatedJob[0]) {
        emitJobUpdated(updatedJob[0]);
      }
    }
    
    // Get updated approval data for emission
    const [updatedApprovalData] = await db.query(`
      SELECT a.*, j.id as job_id, j.project_id, j.worker_id 
      FROM approvals a 
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [approvalId]);
    
    const updatedApproval = updatedApprovalData[0] || approval;
    
    // Emit approval updated event
    emitApprovalUpdated({ ...updatedApproval, status: 'rejected' }, 'rejected');
    
    // Emit stats update
    emitStatsUpdated({ approvalUpdated: true, approvalId, status: 'rejected' });
    
    res.json({ success: true, status: 'rejected', approval: updatedApproval });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
};
