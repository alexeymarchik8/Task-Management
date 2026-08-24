import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import { createProject, listProjects } from './controller.js';

export const projectsRouter = Router();

projectsRouter.post('/projects', verifyToken, createProject);
projectsRouter.get('/projects', verifyToken, listProjects);
