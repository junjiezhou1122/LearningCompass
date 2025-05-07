/**
 * This module provides a way to track progress for background import jobs
 */

export type ImportJobStatus = {
  id: string;
  fileType: 'online' | 'university';
  filePath: string;
  totalRecords: number;
  recordsProcessed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  warnings: string[];
  userId: number;
};

// In-memory store for import jobs
const importJobs = new Map<string, ImportJobStatus>();

// Helper to generate a unique job ID
const generateJobId = (): string => {
  return `import_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Create a new import job tracking entry
 */
export const createImportJob = (
  userId: number,
  fileType: 'online' | 'university',
  filePath: string,
  totalRecords: number
): string => {
  const jobId = generateJobId();
  
  importJobs.set(jobId, {
    id: jobId,
    fileType,
    filePath,
    totalRecords,
    recordsProcessed: 0,
    status: 'pending',
    startTime: new Date(),
    warnings: [],
    userId
  });
  
  return jobId;
};

/**
 * Get the status of an import job
 */
export const getImportJobStatus = (jobId: string): ImportJobStatus | undefined => {
  return importJobs.get(jobId);
};

/**
 * Get all import jobs for a user
 */
export const getUserImportJobs = (userId: number): ImportJobStatus[] => {
  return Array.from(importJobs.values())
    .filter(job => job.userId === userId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

/**
 * Update the progress of an import job
 */
export const updateImportJobProgress = (
  jobId: string, 
  recordsProcessed: number,
  status?: 'processing' | 'completed' | 'failed'
): void => {
  const job = importJobs.get(jobId);
  if (!job) return;
  
  job.recordsProcessed = recordsProcessed;
  
  if (status) {
    job.status = status;
    
    if (status === 'completed' || status === 'failed') {
      job.endTime = new Date();
    }
  }
  
  importJobs.set(jobId, job);
};

/**
 * Add a warning message to an import job
 */
export const addImportJobWarning = (jobId: string, warning: string): void => {
  const job = importJobs.get(jobId);
  if (!job) return;
  
  job.warnings.push(warning);
  importJobs.set(jobId, job);
};

/**
 * Set an error for an import job
 */
export const setImportJobError = (jobId: string, error: string): void => {
  const job = importJobs.get(jobId);
  if (!job) return;
  
  job.error = error;
  job.status = 'failed';
  job.endTime = new Date();
  
  importJobs.set(jobId, job);
};

/**
 * Clear old import jobs (older than 24 hours)
 */
export const cleanupOldImportJobs = (): void => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  for (const [jobId, job] of importJobs.entries()) {
    // Remove completed or failed jobs older than 24 hours
    if ((job.status === 'completed' || job.status === 'failed') && 
        job.startTime < oneDayAgo) {
      importJobs.delete(jobId);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOldImportJobs, 60 * 60 * 1000);