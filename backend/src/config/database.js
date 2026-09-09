import mysql from 'mysql2/promise';

import { env } from './env.js';

/**
 * Singleton sobre un pool de conexiones a MySQL 8.
 * `Database.instance` garantiza una única instancia congelada durante
 * todo el ciclo de vida del proceso.
 */
class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.pool = mysql.createPool({
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            waitForConnections: true,
            connectionLimit: env.DB_CONNECTION_LIMIT,
            queueLimit: 0,
            dateStrings: true,
        });

        Database.instance = this;
        Object.freeze(this);
    }

    getConnection() {
        return this.pool;
    }

    /** Verifica que el servidor responde. Usado por /api/health y por server.js al arrancar. */
    async healthCheck() {
        const [rows] = await this.pool.query('SELECT 1 AS ok');
        return rows[0]?.ok === 1;
    }

    /**
     * Ejecuta `callback(connection)` dentro de una transacción.
     * Hace commit si `callback` resuelve y rollback si lanza, liberando
     * siempre la conexión de vuelta al pool.
     */
    async withTransaction(callback) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}

const dbInstance = new Database();
Object.freeze(dbInstance);

export default dbInstance;
