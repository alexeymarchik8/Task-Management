import type { NextFunction, Request, Response } from 'express';
import { verifyToken as verifyJwt } from '../services/tokenService.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  try {
    const decoded = verifyJwt(token);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}
