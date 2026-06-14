import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request }                     from 'express';

const storage = multer.memoryStorage(); // keep file in buffer, don't write to disk

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

export const uploadPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files:    1,
  },
});