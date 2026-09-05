import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { checkDbConnection } from './config/db';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(helmet());

  app.use(cors({ origin: env.corsOrigin, credentials: true }));

  app.use(express.json({ limit: '100kb' }));

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(pinoHttp({ logger }));

  app.get('/health', async (_req, res) => {
    const dbOk = await checkDbConnection();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      service: 'products-api',
      database: dbOk ? 'connected' : 'unreachable',
    });
  });

  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
