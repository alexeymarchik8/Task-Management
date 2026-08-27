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

export function findProjectById(id: string): Promise<Project | null> {
  return prisma.project.findUnique({ where: { id } });
}

export function updateProjectName(id: string, name: string): Promise<Project> {
  return prisma.project.update({ where: { id }, data: { name } });
}

export async function deleteProjectCascade(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { projectId: id } }),
    prisma.joinRequest.deleteMany({ where: { projectId: id } }),
    prisma.projectMember.deleteMany({ where: { projectId: id } }),
    prisma.project.delete({ where: { id } }),
  ]);
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.task.updateMany({
      where: { projectId, assigneeId: userId },
      data: { assigneeId: null },
    }),
    prisma.projectMember.delete({ where: { userId_projectId: { userId, projectId } } }),
  ]);
}
