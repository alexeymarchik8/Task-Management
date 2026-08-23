import { Router } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../auth/verifyToken.js';
import { prisma } from '../db/prisma.js';

export const joinRequestsRouter = Router();

joinRequestsRouter.post('/projects/join', verifyToken, async (req: AuthenticatedRequest, res) => {
  const { code } = req.body as { code?: string };

  if (!code || !code.trim()) {
    res.status(400).json({ error: 'Код проекта обязателен' });
    return;
  }

  const project = await prisma.project.findUnique({ where: { code } });
  if (!project) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.userId!, projectId: project.id } },
  });
  if (membership) {
    res.status(400).json({ error: 'Вы уже в проекте' });
    return;
  }

  const pendingRequest = await prisma.joinRequest.findFirst({
    where: { userId: req.userId!, projectId: project.id, status: 'pending' },
  });
  if (pendingRequest) {
    res.status(400).json({ error: 'Заявка уже отправлена' });
    return;
  }

  const joinRequest = await prisma.joinRequest.create({
    data: { userId: req.userId!, projectId: project.id, status: 'pending' },
  });

  res.status(201).json({
    id: joinRequest.id,
    userId: joinRequest.userId,
    projectId: joinRequest.projectId,
    status: joinRequest.status,
  });
});

joinRequestsRouter.get('/join-requests', verifyToken, async (req: AuthenticatedRequest, res) => {
  const joinRequests = await prisma.joinRequest.findMany({
    where: { userId: req.userId! },
  });
  res.status(200).json(joinRequests);
});

joinRequestsRouter.get(
  '/join-requests/pending',
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const joinRequests = await prisma.joinRequest.findMany({
      where: { status: 'pending', project: { ownerId: req.userId! } },
      include: { user: { select: { id: true, email: true } } },
    });
    res.status(200).json(joinRequests);
  },
);

joinRequestsRouter.get(
  '/join-requests/pending/count',
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const count = await prisma.joinRequest.count({
      where: { status: 'pending', project: { ownerId: req.userId! } },
    });
    res.status(200).json({ count });
  },
);

joinRequestsRouter.post(
  '/join-requests/:id/approve',
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!joinRequest) {
      res.status(404).json({ error: 'Заявка не найдена' });
      return;
    }

    if (joinRequest.project.ownerId !== req.userId) {
      res.status(403).json({ error: 'Доступ запрещён' });
      return;
    }

    if (joinRequest.status !== 'pending') {
      res.status(400).json({ error: 'Заявка не в статусе pending' });
      return;
    }

    await prisma.$transaction([
      prisma.joinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'approved' },
      }),
      prisma.projectMember.create({
        data: { userId: joinRequest.userId, projectId: joinRequest.projectId, role: 'member' },
      }),
    ]);

    res.status(200).json({ id: joinRequest.id, status: 'approved' });
  },
);

joinRequestsRouter.post(
  '/join-requests/:id/reject',
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!joinRequest) {
      res.status(404).json({ error: 'Заявка не найдена' });
      return;
    }

    if (joinRequest.project.ownerId !== req.userId) {
      res.status(403).json({ error: 'Доступ запрещён' });
      return;
    }

    if (joinRequest.status !== 'pending') {
      res.status(400).json({ error: 'Заявка не в статусе pending' });
      return;
    }

    await prisma.joinRequest.update({
      where: { id: joinRequest.id },
      data: { status: 'rejected' },
    });

    res.status(200).json({ id: joinRequest.id, status: 'rejected' });
  },
);

joinRequestsRouter.delete(
  '/join-requests/:id',
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!joinRequest || joinRequest.userId !== req.userId) {
      res.status(404).json({ error: 'Заявка не найдена' });
      return;
    }

    if (joinRequest.status !== 'rejected') {
      res.status(400).json({ error: 'Можно удалить только отклонённую заявку' });
      return;
    }

    await prisma.joinRequest.delete({ where: { id: joinRequest.id } });
    res.status(200).json({ id: joinRequest.id });
  },
);
