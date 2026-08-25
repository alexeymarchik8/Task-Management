import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import { createTask, listTasks, updateTask, deleteTask } from './controller.js';

export const tasksRouter = Router();

tasksRouter.post('/projects/:projectId/tasks', verifyToken, createTask);
tasksRouter.get('/projects/:projectId/tasks', verifyToken, listTasks);
tasksRouter.patch('/tasks/:id', verifyToken, updateTask);
tasksRouter.delete('/tasks/:id', verifyToken, deleteTask);
