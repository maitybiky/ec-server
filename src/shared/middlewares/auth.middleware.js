import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function verifyAccessToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Access token missing'));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token'));
  }
}

/** Attaches req.user when a valid token is present; never rejects. */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
    } catch {
      // invalid token on a public route — treat as anonymous
    }
  }
  return next();
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }
  return next();
};

export const requireAdmin = requireRole('admin');
