import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../logger/logger.js';

/**
 * HTTP request logging with a per-request id.
 * The request id is echoed back in the `x-request-id` response header so a
 * user-reported failure can be matched to its exact log entries.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] ?? randomUUID(),
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      userId: req.raw?.user?.id,
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});

export function attachRequestId(req, res, next) {
  res.setHeader('x-request-id', req.id);
  next();
}
