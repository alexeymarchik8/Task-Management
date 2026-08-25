import express from 'express';
import cors from 'cors';
import { authRouter } from './modules/auth/routes.js';
import { projectsRouter } from './modules/projects/routes.js';
import { joinRequestsRouter } from './modules/join-requests/routes.js';

export const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use(projectsRouter);
app.use(joinRequestsRouter);
