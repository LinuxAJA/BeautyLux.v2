import { permissionRepository } from '../repositories/permission.repository.js';
import { roleRepository } from '../repositories/role.repository.js';
import { logger } from '../utils/logger.js';

/**
 * Mantiene en memoria el mapa rol → Set<código de permiso> para que
 * autorizar una petición no cueste una consulta a la base de datos.
 * Se recarga una vez al arrancar el servidor.
 */
class PermissionService {
    constructor() {
        this.cache = {};
        this.roles = [];
    }

    async warmCache() {
        this.cache = await permissionRepository.findAllGroupedByRole();
        this.roles = await roleRepository.findAll();
        logger.info('Caché de permisos cargada', {
            roles: Object.keys(this.cache),
            totalPermisos: Object.values(this.cache).reduce((sum, set) => sum + set.size, 0),
        });
    }

    hasPermission(roleName, permissionCode) {
        return this.cache[roleName]?.has(permissionCode) ?? false;
    }

    permissionsFor(roleName) {
        return [...(this.cache[roleName] ?? [])];
    }

    async listPermissions() {
        return permissionRepository.findAll();
    }

    async listRoles() {
        return this.roles.length ? this.roles : roleRepository.findAll();
    }
}

export const permissionService = new PermissionService();
export default permissionService;
