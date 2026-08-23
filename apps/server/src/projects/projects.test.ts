import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../db/prisma.js';
import { generateToken } from '../auth/jwt.js';

describe('projects routes authorization', () => {
  it('rejects an unauthorized POST /projects request', async () => {
    const res = await request(app).post('/projects').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('rejects an unauthorized GET /projects request', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(401);
  });
});

describe('POST /projects', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a project and returns 201 with id, name, and code', async () => {
    const user = await prisma.user.create({
      data: { email: 'alice@example.com', password: 'hashed' },
    });
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Project' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('My Project');
    expect(res.body.code).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('rejects a request without a name and creates no project', async () => {
    const user = await prisma.user.create({
      data: { email: 'bob@example.com', password: 'hashed' },
    });
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    const count = await prisma.project.count();
    expect(count).toBe(0);
  });

  it('makes the creator the sole owner of the project', async () => {
    const user = await prisma.user.create({
      data: { email: 'carol@example.com', password: 'hashed' },
    });
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Owned Project' });

    expect(res.status).toBe(201);

    const members = await prisma.projectMember.findMany({ where: { projectId: res.body.id } });
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(user.id);
    expect(members[0].role).toBe('owner');
  });
});

describe('GET /projects', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns only projects where the user is owner or member', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const member = await prisma.user.create({
      data: { email: 'member@example.com', password: 'hashed' },
    });
    const outsider = await prisma.user.create({
      data: { email: 'outsider@example.com', password: 'hashed' },
    });

    const ownedProject = await prisma.project.create({
      data: { name: 'Owned', code: 'AAAAAAAA', ownerId: owner.id },
    });
    await prisma.projectMember.create({
      data: { userId: owner.id, projectId: ownedProject.id, role: 'owner' },
    });

    const memberProject = await prisma.project.create({
      data: { name: 'Joined', code: 'BBBBBBBB', ownerId: outsider.id },
    });
    await prisma.projectMember.create({
      data: { userId: outsider.id, projectId: memberProject.id, role: 'owner' },
    });
    await prisma.projectMember.create({
      data: { userId: member.id, projectId: memberProject.id, role: 'member' },
    });

    const otherProject = await prisma.project.create({
      data: { name: 'Unrelated', code: 'CCCCCCCC', ownerId: outsider.id },
    });
    await prisma.projectMember.create({
      data: { userId: outsider.id, projectId: otherProject.id, role: 'owner' },
    });

    const token = generateToken(member.id);
    const res = await request(app).get('/projects').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(memberProject.id);
  });

  it('returns an empty list for a user with no projects', async () => {
    const user = await prisma.user.create({
      data: { email: 'lonely@example.com', password: 'hashed' },
    });
    const token = generateToken(user.id);

    const res = await request(app).get('/projects').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
