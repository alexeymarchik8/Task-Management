import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import {
  createProject,
  listProjects,
  listMembers,
  updateProject,
  deleteProject,
  leaveProject,
  removeMember,
} from './controller.js';

export const projectsRouter = Router();

projectsRouter.post('/projects', verifyToken, createProject);
projectsRouter.get('/projects', verifyToken, listProjects);
projectsRouter.get('/projects/:id/members', verifyToken, listMembers);
projectsRouter.patch('/projects/:id', verifyToken, updateProject);
projectsRouter.delete('/projects/:id', verifyToken, deleteProject);
projectsRouter.delete('/projects/:id/members/me', verifyToken, leaveProject);
projectsRouter.delete('/projects/:id/members/:userId', verifyToken, removeMember);
