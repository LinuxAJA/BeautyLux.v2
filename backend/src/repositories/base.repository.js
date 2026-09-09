import database from '../config/database.js';

/**
 * Repositorio base reutilizado por todos los repositorios concretos.
 * Encapsula el acceso al pool y las operaciones CRUD genéricas.
 * Ningún método de esta clase decide reglas de negocio: solo consulta.
 */
export class BaseRepository {
    constructor({ table, primaryKey = 'id', model, softDelete = false, sortableColumns = [] }) {
        this.table = table;
        this.primaryKey = primaryKey;
        this.model = model;
        this.softDelete = softDelete;
        this.sortableColumns = new Set(sortableColumns.length ? sortableColumns : [primaryKey]);
    }

    /** Conexión a usar: la de una transacción si se pasa, si no el pool. */
    conn(connection) {
        return connection ?? database.getConnection();
    }

    /** Fragmento WHERE que excluye los registros borrados lógicamente. */
    notDeletedClause() {
        return this.softDelete ? `${this.table}.deleted_at IS NULL` : null;
    }

    toModel(row) {
        if (!row) return null;
        return this.model ? this.model.fromRow(row) : row;
    }

    async findById(id, { connection } = {}) {
        const clauses = [`${this.primaryKey} = ?`];
        const params = [id];
        const notDeleted = this.notDeletedClause();
        if (notDeleted) clauses.push(notDeleted);

        const [rows] = await this.conn(connection).query(
            `SELECT * FROM ${this.table} WHERE ${clauses.join(' AND ')} LIMIT 1`,
            params,
        );
        return this.toModel(rows[0]);
    }

    async findOneBy(column, value, { connection } = {}) {
        const clauses = [`${column} = ?`];
        const params = [value];
        const notDeleted = this.notDeletedClause();
        if (notDeleted) clauses.push(notDeleted);

        const [rows] = await this.conn(connection).query(
            `SELECT * FROM ${this.table} WHERE ${clauses.join(' AND ')} LIMIT 1`,
            params,
        );
        return this.toModel(rows[0]);
    }

    async existsBy(column, value, { excludeId, connection } = {}) {
        const clauses = [`${column} = ?`];
        const params = [value];
        const notDeleted = this.notDeletedClause();
        if (notDeleted) clauses.push(notDeleted);
        if (excludeId) {
            clauses.push(`${this.primaryKey} != ?`);
            params.push(excludeId);
        }

        const [rows] = await this.conn(connection).query(
            `SELECT 1 FROM ${this.table} WHERE ${clauses.join(' AND ')} LIMIT 1`,
            params,
        );
        return rows.length > 0;
    }

    async count({ connection } = {}) {
        const notDeleted = this.notDeletedClause();
        const where = notDeleted ? `WHERE ${notDeleted}` : '';
        const [rows] = await this.conn(connection).query(
            `SELECT COUNT(*) AS total FROM ${this.table} ${where}`,
        );
        return Number(rows[0].total);
    }

    /**
     * Listado genérico con búsqueda, filtros exactos y paginación.
     * @param {object} opts
     * @param {string[]} opts.searchColumns columnas incluidas en el LIKE de `search`
     * @param {object} opts.filters { columna: valor } — igualdad exacta, solo si el valor no es undefined
     */
    async findAll({
        searchColumns = [],
        search,
        filters = {},
        page = 1,
        perPage = 10,
        orderBy,
        orderDir = 'ASC',
        connection,
    } = {}) {
        const clauses = [];
        const params = [];

        const notDeleted = this.notDeletedClause();
        if (notDeleted) clauses.push(notDeleted);

        if (search && searchColumns.length) {
            const likeClauses = searchColumns.map((col) => `${col} LIKE ?`);
            clauses.push(`(${likeClauses.join(' OR ')})`);
            searchColumns.forEach(() => params.push(`%${search}%`));
        }

        for (const [column, value] of Object.entries(filters)) {
            if (value === undefined || value === null || value === '') continue;
            clauses.push(`${column} = ?`);
            params.push(value);
        }

        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

        const safeOrderBy = this.sortableColumns.has(orderBy) ? orderBy : this.primaryKey;
        const safeOrderDir = orderDir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const offset = (Math.max(1, page) - 1) * perPage;

        const conn = this.conn(connection);

        const [countRows] = await conn.query(`SELECT COUNT(*) AS total FROM ${this.table} ${where}`, params);
        const total = Number(countRows[0].total);

        const [rows] = await conn.query(
            `SELECT * FROM ${this.table} ${where} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`,
            [...params, perPage, offset],
        );

        return { rows: rows.map((row) => this.toModel(row)), total };
    }

    async create(data, { connection } = {}) {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(data);

        const [result] = await this.conn(connection).query(
            `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values,
        );
        return result.insertId;
    }

    async update(id, data, { connection } = {}) {
        const columns = Object.keys(data);
        if (!columns.length) return false;

        const setClause = columns.map((col) => `${col} = ?`).join(', ');
        const values = [...Object.values(data), id];

        const [result] = await this.conn(connection).query(
            `UPDATE ${this.table} SET ${setClause} WHERE ${this.primaryKey} = ?`,
            values,
        );
        return result.affectedRows > 0;
    }

    async softDeleteById(id, { connection } = {}) {
        const [result] = await this.conn(connection).query(
            `UPDATE ${this.table} SET deleted_at = NOW() WHERE ${this.primaryKey} = ?`,
            [id],
        );
        return result.affectedRows > 0;
    }

    async hardDelete(id, { connection } = {}) {
        const [result] = await this.conn(connection).query(
            `DELETE FROM ${this.table} WHERE ${this.primaryKey} = ?`,
            [id],
        );
        return result.affectedRows > 0;
    }
}

export default BaseRepository;
