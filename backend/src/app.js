import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { generalLimiter } from './middlewares/rateLimit.js';
import { requestLogger } from './middlewares/requestLogger.js';
import router from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
);
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);
app.use(generalLimiter);

app.use(env.API_PREFIX, router);

app.use(notFound);
app.use(errorHandler);

export default app;
