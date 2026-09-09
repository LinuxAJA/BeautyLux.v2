import database from '../config/database.js';
import { documentTypeRepository } from '../repositories/documentType.repository.js';
import { auditService } from '../services/audit.service.js';
import { permissionService } from '../services/permission.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

export const health = asyncHandler(async (req, res) => {
    const isHealthy = await database.healthCheck().catch(() => false);
    ok(res, {
        data: { uptime: process.uptime(), database: isHealthy ? 'up' : 'down' },
        message: isHealthy ? 'El servicio está disponible.' : 'El servicio no puede alcanzar la base de datos.',
    });
});

export const documentTypes = asyncHandler(async (req, res) => {
    const types = await documentTypeRepository.findAll();
    ok(res, { data: types });
});

export const roles = asyncHandler(async (req, res) => {
    const list = await permissionService.listRoles();
    ok(res, { data: list.map((role) => role.toJSON()) });
});

export const permissions = asyncHandler(async (req, res) => {
    const list = await permissionService.listPermissions();
    ok(res, { data: list.map((permission) => permission.toJSON()) });
});

export const auditLogs = asyncHandler(async (req, res) => {
    const { page, perPage } = parsePagination(req.query);
    const { entity, userId } = req.query;
    const { rows, total } = await auditService.list({ userId, entity, page, perPage });
    ok(res, { data: rows.map((log) => log.toJSON()), meta: buildMeta({ page, perPage, total }) });
});

export default { health, documentTypes, roles, permissions, auditLogs };
