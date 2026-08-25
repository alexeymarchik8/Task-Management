import type { TaskStatus } from '../../generated/prisma/index.js';

export type StatusBreakdown = Record<TaskStatus, number>;

export interface ProjectSummary {
  projectId: string;
  name: string;
  totalTasks: number;
  byStatus: StatusBreakdown;
  percentDone: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  byStatus: StatusBreakdown;
  percentDone: number;
  projects: ProjectSummary[];
}
