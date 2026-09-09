import { passwordResetRepository } from '../repositories/passwordReset.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { logger } from '../utils/logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Purga sesiones y tokens de recuperación vencidos. Se ejecuta al arrancar y una vez al día. */
export async function purgeExpiredTokens() {
    try {
        const removedSessions = await sessionRepository.purgeExpired();
        const [result] = await passwordResetRepository
            .conn()
            .query('DELETE FROM password_resets WHERE expires_at < NOW() OR used_at IS NOT NULL');

        logger.info('Limpieza de tokens expirados completada', {
            sessionsRemoved: removedSessions,
            passwordResetsRemoved: result.affectedRows,
        });
    } catch (error) {
        logger.error('Falló la limpieza de tokens expirados', { error: error.message });
    }
}

export function scheduleMaintenance() {
    purgeExpiredTokens();
    return setInterval(purgeExpiredTokens, DAY_MS);
}

export default { purgeExpiredTokens, scheduleMaintenance };
