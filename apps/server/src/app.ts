import express from 'express';
import cors from 'cors';
import { registerRouter } from './auth/register.js';
import { loginRouter } from './auth/login.js';
import { projectsRouter } from './projects/projects.js';
import { joinRequestsRouter } from './join-requests/joinRequests.js';

export const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', registerRouter);
app.use('/auth', loginRouter);
app.use(projectsRouter);
app.use(joinRequestsRouter);
