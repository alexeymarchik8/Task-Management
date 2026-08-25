import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/verifyToken.js';
import type { TaskStatus } from '../../generated/prisma/index.js';
import * as analyticsRepository from './repository.js';
import type { AnalyticsSummary, ProjectSummary, StatusBreakdown } from './types.js';

const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

function emptyBreakdown(): StatusBreakdown {
  return { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 };
}

function percentDone(byStatus: StatusBreakdown, totalTasks: number): number {
  return totalTasks === 0 ? 0 : Math.round((byStatus.done / totalTasks) * 100);
}

export async function getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projects = await analyticsRepository.findProjectsForUser(req.userId!);
  const tasks = await analyticsRepository.findTasksForProjects(
    projects.map((project) => project.id),
  );

  const overallByStatus = emptyBreakdown();
  const byProjectId = new Map<string, StatusBreakdown>();
  for (const project of projects) {
    byProjectId.set(project.id, emptyBreakdown());
  }

  for (const task of tasks) {
    overallByStatus[task.status]++;
    byProjectId.get(task.projectId)![task.status]++;
  }

  const totalTasks = tasks.length;

  const projectSummaries: ProjectSummary[] = projects.map((project) => {
    const byStatus = byProjectId.get(project.id)!;
    const projectTotal = TASK_STATUSES.reduce((sum, status) => sum + byStatus[status], 0);
    return {
      projectId: project.id,
      name: project.name,
      totalTasks: projectTotal,
      byStatus,
      percentDone: percentDone(byStatus, projectTotal),
    };
  });

  const summary: AnalyticsSummary = {
    totalTasks,
    byStatus: overallByStatus,
    percentDone: percentDone(overallByStatus, totalTasks),
    projects: projectSummaries,
  };

  res.status(200).json(summary);
}
