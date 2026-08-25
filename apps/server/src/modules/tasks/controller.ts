import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/verifyToken.js';
import * as tasksRepository from './repository.js';
import type { CreateTaskBody, UpdateTaskBody } from './types.js';

const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
const VALID_STATUSES = new Set(['backlog', 'todo', 'in_progress', 'in_review', 'done']);

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

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, assigneeId } = req.body as UpdateTaskBody;

  const task = await tasksRepository.findTaskById(id);
  if (!task) {
    res.status(404).json({ error: 'Задача не найдена' });
    return;
  }

  const membership = await tasksRepository.findMembership(req.userId!, task.projectId);
  if (!membership) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  if (title !== undefined && !title.trim()) {
    res.status(400).json({ error: 'Заголовок задачи обязателен' });
    return;
  }

  if (status !== undefined && !VALID_STATUSES.has(status)) {
    res.status(400).json({ error: 'Недопустимый статус' });
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

  const updated = await tasksRepository.updateTask(id, {
    title,
    description,
    status: status as 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | undefined,
    priority: priority as 'low' | 'medium' | 'high' | undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    assigneeId,
  });

  res.status(200).json(updated);
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const task = await tasksRepository.findTaskById(id);
  if (!task) {
    res.status(404).json({ error: 'Задача не найдена' });
    return;
  }

  const membership = await tasksRepository.findMembership(req.userId!, task.projectId);
  if (!membership) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  await tasksRepository.deleteTask(id);
  res.status(200).json({ id: task.id });
}
