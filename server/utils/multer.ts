import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Filter function to validate file types
function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Define allowed mime types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/octet-stream',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// Export configured multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  }
});

// Helper function to convert a relative path to an absolute path
export function getAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

// Helper function to convert an absolute path to a relative path
export function getRelativePath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}
