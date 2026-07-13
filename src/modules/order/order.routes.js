import { Router } from 'express';
import { orderController } from './order.controller.js';
import {
  placeOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  updateStatusSchema,
  exportOrdersSchema,
} from './order.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  verifyAccessToken,
  requireAdmin,
} from '../../shared/middlewares/auth.middleware.js';

export const orderRoutes = Router();

orderRoutes.use(verifyAccessToken);

// Customer
orderRoutes.post('/', validate(placeOrderSchema), orderController.place);
orderRoutes.get('/my', validate(listOrdersSchema), orderController.myOrders);
orderRoutes.get('/my/:id', validate(orderIdSchema), orderController.myOrderById);

// Admin
orderRoutes.get(
  '/',
  requireAdmin,
  validate(listOrdersSchema),
  orderController.adminList,
);
orderRoutes.get(
  '/export',
  requireAdmin,
  validate(exportOrdersSchema),
  orderController.exportCsv,
);
orderRoutes.patch(
  '/:id/status',
  requireAdmin,
  validate(updateStatusSchema),
  orderController.updateStatus,
);
