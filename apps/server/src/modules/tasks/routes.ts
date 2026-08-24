import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import { createTask, listTasks } from './controller.js';

export const tasksRouter = Router();

tasksRouter.post('/projects/:projectId/tasks', verifyToken, createTask);
tasksRouter.get('/projects/:projectId/tasks', verifyToken, listTasks);
