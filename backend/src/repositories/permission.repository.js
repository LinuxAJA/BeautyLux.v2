import database from '../config/database.js';
import { Permission } from '../models/permission.model.js';
import { BaseRepository } from './base.repository.js';

export class PermissionRepository extends BaseRepository {
    constructor() {
        super({ table: 'permissions', model: Permission, sortableColumns: ['id', 'code', 'module'] });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async findAll({ connection } = {}) {
        const [rows] = await this.conn(connection).query('SELECT * FROM permissions ORDER BY module, action');
        return rows.map((row) => Permission.fromRow(row));
    }

    /** Devuelve { admin: Set('users.create', ...), employee: Set(...), client: Set(...) }. */
    async findAllGroupedByRole({ connection } = {}) {
        const [rows] = await this.conn(connection).query(`
            SELECT r.name AS role_name, p.code AS permission_code
            FROM role_permissions rp
            INNER JOIN roles r ON r.id = rp.role_id
            INNER JOIN permissions p ON p.id = rp.permission_id
        `);

        const grouped = {};
        for (const row of rows) {
            if (!grouped[row.role_name]) grouped[row.role_name] = new Set();
            grouped[row.role_name].add(row.permission_code);
        }
        return grouped;
    }
}

export const permissionRepository = new PermissionRepository();
export default permissionRepository;
