import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app.js';
import { prisma } from '../../db/prisma.js';

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await prisma.joinRequest.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await request(app)
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });
  });

  it('logs in with correct email/password and returns 200 with JWT, without creating a new user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@example.com');
    expect(typeof res.body.token).toBe('string');

    const count = await prisma.user.count();
    expect(count).toBe(1);
  });

  it('returns a JWT signed with JWT_SECRET containing the id of the matching user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as { userId: string };
    expect(decoded.userId).toBe(res.body.id);
  });

  it('rejects a login with a non-existent email with an auth error and no JWT', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects a login with an existing email and wrong password with the same auth error', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('returns identical error body for non-existent email and wrong password', async () => {
    const nonExistentRes = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    const wrongPasswordRes = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(nonExistentRes.status).toBe(wrongPasswordRes.status);
    expect(nonExistentRes.body).toEqual(wrongPasswordRes.body);
  });
});
