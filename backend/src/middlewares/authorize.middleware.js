import { permissionService } from '../services/permission.service.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/** Control grueso por rol, legible directamente en la definición de rutas. */
export function requireRole(...allowedRoles) {
    return function requireRoleMiddleware(req, res, next) {
        if (!req.user) return next(new UnauthorizedError('Debes iniciar sesión para continuar.'));
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError('No tienes permisos para realizar esta acción.'));
        }
        next();
    };
}

/** Control fino contra la caché de permisos por rol. */
export function requirePermission(permissionCode) {
    return function requirePermissionMiddleware(req, res, next) {
        if (!req.user) return next(new UnauthorizedError('Debes iniciar sesión para continuar.'));
        if (!permissionService.hasPermission(req.user.role, permissionCode)) {
            return next(new ForbiddenError('No tienes permisos para realizar esta acción.'));
        }
        next();
    };
}

export default { requireRole, requirePermission };
