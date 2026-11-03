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
