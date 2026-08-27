import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../db/prisma.js';
import { generateToken } from '../../services/tokenService.js';

describe('tasks routes authorization', () => {
  it('rejects an unauthorized POST /projects/:projectId/tasks request', async () => {
    const res = await request(app).post('/projects/some-project-id/tasks').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('rejects an unauthorized GET /projects/:projectId/tasks request', async () => {
    const res = await request(app).get('/projects/some-project-id/tasks');
    expect(res.status).toBe(401);
  });

  it('rejects an unauthorized PATCH /tasks/:id request', async () => {
    const res = await request(app).patch('/tasks/some-task-id').send({ status: 'done' });
    expect(res.status).toBe(401);
  });

  it('rejects an unauthorized DELETE /tasks/:id request', async () => {
    const res = await request(app).delete('/tasks/some-task-id');
    expect(res.status).toBe(401);
  });
});

describe('POST /projects/:projectId/tasks', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a task with a valid title and defaults to backlog status', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write the report' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Write the report');
    expect(res.body.status).toBe('backlog');
    expect(res.body.priority).toBe('medium');
    expect(res.body.projectId).toBe(project.id);
  });

  it('rejects a request without a title and creates no task', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    const count = await prisma.task.count();
    expect(count).toBe(0);
  });

  it('rejects a task creation request from a user who is not a project member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const token = generateToken(outsider.id);

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write the report' });

    expect(res.status).toBe(403);
    const count = await prisma.task.count();
    expect(count).toBe(0);
  });

  it('rejects an invalid priority and creates no task', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write the report', priority: 'urgent' });

    expect(res.status).toBe(400);
    const count = await prisma.task.count();
    expect(count).toBe(0);
  });

  it('rejects an unparseable due date and creates no task', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write the report', dueDate: 'not-a-date' });

    expect(res.status).toBe(400);
    const count = await prisma.task.count();
    expect(count).toBe(0);
  });

  it('rejects assigning the task to a user who is not a project member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write the report', assigneeId: outsider.id });

    expect(res.status).toBe(400);
    const count = await prisma.task.count();
    expect(count).toBe(0);
  });
});

describe('GET /projects/:projectId/tasks', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns an empty list for a new project with no tasks', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .get(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns the tasks belonging to the project', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    await prisma.task.create({ data: { title: 'Task B', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .get(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('rejects a request from a user who is not a project member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const token = generateToken(outsider.id);

    const res = await request(app)
      .get(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /tasks/:id', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('moves a task to a different status', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('updates description, assignee, priority, and due date', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Updated description',
        assigneeId: owner.id,
        priority: 'high',
        dueDate: '2026-09-01T00:00:00.000Z',
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated description');
    expect(res.body.assigneeId).toBe(owner.id);
    expect(res.body.priority).toBe('high');
    expect(res.body.dueDate).toBe('2026-09-01T00:00:00.000Z');
  });

  it('rejects an update from a user who is not a project member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const token = generateToken(outsider.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent task', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch('/tasks/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(res.status).toBe(404);
  });

  it('rejects an invalid status', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived' });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid priority', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'urgent' });

    expect(res.status).toBe(400);
  });

  it('rejects an unparseable due date', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDate: 'not-a-date' });

    expect(res.status).toBe(400);
  });

  it('rejects assigning the task to a user who is not a project member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assigneeId: outsider.id });

    expect(res.status).toBe(400);
    const found = await prisma.task.findUnique({ where: { id: task.id } });
    expect(found?.assigneeId).toBeNull();
  });

  it('ignores an attempt to move the task to a different project via projectId', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const otherProject = await prisma.project.create({
      data: { name: 'Other project', code: 'BBBBBBBB', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: otherProject.id, title: 'Still in the original project' });

    expect(res.status).toBe(200);
    expect(res.body.projectId).toBe(project.id);
    const found = await prisma.task.findUnique({ where: { id: task.id } });
    expect(found?.projectId).toBe(project.id);
  });
});

describe('DELETE /tasks/:id', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('deletes a task and removes it from the project list', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: project.id, role: 'owner' },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const token = generateToken(owner.id);

    const res = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = await prisma.task.findUnique({ where: { id: task.id } });
    expect(found).toBeNull();

    const listRes = await request(app)
      .get(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body).toEqual([]);
  });

  it('rejects a delete from a user who is not a project member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });
    const token = generateToken(outsider.id);

    const res = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    const found = await prisma.task.findUnique({ where: { id: task.id } });
    expect(found).not.toBeNull();
  });

  it('returns 404 for a nonexistent task', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const token = generateToken(owner.id);

    const res = await request(app)
      .delete('/tasks/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
