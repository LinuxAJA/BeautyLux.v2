import { auditRepository } from '../repositories/audit.repository.js';
import { logger } from '../utils/logger.js';

class AuditService {
    /** Nunca debe romper el flujo principal: si falla, solo se registra en logs. */
    async record({ userId, action, entity, entityId, changes, ipAddress }) {
        try {
            await auditRepository.record({ userId, action, entity, entityId, changes, ipAddress });
        } catch (error) {
            logger.error('No se pudo registrar la auditoría', { action, entity, error: error.message });
        }
    }

    async list({ userId, entity, page, perPage }) {
        return auditRepository.findAll({ userId, entity, page, perPage });
    }
}

export const auditService = new AuditService();
export default auditService;
