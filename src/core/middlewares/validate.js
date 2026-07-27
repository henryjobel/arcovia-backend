import { ValidationError } from '../errors/AppError.js';

/**
 * Zod validation middleware.
 * Usage: validate({ body: createUserSchema, query: listQuerySchema, params: idParamSchema })
 * Parsed (and stripped) values replace the originals, so handlers only ever
 * see validated data.
 */
export const validate = (schemas) => (req, res, next) => {
  const errors = [];

  for (const key of ['params', 'query', 'body']) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key]);
    if (result.success) {
      req[key] = result.data;
    } else {
      errors.push(
        ...result.error.issues.map((i) => ({
          field: [key === 'body' ? null : key, ...i.path].filter(Boolean).join('.') || key,
          message: i.message,
        }))
      );
    }
  }

  if (errors.length) return next(new ValidationError(errors));
  next();
};
