import { Router } from 'express';
import { productController } from './product.controller.js';
import {
  browseProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  removeImageSchema,
} from './product.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  verifyAccessToken,
  requireAdmin,
  optionalAuth,
} from '../../shared/middlewares/auth.middleware.js';
import { uploadImages } from '../../shared/middlewares/upload.middleware.js';

export const productRoutes = Router();

productRoutes.get(
  '/',
  optionalAuth,
  validate(browseProductsSchema),
  productController.browse,
);
productRoutes.get('/:id', validate(productIdSchema), productController.getById);

productRoutes.post(
  '/',
  verifyAccessToken,
  requireAdmin,
  uploadImages.array('images', 6),
  validate(createProductSchema),
  productController.create,
);
productRoutes.patch(
  '/:id',
  verifyAccessToken,
  requireAdmin,
  uploadImages.array('images', 6),
  validate(updateProductSchema),
  productController.update,
);
productRoutes.delete(
  '/:id/images/:key',
  verifyAccessToken,
  requireAdmin,
  validate(removeImageSchema),
  productController.removeImage,
);
productRoutes.delete(
  '/:id',
  verifyAccessToken,
  requireAdmin,
  validate(productIdSchema),
  productController.remove,
);
