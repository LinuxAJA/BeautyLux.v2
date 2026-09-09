import crypto from 'node:crypto';

import { isProduction } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'refresh_token';

/** Parser mínimo de la cabecera Cookie. Evita la dependencia `cookie-parser`. */
export function parseCookies(header = '') {
    const cookies = {};
    if (!header) return cookies;

    for (const pair of header.split(';')) {
        const index = pair.indexOf('=');
        if (index === -1) continue;
        const key = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();
        if (!key) continue;
        try {
            cookies[key] = decodeURIComponent(value);
        } catch {
            cookies[key] = value;
        }
    }
    return cookies;
}

/**
 * Opciones seguras para la cookie de refresh.
 * `maxAge` en milisegundos; si se omite, la cookie es "de sesión"
 * (se pierde al cerrar el navegador) — así se replica el checkbox "Recordarme".
 */
export function refreshCookieOptions(maxAgeMs) {
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/api/auth',
    };
    if (maxAgeMs) options.maxAge = maxAgeMs;
    return options;
}

export function generateRawToken() {
    return crypto.randomBytes(64).toString('hex');
}

export function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export default { parseCookies, refreshCookieOptions, generateRawToken, hashToken, REFRESH_COOKIE_NAME };
