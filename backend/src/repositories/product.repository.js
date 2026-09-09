import database from '../config/database.js';
import { Product } from '../models/product.model.js';
import { BaseRepository } from './base.repository.js';

const BASE_SELECT = `
    SELECT p.*, c.slug AS category_slug, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

const SORTABLE = new Set(['id', 'name', 'price', 'rating', 'created_at']);

export class ProductRepository extends BaseRepository {
    constructor() {
        super({
            table: 'products',
            model: Product,
            softDelete: true,
            sortableColumns: [...SORTABLE],
        });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async findByIdWithCategory(id, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `${BASE_SELECT} WHERE p.id = ? AND p.deleted_at IS NULL LIMIT 1`,
            [id],
        );
        return Product.fromRow(rows[0]);
    }

    async findBySlug(slug, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `${BASE_SELECT} WHERE p.slug = ? AND p.deleted_at IS NULL LIMIT 1`,
            [slug],
        );
        return Product.fromRow(rows[0]);
    }

    async findAllWithCategory({
        search,
        categorySlug,
        status,
        minPrice,
        maxPrice,
        page = 1,
        perPage = 12,
        orderBy = 'created_at',
        orderDir = 'DESC',
        connection,
    } = {}) {
        const clauses = ['p.deleted_at IS NULL'];
        const params = [];

        if (search) {
            clauses.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (categorySlug) {
            clauses.push('c.slug = ?');
            params.push(categorySlug);
        }
        if (status) {
            clauses.push('p.status = ?');
            params.push(status);
        }
        if (minPrice !== undefined) {
            clauses.push('p.price >= ?');
            params.push(minPrice);
        }
        if (maxPrice !== undefined) {
            clauses.push('p.price <= ?');
            params.push(maxPrice);
        }

        const where = `WHERE ${clauses.join(' AND ')}`;
        const safeOrderBy = SORTABLE.has(orderBy) ? `p.${orderBy}` : 'p.created_at';
        const safeOrderDir = orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const offset = (Math.max(1, page) - 1) * perPage;

        const conn = this.conn(connection);
        const [countRows] = await conn.query(
            `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`,
            params,
        );
        const total = Number(countRows[0].total);

        const [rows] = await conn.query(
            `${BASE_SELECT} ${where} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`,
            [...params, perPage, offset],
        );

        return { rows: rows.map((row) => Product.fromRow(row)), total };
    }

    async skuExists(sku, { excludeId, connection } = {}) {
        return this.existsBy('sku', sku, { excludeId, connection });
    }

    async slugExists(slug, { excludeId, connection } = {}) {
        return this.existsBy('slug', slug, { excludeId, connection });
    }
}

export const productRepository = new ProductRepository();
export default productRepository;
