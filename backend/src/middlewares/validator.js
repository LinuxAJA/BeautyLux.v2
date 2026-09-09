import { BadRequestError } from '../utils/errors.js';

/**
 * Valida `req[source]` contra un esquema zod y lanza BadRequestError con el
 * arreglo `errors` (mismos nombres de campo que el frontend) si falla.
 *
 * Express 5 expone `req.query` como una propiedad de solo lectura, así que
 * el resultado ya tipado/saneado se guarda en `req.validatedQuery` cuando
 * `source === 'query'`; para `body` y `params` sí se puede reasignar.
 */
export function validate(schema, source = 'body') {
    return function validateMiddleware(req, res, next) {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.') || source,
                message: issue.message,
            }));
            return next(new BadRequestError('Los datos enviados no son válidos', errors));
        }

        if (source === 'query') {
            req.validatedQuery = result.data;
        } else {
            req[source] = result.data;
        }
        next();
    };
}

export default validate;
