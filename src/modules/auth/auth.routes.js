import { Router } from 'express';
import { authController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { verifyAccessToken } from '../../shared/middlewares/auth.middleware.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', verifyAccessToken, authController.logout);
authRoutes.get('/me', verifyAccessToken, authController.me);
