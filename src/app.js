import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './shared/config/env.js';
import { errorMiddleware } from './shared/middlewares/error.middleware.js';
import {
  httpLogger,
  attachRequestId,
} from './shared/middlewares/logging.middleware.js';
import { ApiError } from './shared/utils/ApiError.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { categoryRoutes } from './modules/category/category.routes.js';
import { productRoutes } from './modules/product/product.routes.js';
import { discountRoutes } from './modules/discount/discount.routes.js';
import { cartRoutes } from './modules/cart/cart.routes.js';
import { orderRoutes } from './modules/order/order.routes.js';
import { addressRoutes } from './modules/address/address.routes.js';
import { homepageRoutes } from './modules/homepage/homepage.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';

export function createApp() {
  const app = express();

  app.use(httpLogger);
  app.use(attachRequestId);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static(path.resolve(env.UPLOADS_DIR)));

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'OK' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/discounts', discountRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/homepage', homepageRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use((req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
  });
  app.use(errorMiddleware);

  return app;
}
