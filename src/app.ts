import './env.js';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { frameguard, hidePoweredBy, noSniff, referrerPolicy } from 'helmet';
import { auth } from './auth.js';
import { getPrismaClient } from './db/prisma.js';
import { fitnessRouter } from './routes/fitness.js';

const app = express();
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable('x-powered-by');
app.use(hidePoweredBy(), noSniff(), frameguard(), referrerPolicy());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
  }),
);

app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json({ limit: '1mb' }));
app.use('/api/v1', fitnessRouter);

app.get('/api/v1/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.get('/api/v1/health/database', async (_request, response) => {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    response.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found.',
    },
  });
});

const handleErrors: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  console.error('Unhandled API request error', {
    name: error instanceof Error ? error.name : 'UnknownError',
  });
  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};

app.use(handleErrors);

export default app;
