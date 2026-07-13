import { loggerFor } from '../logger/logger.js';

const log = loggerFor('background-job');

/**
 * Fire-and-forget helper with exponential-backoff retries.
 * Never throws — failures are logged, callers are not blocked.
 *
 * On final failure the job's payload is logged with `recoverable: true`
 * so it can be found in logs/app.log and replayed manually.
 */
export function fireAndForget(
  label,
  fn,
  { attempts = 3, baseDelayMs = 2000, payload = undefined } = {},
) {
  (async () => {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await fn();
        if (attempt > 1) {
          log.info({ job: label, attempt }, 'job succeeded after retry');
        }
        return;
      } catch (err) {
        log.warn(
          { job: label, attempt, attempts, err: err.message },
          'job attempt failed',
        );
        if (attempt < attempts) {
          await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
        }
      }
    }
    log.error(
      { job: label, recoverable: true, payload },
      'job failed permanently — payload logged for manual recovery',
    );
  })();
}
