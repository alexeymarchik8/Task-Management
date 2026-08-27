import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/verifyToken.js';
import { generateUniqueProjectCode } from '../../services/projectCodeService.js';
import * as projectsRepository from './repository.js';
import type { CreateProjectBody, UpdateProjectBody } from './types.js';

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name } = req.body as CreateProjectBody;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Название проекта обязательно' });
    return;
  }

  const code = await generateUniqueProjectCode();
  const project = await projectsRepository.createProjectWithOwner(name, code, req.userId!);

  res.status(201).json(project);
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

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name } = req.body as UpdateProjectBody;

  const project = await projectsRepository.findProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  if (project.ownerId !== req.userId) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Название проекта обязательно' });
    return;
  }

  const updated = await projectsRepository.updateProjectName(id, name);
  res.status(200).json(updated);
}

export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const project = await projectsRepository.findProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  if (project.ownerId !== req.userId) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  await projectsRepository.deleteProjectCascade(id);
  res.status(200).json({ id });
}

export async function leaveProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const project = await projectsRepository.findProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  if (project.ownerId === req.userId) {
    res.status(400).json({ error: 'Владелец не может покинуть проект' });
    return;
  }

  const membership = await projectsRepository.findMembership(req.userId!, id);
  if (!membership) {
    res.status(404).json({ error: 'Вы не являетесь участником проекта' });
    return;
  }

  await projectsRepository.removeMember(id, req.userId!);
  res.status(200).json({ userId: req.userId });
}

export async function removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id, userId } = req.params;

  const project = await projectsRepository.findProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  if (project.ownerId !== req.userId) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  if (userId === project.ownerId) {
    res.status(400).json({ error: 'Нельзя удалить владельца проекта' });
    return;
  }

  const membership = await projectsRepository.findMembership(userId, id);
  if (!membership) {
    res.status(404).json({ error: 'Участник не найден' });
    return;
  }

  await projectsRepository.removeMember(id, userId);
  res.status(200).json({ userId });
}
