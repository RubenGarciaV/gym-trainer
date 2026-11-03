import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import app from './app.js';

describe('Gym Trainer API', () => {
  it('reports the API as healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  });

  it('exposes the Better Auth health endpoint', async () => {
    const response = await request(app).get('/api/auth/ok');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true });
  });

  it('allows credentialed requests from configured UI origins', async () => {
    const response = await request(app)
      .options('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    assert.equal(response.status, 204);
    assert.equal(
      response.headers['access-control-allow-origin'],
      'http://localhost:5173',
    );
    assert.equal(response.headers['access-control-allow-credentials'], 'true');
  });

  it('requires a valid session for fitness data', async () => {
    const response = await request(app).get('/api/v1/routines');

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
      error: {
        code: 'UNAUTHORIZED',
        message: 'A valid session is required.',
      },
    });
  });

  it('returns a consistent response for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });
});
