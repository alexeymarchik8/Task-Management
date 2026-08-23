import { Router } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../auth/verifyToken.js';
import { prisma } from '../db/prisma.js';
import { generateUniqueProjectCode } from './generateProjectCode.js';

export const projectsRouter = Router();

projectsRouter.post('/projects', verifyToken, async (req: AuthenticatedRequest, res) => {
  const { name } = req.body as { name?: string };

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Название проекта обязательно' });
    return;
  }

  const code = await generateUniqueProjectCode();

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: { name, code, ownerId: req.userId! },
    });
    await tx.projectMember.create({
      data: { userId: req.userId!, projectId: created.id, role: 'owner' },
    });
    return created;
  });

  res.status(201).json({ id: project.id, name: project.name, code: project.code });
});

projectsRouter.get('/projects', verifyToken, async (req: AuthenticatedRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.userId! } } },
  });

  res.status(200).json(projects);
});
