import { ValidationError } from '../errors/index.js';

/**
 * Zod validation middleware for Express routes
 * Validates body, query, and params against the provided Zod schema
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request data with parsed/sanitized versions
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\.?/, ''),
        location: err.path[0] || 'body',
        message: err.message,
      }));

      return next(new ValidationError('Request validation failed', formattedErrors));
    }

    next(error);
  }
};
