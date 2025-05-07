/**
 * API endpoints for tracking CSV import progress
 */

import { Router } from 'express';
import * as progressTracker from '../utils/importProgressTracker';

const router = Router();

/**
 * Get status of a specific import job
 */
router.get('/import-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  // Check if user is authenticated
  if (!(req as any).user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = (req as any).user.id;
  const jobStatus = progressTracker.getImportJobStatus(jobId);
  
  if (!jobStatus) {
    return res.status(404).json({ message: "Import job not found" });
  }
  
  // Only allow users to view their own import jobs
  if (jobStatus.userId !== userId) {
    return res.status(403).json({ message: "Not allowed to view this import job" });
  }
  
  res.json(jobStatus);
});

/**
 * Get all import jobs for the current user
 */
router.get('/import-jobs', (req, res) => {
  // Check if user is authenticated
  if (!(req as any).user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = (req as any).user.id;
  const jobs = progressTracker.getUserImportJobs(userId);
  
  res.json(jobs);
});

export default router;