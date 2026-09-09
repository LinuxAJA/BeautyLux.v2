import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
};

async function ping() {
    const connection = await mysql.createConnection(baseConfig);
    const [rows] = await connection.query('SELECT VERSION() AS version');
    console.log(`Conectado a MySQL ${rows[0].version} en ${baseConfig.host}:${baseConfig.port}`);
    await connection.end();
}

async function runSqlFile(fileName) {
    const filePath = path.join(__dirname, fileName);
    const sql = await fs.readFile(filePath, 'utf8');
    const connection = await mysql.createConnection(baseConfig);
    console.log(`Ejecutando ${fileName}...`);
    await connection.query(sql);
    console.log(`${fileName} ejecutado correctamente.`);
    await connection.end();
}

async function dropDatabase() {
    const connection = await mysql.createConnection(baseConfig);
    const dbName = process.env.DB_NAME || 'db_beautylux_v2';
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`Base de datos ${dbName} eliminada.`);
    await connection.end();
}

async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'ping':
            await ping();
            break;
        case 'schema':
            await runSqlFile('schema.sql');
            break;
        case 'seed':
            await runSqlFile('seed.sql');
            break;
        case 'reset':
            await dropDatabase();
            await runSqlFile('schema.sql');
            await runSqlFile('seed.sql');
            break;
        default:
            console.error('Uso: node database/run.mjs <ping|schema|seed|reset>');
            process.exit(1);
    }
}

main().catch((error) => {
    console.error('Error ejecutando el script de base de datos:', error.message);
    process.exit(1);
});
