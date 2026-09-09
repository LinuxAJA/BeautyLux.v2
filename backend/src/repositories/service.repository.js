import database from '../config/database.js';
import { Service } from '../models/service.model.js';
import { BaseRepository } from './base.repository.js';

const BASE_SELECT = `
    SELECT s.*, c.slug AS category_slug, c.name AS category_name
    FROM services s
    LEFT JOIN categories c ON c.id = s.category_id
`;

const SORTABLE = new Set(['id', 'name', 'price', 'duration_minutes', 'created_at']);

export class ServiceRepository extends BaseRepository {
    constructor() {
        super({
            table: 'services',
            model: Service,
            softDelete: true,
            sortableColumns: [...SORTABLE],
        });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async findByIdWithCategory(id, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `${BASE_SELECT} WHERE s.id = ? AND s.deleted_at IS NULL LIMIT 1`,
            [id],
        );
        return Service.fromRow(rows[0]);
    }

    async findBySlug(slug, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `${BASE_SELECT} WHERE s.slug = ? AND s.deleted_at IS NULL LIMIT 1`,
            [slug],
        );
        return Service.fromRow(rows[0]);
    }

    async findAllWithCategory({
        search,
        categorySlug,
        status,
        page = 1,
        perPage = 12,
        orderBy = 'created_at',
        orderDir = 'DESC',
        connection,
    } = {}) {
        const clauses = ['s.deleted_at IS NULL'];
        const params = [];

        if (search) {
            clauses.push('(s.name LIKE ? OR s.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (categorySlug) {
            clauses.push('c.slug = ?');
            params.push(categorySlug);
        }
        if (status) {
            clauses.push('s.status = ?');
            params.push(status);
        }

        const where = `WHERE ${clauses.join(' AND ')}`;
        const safeOrderBy = SORTABLE.has(orderBy) ? `s.${orderBy}` : 's.created_at';
        const safeOrderDir = orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const offset = (Math.max(1, page) - 1) * perPage;

        const conn = this.conn(connection);
        const [countRows] = await conn.query(
            `SELECT COUNT(*) AS total FROM services s LEFT JOIN categories c ON c.id = s.category_id ${where}`,
            params,
        );
        const total = Number(countRows[0].total);

        const [rows] = await conn.query(
            `${BASE_SELECT} ${where} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`,
            [...params, perPage, offset],
        );

        return { rows: rows.map((row) => Service.fromRow(row)), total };
    }

    async slugExists(slug, { excludeId, connection } = {}) {
        return this.existsBy('slug', slug, { excludeId, connection });
    }
}

export const serviceRepository = new ServiceRepository();
export default serviceRepository;
