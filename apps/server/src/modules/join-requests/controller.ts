import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/verifyToken.js';
import * as joinRequestsRepository from './repository.js';
import type { JoinProjectBody } from './types.js';

export async function joinProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { code } = req.body as JoinProjectBody;

  if (!code || !code.trim()) {
    res.status(400).json({ error: 'Код проекта обязателен' });
    return;
  }

  const project = await joinRequestsRepository.findProjectByCode(code);
  if (!project) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  const membership = await joinRequestsRepository.findMembership(req.userId!, project.id);
  if (membership) {
    res.status(400).json({ error: 'Вы уже в проекте' });
    return;
  }

  const pendingRequest = await joinRequestsRepository.findPendingJoinRequest(
    req.userId!,
    project.id,
  );
  if (pendingRequest) {
    res.status(400).json({ error: 'Заявка уже отправлена' });
    return;
  }

  const joinRequest = await joinRequestsRepository.createJoinRequest(req.userId!, project.id);

  res.status(201).json({
    id: joinRequest.id,
    userId: joinRequest.userId,
    projectId: joinRequest.projectId,
    status: joinRequest.status,
  });
}

export async function listMyJoinRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  const joinRequests = await joinRequestsRepository.findJoinRequestsByUser(req.userId!);
  res.status(200).json(joinRequests);
}

export async function listPendingJoinRequests(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const joinRequests = await joinRequestsRepository.findPendingJoinRequestsForOwner(req.userId!);
  res.status(200).json(joinRequests);
}

export async function countPendingJoinRequests(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const count = await joinRequestsRepository.countPendingJoinRequestsForOwner(req.userId!);
  res.status(200).json({ count });
}

export async function approveJoinRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const joinRequest = await joinRequestsRepository.findJoinRequestWithProject(req.params.id);

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

  await joinRequestsRepository.approveJoinRequest(joinRequest);

  res.status(200).json({ id: joinRequest.id, status: 'approved' });
}

export async function rejectJoinRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const joinRequest = await joinRequestsRepository.findJoinRequestWithProject(req.params.id);

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

  await joinRequestsRepository.rejectJoinRequest(joinRequest.id);

  res.status(200).json({ id: joinRequest.id, status: 'rejected' });
}

export async function deleteJoinRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const joinRequest = await joinRequestsRepository.findJoinRequestById(req.params.id);

  if (!joinRequest || joinRequest.userId !== req.userId) {
    res.status(404).json({ error: 'Заявка не найдена' });
    return;
  }

  if (joinRequest.status !== 'rejected') {
    res.status(400).json({ error: 'Можно удалить только отклонённую заявку' });
    return;
  }

  await joinRequestsRepository.deleteJoinRequest(joinRequest.id);
  res.status(200).json({ id: joinRequest.id });
}
