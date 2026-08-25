import { prisma } from '../../db/prisma.js';
import type { Task } from '../../generated/prisma/index.js';
import { findProjectsForUser } from '../projects/repository.js';

export { findProjectsForUser };

export function findTasksForProjects(
  projectIds: string[],
): Promise<Pick<Task, 'projectId' | 'status'>[]> {
  if (projectIds.length === 0) {
    return Promise.resolve([]);
  }
  return prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    select: { projectId: true, status: true },
  });
}
