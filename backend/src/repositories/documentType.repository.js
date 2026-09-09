import database from '../config/database.js';

export class DocumentTypeRepository {
    conn(connection) {
        return connection ?? database.getConnection();
    }

    async findAll({ connection } = {}) {
        const [rows] = await this.conn(connection).query('SELECT * FROM document_types ORDER BY code ASC');
        return rows.map((row) => ({
            code: row.code,
            label: row.label,
            minLength: row.min_length,
            maxLength: row.max_length,
            patternKind: row.pattern_kind,
        }));
    }

    async findByCode(code, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            'SELECT * FROM document_types WHERE code = ? LIMIT 1',
            [code],
        );
        const row = rows[0];
        if (!row) return null;
        return {
            code: row.code,
            label: row.label,
            minLength: row.min_length,
            maxLength: row.max_length,
            patternKind: row.pattern_kind,
        };
    }
}

export const documentTypeRepository = new DocumentTypeRepository();
export default documentTypeRepository;
