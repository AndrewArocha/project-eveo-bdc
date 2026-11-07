import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { API_PREFIX } from './constants/api.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { requireDatabase } from './middlewares/requireDatabase.js';
import { apiRoutes } from './routes/apiRoutes.js';

export const app = express();

app.disable('x-powered-by');
if (env.trustProxy !== false) app.set('trust proxy', env.trustProxy);

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get(`${API_PREFIX}/health`, (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'eveo-api', database: 'managed-per-route' });
});

app.use(API_PREFIX, requireDatabase, apiRoutes);
app.use(notFound);
app.use(errorHandler);
