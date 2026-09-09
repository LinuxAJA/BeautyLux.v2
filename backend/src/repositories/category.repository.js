import database from '../config/database.js';
import { Category } from '../models/category.model.js';
import { BaseRepository } from './base.repository.js';

export class CategoryRepository extends BaseRepository {
    constructor() {
        super({
            table: 'categories',
            model: Category,
            sortableColumns: ['id', 'name', 'created_at'],
        });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async findByType(type, { status, connection } = {}) {
        const clauses = ['type = ?'];
        const params = [type];
        if (status) {
            clauses.push('status = ?');
            params.push(status);
        }
        const [rows] = await this.conn(connection).query(
            `SELECT * FROM categories WHERE ${clauses.join(' AND ')} ORDER BY name ASC`,
            params,
        );
        return rows.map((row) => Category.fromRow(row));
    }

    async findBySlug(slug, { connection } = {}) {
        return this.findOneBy('slug', slug, { connection });
    }

    async slugExists(slug, { excludeId, connection } = {}) {
        return this.existsBy('slug', slug, { excludeId, connection });
    }

    async countItems(categoryId, { connection } = {}) {
        const conn = this.conn(connection);
        const [[products]] = await conn.query(
            'SELECT COUNT(*) AS total FROM products WHERE category_id = ? AND deleted_at IS NULL',
            [categoryId],
        );
        const [[services]] = await conn.query(
            'SELECT COUNT(*) AS total FROM services WHERE category_id = ? AND deleted_at IS NULL',
            [categoryId],
        );
        return Number(products.total) + Number(services.total);
    }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
