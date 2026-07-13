import { Router } from 'express';
import { cartController } from './cart.controller.js';
import {
  addItemSchema,
  updateItemSchema,
  removeItemSchema,
} from './cart.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { verifyAccessToken } from '../../shared/middlewares/auth.middleware.js';

export const cartRoutes = Router();

cartRoutes.use(verifyAccessToken);

cartRoutes.get('/', cartController.get);
cartRoutes.post('/items', validate(addItemSchema), cartController.addItem);
cartRoutes.patch(
  '/items/:productId',
  validate(updateItemSchema),
  cartController.updateItem,
);
cartRoutes.delete(
  '/items/:productId',
  validate(removeItemSchema),
  cartController.removeItem,
);
