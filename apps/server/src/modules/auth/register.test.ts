import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app.js';
import { prisma } from '../../db/prisma.js';

describe('POST /auth/register', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a user and returns 201 with id and email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body.id).toBeDefined();

    const user = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    expect(user).not.toBeNull();
    expect(user?.email).toBe('alice@example.com');
  });

  it('rejects an invalid email format with 400 and creates no user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });

  it('rejects a password shorter than 8 characters with 400 and creates no user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'bob@example.com', password: 'short' });

    expect(res.status).toBe(400);
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });

  it('rejects a duplicate email with 409 and creates no second user', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'password456' });

    expect(res.status).toBe(409);
    const count = await prisma.user.count({ where: { email: 'dup@example.com' } });
    expect(count).toBe(1);
  });

  it('stores the password as a bcrypt hash, not plaintext', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'carol@example.com', password: 'password123' });

    const user = await prisma.user.findUnique({ where: { email: 'carol@example.com' } });
    expect(user?.password).not.toBe('password123');
    expect(user?.password).toMatch(/^\$2[aby]\$/);
  });

  it('returns a JWT token signed with JWT_SECRET containing the user id', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dave@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as { userId: string };
    expect(decoded.userId).toBe(res.body.id);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'erin@example.com', password: 'password123' });

    expect(() => jwt.verify(res.body.token, 'wrong-secret')).toThrow();
  });
});
