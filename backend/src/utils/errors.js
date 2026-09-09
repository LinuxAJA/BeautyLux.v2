/**
 * Error de dominio: el único tipo de error que los services deben lanzar.
 * `errorHandler` lo traduce directamente a la respuesta HTTP.
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', errors = []) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Los datos enviados no son válidos', errors = [], code = 'VALIDATION_ERROR') {
        super(message, 400, code, errors);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'No autenticado', code = 'UNAUTHENTICATED') {
        super(message, 401, code);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'No tienes permisos para realizar esta acción', code = 'FORBIDDEN') {
        super(message, 403, code);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'El recurso solicitado no existe', code = 'NOT_FOUND') {
        super(message, 404, code);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message = 'El recurso ya existe', code = 'CONFLICT') {
        super(message, 409, code);
        this.name = 'ConflictError';
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = 'Demasiados intentos, inténtalo más tarde', code = 'RATE_LIMITED') {
        super(message, 429, code);
        this.name = 'TooManyRequestsError';
    }
}
