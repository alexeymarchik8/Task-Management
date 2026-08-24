import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/verifyToken.js';
import * as tasksRepository from './repository.js';
import type { CreateTaskBody } from './types.js';

const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { title, description, priority, dueDate, assigneeId } = req.body as CreateTaskBody;

  const membership = await tasksRepository.findMembership(req.userId!, projectId);
  if (!membership) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Заголовок задачи обязателен' });
    return;
  }

  if (priority !== undefined && !VALID_PRIORITIES.has(priority)) {
    res.status(400).json({ error: 'Недопустимый приоритет' });
    return;
  }

  if (dueDate !== undefined && Number.isNaN(Date.parse(dueDate))) {
    res.status(400).json({ error: 'Недопустимый срок выполнения' });
    return;
  }

  const task = await tasksRepository.createTask(projectId, {
    title,
    description,
    priority: priority as 'low' | 'medium' | 'high' | undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    assigneeId,
  });

  res.status(201).json(task);
}

export async function listTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { projectId } = req.params;

  const membership = await tasksRepository.findMembership(req.userId!, projectId);
  if (!membership) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  const tasks = await tasksRepository.findTasksByProject(projectId);
  res.status(200).json(tasks);
}
