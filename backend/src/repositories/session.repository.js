import database from '../config/database.js';
import { BaseRepository } from './base.repository.js';

export class SessionRepository extends BaseRepository {
    constructor() {
        super({ table: 'sessions' });
    }

    conn(connection) {
        return connection ?? database.getConnection();
    }

    async create({ userId, refreshTokenHash, userAgent, ipAddress, expiresAt, remember }, { connection } = {}) {
        return super.create(
            {
                user_id: userId,
                refresh_token_hash: refreshTokenHash,
                user_agent: userAgent ?? null,
                ip_address: ipAddress ?? null,
                expires_at: expiresAt,
                remember: remember ? 1 : 0,
            },
            { connection },
        );
    }

    async findByTokenHash(refreshTokenHash, { connection } = {}) {
        const [rows] = await this.conn(connection).query(
            'SELECT * FROM sessions WHERE refresh_token_hash = ? LIMIT 1',
            [refreshTokenHash],
        );
        return rows[0] ?? null;
    }

    async revoke(id, { connection } = {}) {
        const [result] = await this.conn(connection).query(
            'UPDATE sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL',
            [id],
        );
        return result.affectedRows > 0;
    }

    async revokeByTokenHash(refreshTokenHash, { connection } = {}) {
        const [result] = await this.conn(connection).query(
            'UPDATE sessions SET revoked_at = NOW() WHERE refresh_token_hash = ? AND revoked_at IS NULL',
            [refreshTokenHash],
        );
        return result.affectedRows > 0;
    }

    async revokeAllByUser(userId, { connection } = {}) {
        await this.conn(connection).query(
            'UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
            [userId],
        );
    }

    async purgeExpired({ connection } = {}) {
        const [result] = await this.conn(connection).query(
            'DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL',
        );
        return result.affectedRows;
    }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
