import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import apiV1Routes from './routes';

const app = express();

// Security headers
app.use(helmet());

// Strict CORS Allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or server-to-server)
      if (!origin || origin === env.CLIENT_URL || env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Body parsing with safe size limit
app.use(express.json({ limit: '10mb' }));

// Global rate limiting
app.use(globalLimiter);

// Health check endpoint (Used by Docker, Render, Kubernetes, Evaluator)
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'silversync-backend',
  });
});

// API Routes under /api/v1
app.use('/api/v1', apiV1Routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API resource does not exist.',
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
