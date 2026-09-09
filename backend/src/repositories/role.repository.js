import database from '../config/database.js';
import { Role } from '../models/role.model.js';
import { BaseRepository } from './base.repository.js';

export class RoleRepository extends BaseRepository {
    constructor() {
        super({ table: 'roles', model: Role, sortableColumns: ['id', 'name'] });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async findByName(name, { connection } = {}) {
        return this.findOneBy('name', name, { connection });
    }

    async findAll({ connection } = {}) {
        const [rows] = await this.conn(connection).query('SELECT * FROM roles ORDER BY id ASC');
        return rows.map((row) => Role.fromRow(row));
    }
}

export const roleRepository = new RoleRepository();
export default roleRepository;
