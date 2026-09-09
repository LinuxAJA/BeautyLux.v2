import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

/** Firma un access token corto con los datos mínimos para autorizar. */
export function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role.name, status: user.status },
        env.JWT_ACCESS_SECRET,
        {
            expiresIn: env.JWT_ACCESS_EXPIRES_IN,
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
        },
    );
}

/** Verifica un access token; lanza UnauthorizedError con código específico si expiró. */
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, env.JWT_ACCESS_SECRET, {
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('El token de acceso expiró', 'TOKEN_EXPIRED');
        }
        throw new UnauthorizedError('Token de acceso inválido', 'UNAUTHENTICATED');
    }
}

export default { signAccessToken, verifyAccessToken };
