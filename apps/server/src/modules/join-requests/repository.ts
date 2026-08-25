import { prisma } from '../../db/prisma.js';
import type { JoinRequest, Project, ProjectMember } from '../../generated/prisma/index.js';

export function findProjectByCode(code: string): Promise<Project | null> {
  return prisma.project.findUnique({ where: { code } });
}

export function findMembership(userId: string, projectId: string): Promise<ProjectMember | null> {
  return prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

export function findPendingJoinRequest(
  userId: string,
  projectId: string,
): Promise<JoinRequest | null> {
  return prisma.joinRequest.findFirst({ where: { userId, projectId, status: 'pending' } });
}

export function createJoinRequest(userId: string, projectId: string): Promise<JoinRequest> {
  return prisma.joinRequest.create({ data: { userId, projectId, status: 'pending' } });
}

export function findJoinRequestsByUser(userId: string): Promise<JoinRequest[]> {
  return prisma.joinRequest.findMany({ where: { userId } });
}

export function findPendingJoinRequestsForOwner(ownerId: string) {
  return prisma.joinRequest.findMany({
    where: { status: 'pending', project: { ownerId } },
    include: { user: { select: { id: true, email: true } } },
  });
}

export function countPendingJoinRequestsForOwner(ownerId: string): Promise<number> {
  return prisma.joinRequest.count({ where: { status: 'pending', project: { ownerId } } });
}

export function findJoinRequestWithProject(id: string) {
  return prisma.joinRequest.findUnique({ where: { id }, include: { project: true } });
}

export function findJoinRequestById(id: string): Promise<JoinRequest | null> {
  return prisma.joinRequest.findUnique({ where: { id } });
}

export async function approveJoinRequest(joinRequest: JoinRequest): Promise<void> {
  await prisma.$transaction([
    prisma.joinRequest.update({ where: { id: joinRequest.id }, data: { status: 'approved' } }),
    prisma.projectMember.create({
      data: { userId: joinRequest.userId, projectId: joinRequest.projectId, role: 'member' },
    }),
  ]);
}

export async function rejectJoinRequest(id: string): Promise<void> {
  await prisma.joinRequest.update({ where: { id }, data: { status: 'rejected' } });
}

export async function deleteJoinRequest(id: string): Promise<void> {
  await prisma.joinRequest.delete({ where: { id } });
}
