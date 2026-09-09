import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { isTest } from '../config/env.js';
import { TooManyRequestsError } from '../utils/errors.js';

/** Handler uniforme: delega en errorHandler en vez de responder aquí mismo. */
function limitHandler(message) {
    return (req, res, next) => next(new TooManyRequestsError(message));
}

const skip = () => isTest;

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: limitHandler('Demasiadas peticiones, inténtalo de nuevo en unos minutos.'),
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${(req.body?.email || '').toLowerCase()}`,
    handler: limitHandler('Demasiados intentos de inicio de sesión. Espera unos minutos.'),
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: limitHandler('Demasiados registros desde esta red. Inténtalo más tarde.'),
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${(req.body?.email || '').toLowerCase()}`,
    handler: limitHandler('Demasiadas solicitudes de recuperación. Inténtalo más tarde.'),
});

export default { generalLimiter, loginLimiter, registerLimiter, forgotPasswordLimiter };
