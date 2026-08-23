import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../db/prisma.js';
import { generateToken } from '../auth/jwt.js';

describe('join-requests routes authorization', () => {
  it('rejects an unauthorized POST /projects/join request', async () => {
    const res = await request(app).post('/projects/join').send({ code: 'AAAAAAAA' });
    expect(res.status).toBe(401);
  });

  it('rejects an unauthorized GET /join-requests request', async () => {
    const res = await request(app).get('/join-requests');
    expect(res.status).toBe(401);
  });

  it('rejects an unauthorized DELETE /join-requests/:id request', async () => {
    const res = await request(app).delete('/join-requests/some-id');
    expect(res.status).toBe(401);
  });
});

describe('POST /projects/join', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a pending join request for a valid project code', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    const token = generateToken(applicant.id);

    const res = await request(app)
      .post('/projects/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: project.code });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.projectId).toBe(project.id);
    expect(res.body.userId).toBe(applicant.id);
    expect(res.body.status).toBe('pending');

    const requests = await prisma.joinRequest.findMany({ where: { userId: applicant.id } });
    expect(requests).toHaveLength(1);
  });

  it('returns 404 "проект не найден" for a nonexistent code and creates no request', async () => {
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    const token = generateToken(applicant.id);

    const res = await request(app)
      .post('/projects/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'ZZZZZZZZ' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Проект не найден');
    const count = await prisma.joinRequest.count();
    expect(count).toBe(0);
  });

  it('rejects a join request from a user already in the project and creates no request', async () => {
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
      .post('/projects/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: project.code });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Вы уже в проекте');
    const count = await prisma.joinRequest.count();
    expect(count).toBe(0);
  });

  it('rejects a duplicate pending join request and creates no duplicate', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    await prisma.joinRequest.create({
      data: { userId: applicant.id, projectId: project.id, status: 'pending' },
    });
    const token = generateToken(applicant.id);

    const res = await request(app)
      .post('/projects/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: project.code });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Заявка уже отправлена');
    const count = await prisma.joinRequest.count({ where: { userId: applicant.id } });
    expect(count).toBe(1);
  });
});

describe('GET /join-requests', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it("returns all of the current user's join requests with their statuses", async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const projectA = await prisma.project.create({
      data: { name: 'A', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const projectB = await prisma.project.create({
      data: { name: 'B', code: 'BBBBBBBB', ownerId: owner.id },
    });
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    const other = await prisma.user.create({
      data: { email: 'other@example.com', password: 'hashed' },
    });
    await prisma.joinRequest.create({
      data: { userId: applicant.id, projectId: projectA.id, status: 'pending' },
    });
    await prisma.joinRequest.create({
      data: { userId: applicant.id, projectId: projectB.id, status: 'rejected' },
    });
    await prisma.joinRequest.create({
      data: { userId: other.id, projectId: projectA.id, status: 'approved' },
    });
    const token = generateToken(applicant.id);

    const res = await request(app).get('/join-requests').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const statuses = res.body.map((r: { status: string }) => r.status).sort();
    expect(statuses).toEqual(['pending', 'rejected']);
  });

  it('returns an empty list for a user with no join requests', async () => {
    const user = await prisma.user.create({
      data: { email: 'lonely@example.com', password: 'hashed' },
    });
    const token = generateToken(user.id);

    const res = await request(app).get('/join-requests').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('DELETE /join-requests/:id', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('deletes a rejected join request belonging to the current user', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    const joinRequest = await prisma.joinRequest.create({
      data: { userId: applicant.id, projectId: project.id, status: 'rejected' },
    });
    const token = generateToken(applicant.id);

    const res = await request(app)
      .delete(`/join-requests/${joinRequest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = await prisma.joinRequest.findUnique({ where: { id: joinRequest.id } });
    expect(found).toBeNull();
  });

  it('rejects deleting a join request that is not rejected', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    const joinRequest = await prisma.joinRequest.create({
      data: { userId: applicant.id, projectId: project.id, status: 'pending' },
    });
    const token = generateToken(applicant.id);

    const res = await request(app)
      .delete(`/join-requests/${joinRequest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    const found = await prisma.joinRequest.findUnique({ where: { id: joinRequest.id } });
    expect(found).not.toBeNull();
  });

  it('rejects deleting a join request belonging to another user', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const project = await prisma.project.create({
      data: { name: 'Project', code: 'AAAAAAAA', ownerId: owner.id },
    });
    const applicant = await prisma.user.create({
      data: { email: 'applicant@example.com', password: 'hashed' },
    });
    const intruder = await prisma.user.create({
      data: { email: 'intruder@example.com', password: 'hashed' },
    });
    const joinRequest = await prisma.joinRequest.create({
      data: { userId: applicant.id, projectId: project.id, status: 'rejected' },
    });
    const token = generateToken(intruder.id);

    const res = await request(app)
      .delete(`/join-requests/${joinRequest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    const found = await prisma.joinRequest.findUnique({ where: { id: joinRequest.id } });
    expect(found).not.toBeNull();
  });
});
