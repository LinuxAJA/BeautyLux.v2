import crypto from 'node:crypto';

import { logger } from '../utils/logger.js';

/** Asigna un id a cada petición y registra método, ruta, estado y duración. */
export function requestLogger(req, res, next) {
    req.id = crypto.randomUUID();
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} — ${durationMs.toFixed(1)}ms`, {
            requestId: req.id,
        });
    });

    next();
}

export default requestLogger;
