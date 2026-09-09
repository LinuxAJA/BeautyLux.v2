import app from './app.js';
import { env } from './config/env.js';
import database from './config/database.js';
import { permissionService } from './services/permission.service.js';
import { scheduleMaintenance } from './services/maintenance.service.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
    const isHealthy = await database.healthCheck().catch(() => false);
    if (!isHealthy) {
        logger.error(
            `No se pudo conectar a MySQL en ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}. ` +
                'Verifica que el servidor esté activo y que ejecutaste "npm run db:schema".',
        );
        process.exit(1);
    }

    await permissionService.warmCache();
    const maintenanceTimer = scheduleMaintenance();

    const server = app.listen(env.PORT, () => {
        logger.info(`BeautyLux API escuchando en http://localhost:${env.PORT}${env.API_PREFIX}`);
        logger.info(`Entorno: ${env.NODE_ENV} — Base de datos: ${env.DB_NAME}`);
    });

    const shutdown = (signal) => {
        logger.info(`Señal ${signal} recibida, cerrando servidor...`);
        clearInterval(maintenanceTimer);
        server.close(async () => {
            await database.close();
            logger.info('Servidor y pool de MySQL cerrados correctamente.');
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
        logger.error('Promesa rechazada sin manejar', { reason: reason?.message || reason });
    });
}

bootstrap();
