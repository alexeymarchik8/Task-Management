import { prisma } from '../../db/prisma.js';
import type { Project } from '../../generated/prisma/index.js';

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
