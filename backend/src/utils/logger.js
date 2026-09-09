import { isTest } from '../config/env.js';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';

const SENSITIVE_KEYS = new Set([
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
]);

/** Reemplaza recursivamente los valores de claves sensibles antes de imprimir. */
function redact(value) {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') {
        const clone = {};
        for (const [key, val] of Object.entries(value)) {
            clone[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(val);
        }
        return clone;
    }
    return value;
}

function log(level, message, meta) {
    if (isTest) return;
    const timestamp = new Date().toISOString();
    const color = COLORS[level] ?? '';
    const prefix = `${color}[${timestamp}] ${level.toUpperCase()}${RESET}`;

    if (meta !== undefined) {
        console.log(prefix, message, redact(meta));
    } else {
        console.log(prefix, message);
    }
}

export const logger = {
    debug: (message, meta) => log('debug', message, meta),
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
};

export default logger;
export { LEVELS };
