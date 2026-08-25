import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/verifyToken.js';
import { generateUniqueProjectCode } from '../../services/projectCodeService.js';
import * as projectsRepository from './repository.js';
import type { CreateProjectBody } from './types.js';

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name } = req.body as CreateProjectBody;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Название проекта обязательно' });
    return;
  }

  const code = await generateUniqueProjectCode();
  const project = await projectsRepository.createProjectWithOwner(name, code, req.userId!);

  res.status(201).json({ id: project.id, name: project.name, code: project.code });
}

export async function listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projects = await projectsRepository.findProjectsForUser(req.userId!);
  res.status(200).json(projects);
}

export async function listMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = req.params.id;

  const membership = await projectsRepository.findMembership(req.userId!, projectId);
  if (!membership) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  const members = await projectsRepository.findMembersByProject(projectId);
  res.status(200).json(members);
}
