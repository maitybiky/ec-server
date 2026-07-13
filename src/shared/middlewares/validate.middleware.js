import { ApiError } from '../utils/ApiError.js';

/**
 * Runs a zod schema against { body, query, params }.
 * Schema shape: z.object({ body: ..., query: ..., params: ... }) — all optional keys.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.params !== undefined) req.params = result.data.params;
  // req.query is a getter-only proxy in Express 5 / read-only in some setups;
  // stash parsed query separately so handlers get coerced values.
  req.validatedQuery = result.data.query ?? req.query;

  return next();
};
