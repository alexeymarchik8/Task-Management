import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import 'express-async-errors';
import { errorHandler } from './errorHandler.js';

describe('errorHandler', () => {
  it('responds with a generic 500 and a consistent error shape for a thrown error', async () => {
    const app = express();
    app.get('/boom', () => {
      throw new Error('unexpected failure');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Внутренняя ошибка сервера' });
  });

  it('does not leak the original error message to the client', async () => {
    const app = express();
    app.get('/boom', () => {
      throw new Error('super secret stack detail');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');

    expect(JSON.stringify(res.body)).not.toContain('super secret stack detail');
  });

  it('also catches a rejected promise from an async handler', async () => {
    const app = express();
    app.get('/boom-async', async () => {
      throw new Error('unexpected async failure');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom-async');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Внутренняя ошибка сервера' });
  });
});
