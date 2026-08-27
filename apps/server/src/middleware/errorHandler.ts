import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express only treats a 4-arg function as error-handling middleware, so `next` must stay.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
