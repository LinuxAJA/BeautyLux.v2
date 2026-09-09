import database from '../config/database.js';
import { AuditLog } from '../models/auditLog.model.js';
import { BaseRepository } from './base.repository.js';

const BASE_SELECT = `
    SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS user_name
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
`;

export class AuditRepository extends BaseRepository {
    constructor() {
        super({ table: 'audit_logs', model: AuditLog, sortableColumns: ['id', 'created_at'] });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async record({ userId, action, entity, entityId, changes, ipAddress }, { connection } = {}) {
        return this.create(
            {
                user_id: userId ?? null,
                action,
                entity,
                entity_id: entityId ?? null,
                changes: changes ? JSON.stringify(changes) : null,
                ip_address: ipAddress ?? null,
            },
            { connection },
        );
    }

    async findAll({ userId, entity, page = 1, perPage = 20, connection } = {}) {
        const clauses = [];
        const params = [];

        if (userId) {
            clauses.push('a.user_id = ?');
            params.push(userId);
        }
        if (entity) {
            clauses.push('a.entity = ?');
            params.push(entity);
        }

        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const offset = (Math.max(1, page) - 1) * perPage;

        const conn = this.conn(connection);
        const [countRows] = await conn.query(`SELECT COUNT(*) AS total FROM audit_logs a ${where}`, params);
        const total = Number(countRows[0].total);

        const [rows] = await conn.query(
            `${BASE_SELECT} ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
            [...params, perPage, offset],
        );

        return { rows: rows.map((row) => AuditLog.fromRow(row)), total };
    }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
