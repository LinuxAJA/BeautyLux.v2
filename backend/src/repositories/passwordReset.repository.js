import database from '../config/database.js';
import { BaseRepository } from './base.repository.js';

export class PasswordResetRepository extends BaseRepository {
    constructor() {
        super({ table: 'password_resets' });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async create({ userId, tokenHash, expiresAt }, { connection } = {}) {
        return super.create(
            { user_id: userId, token_hash: tokenHash, expires_at: expiresAt },
            { connection },
        );
    }

    async findValidByTokenHash(tokenHash, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            `SELECT * FROM password_resets
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
             LIMIT 1`,
            [tokenHash],
        );
        return rows[0] ?? null;
    }

    async markUsed(id, { connection } = {}) {
        const [result] = await this.conn(connection).query(
            'UPDATE password_resets SET used_at = NOW() WHERE id = ?',
            [id],
        );
        return result.affectedRows > 0;
    }

    async invalidatePrevious(userId, { connection } = {}) {
        await this.conn(connection).query(
            'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
            [userId],
        );
    }
}

export const passwordResetRepository = new PasswordResetRepository();
export default passwordResetRepository;
