import { Router } from 'express';
import { homepageController } from './homepage.controller.js';
import { updateHomepageSchema } from './homepage.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  verifyAccessToken,
  requireAdmin,
} from '../../shared/middlewares/auth.middleware.js';

export const homepageRoutes = Router();

homepageRoutes.get('/', homepageController.get);
homepageRoutes.patch(
  '/',
  verifyAccessToken,
  requireAdmin,
  validate(updateHomepageSchema),
  homepageController.update,
);
