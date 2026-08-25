import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import { createProject, listProjects, listMembers } from './controller.js';

export const projectsRouter = Router();

projectsRouter.post('/projects', verifyToken, createProject);
projectsRouter.get('/projects', verifyToken, listProjects);
projectsRouter.get('/projects/:id/members', verifyToken, listMembers);
