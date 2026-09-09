import database from '../config/database.js';
import { User } from '../models/usuario.model.js';
import { BaseRepository } from './base.repository.js';

const BASE_SELECT = `
    SELECT u.*, r.name AS role_name, r.label AS role_label
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
`;

export class UserRepository extends BaseRepository {
    constructor() {
        super({
            table: 'users',
            model: User,
            softDelete: true,
            sortableColumns: ['id', 'first_name', 'last_name', 'email', 'status', 'created_at'],
        });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    /** Usuario con su rol resuelto, sin exponer el hash (uso general). */
    async findByIdWithRole(id, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `${BASE_SELECT} WHERE u.id = ? AND u.deleted_at IS NULL LIMIT 1`,
            [id],
        );
        return User.fromRow(rows[0]);
    }

    /** Único punto que devuelve el password_hash: exclusivo para el login. */
    async findByEmailWithPassword(email, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `${BASE_SELECT} WHERE u.email = ? AND u.deleted_at IS NULL LIMIT 1`,
            [email],
        );
        return User.fromRow(rows[0]);
    }

    async findAllWithRole({
        search,
        roleName,
        status,
        page = 1,
        perPage = 10,
        orderBy = 'created_at',
        orderDir = 'DESC',
        connection,
    } = {}) {
        const clauses = ['u.deleted_at IS NULL'];
        const params = [];

        if (search) {
            clauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.document_number LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (roleName) {
            clauses.push('r.name = ?');
            params.push(roleName);
        }
        if (status) {
            clauses.push('u.status = ?');
            params.push(status);
        }

        const where = `WHERE ${clauses.join(' AND ')}`;
        const sortable = new Set(['id', 'first_name', 'last_name', 'email', 'status', 'created_at']);
        const safeOrderBy = sortable.has(orderBy) ? `u.${orderBy}` : 'u.created_at';
        const safeOrderDir = orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const offset = (Math.max(1, page) - 1) * perPage;

        const conn = this.conn(connection);
        const [countRows] = await conn.query(
            `SELECT COUNT(*) AS total FROM users u INNER JOIN roles r ON r.id = u.role_id ${where}`,
            params,
        );
        const total = Number(countRows[0].total);

        const [rows] = await conn.query(
            `${BASE_SELECT} ${where} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`,
            [...params, perPage, offset],
        );

        return { rows: rows.map((row) => User.fromRow(row)), total };
    }

    async emailExists(email, { excludeId, connection } = {}) {
        return this.existsBy('email', email, { excludeId, connection });
    }

    async documentExists(documentType, documentNumber, { excludeId, connection } = {}) {
        const clauses = ['document_type_code = ?', 'document_number = ?', 'deleted_at IS NULL'];
        const params = [documentType, documentNumber];
        if (excludeId) {
            clauses.push('id != ?');
            params.push(excludeId);
        }
        const [rows] = await this.conn(connection).query(
            `SELECT 1 FROM users WHERE ${clauses.join(' AND ')} LIMIT 1`,
            params,
        );
        return rows.length > 0;
    }

    async countActiveAdmins({ excludeId, connection } = {}) {
        const clauses = ["r.name = 'admin'", "u.status = 'active'", 'u.deleted_at IS NULL'];
        const params = [];
        if (excludeId) {
            clauses.push('u.id != ?');
            params.push(excludeId);
        }
        const [rows] = await this.conn(connection).query(
            `SELECT COUNT(*) AS total FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE ${clauses.join(' AND ')}`,
            params,
        );
        return Number(rows[0].total);
    }

    async updatePassword(id, passwordHash, { connection } = {}) {
        return this.update(id, { password_hash: passwordHash }, { connection });
    }

    async updateStatus(id, status, { connection } = {}) {
        return this.update(id, { status }, { connection });
    }

    async touchLastLogin(id, { connection } = {}) {
        await this.conn(connection).query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
    }
}

export const userRepository = new UserRepository();
export default userRepository;
