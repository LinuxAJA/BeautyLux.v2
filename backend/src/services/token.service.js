import { env } from '../config/env.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { generateRawToken, hashToken } from '../utils/cookies.js';
import { UnauthorizedError } from '../utils/errors.js';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.js';
import { auditService } from './audit.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

class TokenService {
    signAccessToken(user) {
        return signAccessToken(user);
    }

    verifyAccessToken(token) {
        return verifyAccessToken(token);
    }

    /** Emite un nuevo refresh token y lo persiste hasheado en `sessions`. */
    async issueRefreshToken(userId, { remember = false, userAgent, ipAddress } = {}) {
        const rawToken = generateRawToken();
        const ttlDays = remember ? env.REFRESH_TTL_REMEMBER_DAYS : env.REFRESH_TTL_DAYS;
        const expiresAt = new Date(Date.now() + ttlDays * DAY_MS);

        await sessionRepository.create({
            userId,
            refreshTokenHash: hashToken(rawToken),
            userAgent,
            ipAddress,
            expiresAt,
            remember,
        });

        return { rawToken, expiresAt, maxAgeMs: remember ? ttlDays * DAY_MS : undefined };
    }

    /**
     * Valida un refresh token, revoca la sesión que lo emitió y devuelve
     * la sesión encontrada. Si el token ya estaba revocado (reutilización),
     * revoca TODAS las sesiones del usuario como medida de contención.
     */
    async consumeRefreshToken(rawToken, { ipAddress } = {}) {
        if (!rawToken) throw new UnauthorizedError('No hay sesión activa.');

        const tokenHash = hashToken(rawToken);
        const session = await sessionRepository.findByTokenHash(tokenHash);

        if (!session) {
            throw new UnauthorizedError('La sesión no es válida. Inicia sesión nuevamente.');
        }

        if (session.revoked_at) {
            await sessionRepository.revokeAllByUser(session.user_id);
            await auditService.record({
                userId: session.user_id,
                action: 'refresh_token_reuse_detected',
                entity: 'sessions',
                entityId: session.id,
                ipAddress,
            });
            throw new UnauthorizedError('Se detectó actividad sospechosa. Inicia sesión nuevamente.');
        }

        if (new Date(session.expires_at).getTime() < Date.now()) {
            throw new UnauthorizedError('La sesión expiró. Inicia sesión nuevamente.');
        }

        await sessionRepository.revoke(session.id);
        return session;
    }

    async revokeByRawToken(rawToken) {
        if (!rawToken) return;
        await sessionRepository.revokeByTokenHash(hashToken(rawToken));
    }

    async revokeAllForUser(userId) {
        await sessionRepository.revokeAllByUser(userId);
    }
}

export const tokenService = new TokenService();
export default tokenService;
