import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) return cb(null, true);
    return cb(
      ApiError.badRequest(`Unsupported image type: ${file.mimetype}`),
    );
  },
});
