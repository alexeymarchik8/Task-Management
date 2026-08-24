import { beforeAll, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from './verifyToken.js';

beforeAll(() => {
  process.env.JWT_SECRET ??= 'test-secret';
});

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('verifyToken middleware', () => {
  it('sets req.userId and calls next() for a valid token', () => {
    const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET!);
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = vi.fn();

    verifyToken(req as AuthenticatedRequest, res, next);

    expect((req as AuthenticatedRequest).userId).toBe('user-1');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when the Authorization header is missing', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = vi.fn();

    verifyToken(req as AuthenticatedRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } } as Request;
    const res = mockRes();
    const next = vi.fn();

    verifyToken(req as AuthenticatedRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ userId: 'user-1' }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = vi.fn();

    verifyToken(req as AuthenticatedRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
