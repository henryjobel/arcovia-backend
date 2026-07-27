import multer from 'multer';
import { ValidationError } from '../errors/AppError.js';

/** Memory storage → streamed straight to Cloudinary. Nothing touches disk. */
const ALLOWED_MIMES = new Set([
  // images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/x-icon',
  // video / audio
  'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv', 'application/zip',
]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
  cb(new ValidationError([{ field: 'files', message: `File type not allowed: ${file.mimetype}` }]));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter,
});

export const uploadFiles = upload.array('files', 10);
export const uploadSingle = upload.single('file');
