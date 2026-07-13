import { Router } from 'express';
import { categoryController } from './category.controller.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from './category.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  verifyAccessToken,
  requireAdmin,
  optionalAuth,
} from '../../shared/middlewares/auth.middleware.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', optionalAuth, categoryController.list);
categoryRoutes.post(
  '/',
  verifyAccessToken,
  requireAdmin,
  validate(createCategorySchema),
  categoryController.create,
);
categoryRoutes.patch(
  '/:id',
  verifyAccessToken,
  requireAdmin,
  validate(updateCategorySchema),
  categoryController.update,
);
categoryRoutes.delete(
  '/:id',
  verifyAccessToken,
  requireAdmin,
  validate(categoryIdSchema),
  categoryController.disable,
);
