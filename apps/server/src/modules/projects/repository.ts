import { prisma } from '../../db/prisma.js';
import type { Project, ProjectMember } from '../../generated/prisma/index.js';

export function findMembership(userId: string, projectId: string): Promise<ProjectMember | null> {
  return prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

export async function findMembersByProject(
  projectId: string,
): Promise<{ userId: string; email: string; role: string }[]> {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { email: true } } },
  });

  return members.map((member) => ({
    userId: member.userId,
    email: member.user.email,
    role: member.role,
  }));
}

export function createProjectWithOwner(
  name: string,
  code: string,
  ownerId: string,
): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.project.create({ data: { name, code, ownerId } });
    await tx.projectMember.create({
      data: { userId: ownerId, projectId: created.id, role: 'owner' },
    });
    return created;
  });
}

export function findProjectsForUser(userId: string): Promise<Project[]> {
  return prisma.project.findMany({ where: { members: { some: { userId } } } });
}
