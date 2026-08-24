import { prisma } from '../../db/prisma.js';
import type { Prisma, ProjectMember, Task } from '../../generated/prisma/index.js';

export function findMembership(userId: string, projectId: string): Promise<ProjectMember | null> {
  return prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

export function createTask(
  projectId: string,
  data: Omit<Prisma.TaskUncheckedCreateInput, 'projectId'>,
): Promise<Task> {
  return prisma.task.create({ data: { ...data, projectId } });
}

export function findTasksByProject(projectId: string): Promise<Task[]> {
  return prisma.task.findMany({ where: { projectId } });
}
