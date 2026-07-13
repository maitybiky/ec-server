import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  const requestContext = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  };

  if (err instanceof ApiError) {
    // Expected domain errors — warn level, no stack noise.
    logger.warn(
      { ...requestContext, statusCode: err.statusCode, details: err.details },
      err.message,
    );
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    logger.warn({ ...requestContext, field }, 'Duplicate key error');
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // Unexpected — full stack at error level for debugging.
  logger.error({ ...requestContext, err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(req.id ? { requestId: req.id } : {}),
  });
}
