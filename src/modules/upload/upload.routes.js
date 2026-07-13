import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import {
  verifyAccessToken,
  requireAdmin,
} from '../../shared/middlewares/auth.middleware.js';
import { uploadImages } from '../../shared/middlewares/upload.middleware.js';

export const uploadRoutes = Router();

uploadRoutes.post(
  '/',
  verifyAccessToken,
  requireAdmin,
  uploadImages.single('image'),
  uploadController.uploadImage,
);
