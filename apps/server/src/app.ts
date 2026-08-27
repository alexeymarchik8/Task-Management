import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { authRouter } from './modules/auth/routes.js';
import { projectsRouter } from './modules/projects/routes.js';
import { joinRequestsRouter } from './modules/join-requests/routes.js';
import { tasksRouter } from './modules/tasks/routes.js';
import { analyticsRouter } from './modules/analytics/routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use(projectsRouter);
app.use(joinRequestsRouter);
app.use(tasksRouter);
app.use(analyticsRouter);

app.use(errorHandler);
