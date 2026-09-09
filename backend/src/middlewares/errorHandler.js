import { isProduction } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/** Traduce errores conocidos de MySQL a un AppError legible. */
function fromMysqlError(error) {
    if (error.code === 'ER_DUP_ENTRY') {
        return new AppError('El registro ya existe (valor duplicado)', 409, 'CONFLICT');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
        return new AppError('La referencia enviada no existe', 422, 'INVALID_REFERENCE');
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        return new AppError('No se puede eliminar: el registro está en uso', 409, 'CONFLICT');
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        return new AppError('No se pudo conectar con la base de datos', 503, 'DATABASE_UNAVAILABLE');
    }
    return null;
}

/** Middleware final de errores: única puerta de salida de cualquier fallo. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
    const mapped = error instanceof AppError ? error : fromMysqlError(error);
    const isOperational = mapped instanceof AppError;
    const finalError = mapped ?? new AppError('Ocurrió un error inesperado', 500, 'INTERNAL_ERROR');

    if (!isOperational || finalError.statusCode >= 500) {
        logger.error(error.message, { requestId: req.id, stack: error.stack });
    }

    const body = {
        success: false,
        message: finalError.message,
        code: finalError.code,
    };

    if (finalError.errors?.length) body.errors = finalError.errors;
    if (!isProduction && !isOperational) body.stack = error.stack;

    res.status(finalError.statusCode).json(body);
}

export default errorHandler;
