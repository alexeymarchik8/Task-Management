import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('GET /health', () => {
  it('returns a 200 ok status without authentication', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('CORS', () => {
  it('allows cross-origin requests from the client dev server', async () => {
    const res = await request(app)
      .options('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
