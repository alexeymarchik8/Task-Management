import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../db/prisma.js';
import { generateToken } from '../../services/tokenService.js';

describe('analytics routes authorization', () => {
  it('rejects an unauthorized GET /analytics/summary request', async () => {
    const res = await request(app).get('/analytics/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /analytics/summary', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns a zeroed summary for a user with no projects', async () => {
    const user = await prisma.user.create({
      data: { email: 'lonely@example.com', password: 'hashed' },
    });
    const token = generateToken(user.id);

    const res = await request(app)
      .get('/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(0);
    expect(res.body.byStatus).toEqual({
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    });
    expect(res.body.percentDone).toBe(0);
    expect(res.body.projects).toEqual([]);
  });

  it('returns the total task count and status breakdown across the user projects', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    await prisma.task.create({
      data: { title: 'Task A', projectId: project.id, status: 'backlog' },
    });
    await prisma.task.create({ data: { title: 'Task B', projectId: project.id, status: 'done' } });
    await prisma.task.create({ data: { title: 'Task C', projectId: project.id, status: 'done' } });
    await prisma.task.create({
      data: { title: 'Task D', projectId: project.id, status: 'in_progress' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .get('/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(4);
    expect(res.body.byStatus).toEqual({
      backlog: 1,
      todo: 0,
      in_progress: 1,
      in_review: 0,
      done: 2,
    });
    expect(res.body.percentDone).toBe(50);
  });

  it('excludes tasks from projects the user is not a member of', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(outsider.id);

    const res = await request(app)
      .get('/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(0);
    expect(res.body.projects).toEqual([]);
  });

  it('includes a per-project breakdown with its own status counts and percentDone', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const projectA = await prisma.project.create({
      data: { name: 'Project A', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const projectB = await prisma.project.create({
      data: { name: 'Project B', code: 'BBBBBBBB', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: projectA.id, role: 'owner' },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: projectB.id, role: 'owner' },
    });
    await prisma.task.create({ data: { title: 'A1', projectId: projectA.id, status: 'done' } });
    await prisma.task.create({ data: { title: 'A2', projectId: projectA.id, status: 'backlog' } });
    await prisma.task.create({ data: { title: 'B1', projectId: projectB.id, status: 'done' } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .get('/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(2);

    const resultA = res.body.projects.find(
      (p: { projectId: string }) => p.projectId === projectA.id,
    );
    const resultB = res.body.projects.find(
      (p: { projectId: string }) => p.projectId === projectB.id,
    );

    expect(resultA.name).toBe('Project A');
    expect(resultA.totalTasks).toBe(2);
    expect(resultA.byStatus.done).toBe(1);
    expect(resultA.byStatus.backlog).toBe(1);
    expect(resultA.percentDone).toBe(50);

    expect(resultB.name).toBe('Project B');
    expect(resultB.totalTasks).toBe(1);
    expect(resultB.byStatus.done).toBe(1);
    expect(resultB.percentDone).toBe(100);
  });
});
