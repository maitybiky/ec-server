import pino from 'pino';
import { env } from '../config/env.js';

/**
 * App-wide logger.
 *  - dev:  pretty console output + JSON file log
 *  - prod: JSON to stdout (for host log collectors) + JSON file log
 *
 * File logs live in backend/logs/app.log so events survive restarts and
 * failed side-effect payloads can be recovered/replayed (see failed-job
 * entries logged with `recoverable: true`).
 */
const targets = [
  env.NODE_ENV === 'production'
    ? { target: 'pino/file', options: { destination: 1 }, level: env.LOG_LEVEL }
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        level: env.LOG_LEVEL,
      },
  {
    target: 'pino/file',
    options: { destination: 'logs/app.log', mkdir: true },
    level: env.LOG_LEVEL,
  },
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  transport: { targets },
});

/** Child logger scoped to a subsystem, e.g. loggerFor('email'). */
export const loggerFor = (module) => logger.child({ module });
