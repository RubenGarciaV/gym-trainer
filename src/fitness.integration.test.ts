import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import '../src/env.js';
import { auth } from './auth.js';
import app from './app.js';
import { getPrismaClient } from './db/prisma.js';
import request from 'supertest';

const prisma = getPrismaClient();
const emailSuffix = `${Date.now()}-${crypto.randomUUID()}`;
const userIds: string[] = [];
const cookies: string[] = [];

async function createSession(label: string): Promise<string> {
  const result = await auth.api.signUpEmail({
    body: {
      name: `Fitness API test ${label}`,
      email: `fitness-${label}-${emailSuffix}@example.invalid`,
      password: `GymTrainer-${crypto.randomUUID()}-A1!`,
    },
    headers: new Headers({ origin: 'http://localhost:5173' }),
    returnHeaders: true,
  });
  userIds.push(result.response.user.id);

  const setCookie = result.headers.get('set-cookie');
  assert.ok(setCookie, 'sign-up should create a session cookie');
  return setCookie.split(';', 1)[0];
}

function requestAs(cookie: string) {
  const prepare = (builder: request.Test) =>
    builder.set('Origin', 'http://localhost:5173').set('Cookie', cookie);

  return {
    get: (path: string) => prepare(request(app).get(path)),
    post: (path: string) => prepare(request(app).post(path)),
    patch: (path: string) => prepare(request(app).patch(path)),
    delete: (path: string) => prepare(request(app).delete(path)),
  };
}

describe('Fitness API integration', () => {
  before(async () => {
    cookies.push(await createSession('owner'));
    cookies.push(await createSession('other'));
  });

  after(async () => {
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  it('filters exercises and protects routines, body weight, and workout history by user', async () => {
    const owner = requestAs(cookies[0]);
    const other = requestAs(cookies[1]);

    const catalog = await owner.get('/api/v1/exercises?muscleGroup=CHEST&q=press');
    assert.equal(catalog.status, 200);
    assert.ok(catalog.body.length > 0);
    assert.ok(
      catalog.body.every((exercise: { muscleGroups: string[] }) =>
        exercise.muscleGroups.includes('CHEST'),
      ),
    );

    const exercise = catalog.body[0] as { id: string };
    const routineResponse = await owner.post('/api/v1/routines').send({
      name: 'Rutina de integración',
      exercises: [
        {
          exerciseId: exercise.id,
          position: 0,
          sets: [
            { setNumber: 1, reps: 10, weightKg: 20 },
            { setNumber: 2, reps: 8, weightKg: 22.5 },
            { setNumber: 3, reps: 6, weightKg: 25 },
          ],
          restSeconds: 90,
        },
      ],
    });
    assert.equal(routineResponse.status, 201);
    const routineId = routineResponse.body.id as string;
    assert.deepEqual(
      routineResponse.body.exercises[0].sets.map(
        (set: { setNumber: number; reps: number; weightKg: number }) => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weightKg: set.weightKg,
        }),
      ),
      [
        { setNumber: 1, reps: 10, weightKg: 20 },
        { setNumber: 2, reps: 8, weightKg: 22.5 },
        { setNumber: 3, reps: 6, weightKg: 25 },
      ],
    );
    assert.equal(
      (await owner.get(`/api/v1/routines/${routineId}`)).body.exercises[0].sets[1]
        .weightKg,
      22.5,
    );
    assert.equal(
      (
        await owner.patch(`/api/v1/routines/${routineId}`).send({
          exercises: [
            {
              exerciseId: exercise.id,
              position: 0,
              sets: [
                { setNumber: 1, reps: 12, weightKg: 17.5 },
                { setNumber: 2, reps: 10, weightKg: 20 },
              ],
              restSeconds: 60,
            },
          ],
        })
      ).body.exercises[0].sets[1].reps,
      10,
    );
    assert.equal(
      (
        await owner.post('/api/v1/routines').send({
          name: 'Rutina con series duplicadas',
          exercises: [
            {
              exerciseId: exercise.id,
              position: 0,
              sets: [
                { setNumber: 1, reps: 10, weightKg: 20 },
                { setNumber: 1, reps: 8, weightKg: 22.5 },
              ],
              restSeconds: 90,
            },
          ],
        })
      ).status,
      400,
    );
    assert.equal((await other.get(`/api/v1/routines/${routineId}`)).status, 404);
    assert.equal(
      (
        await owner.patch(`/api/v1/routines/${routineId}`).send({
          name: 'Rutina actualizada',
        })
      ).body.name,
      'Rutina actualizada',
    );

    const weightResponse = await owner
      .post('/api/v1/weight-entries')
      .send({ weightKg: 75.4 });
    assert.equal(weightResponse.status, 201);
    assert.equal(weightResponse.body.weightKg, 75.4);
    const weightId = weightResponse.body.id as string;
    assert.equal(
      (
        await owner
          .patch(`/api/v1/weight-entries/${weightId}`)
          .send({ weightKg: 74.8 })
      ).body.weightKg,
      74.8,
    );
    const weightHistory = await owner.get('/api/v1/weight-entries');
    assert.ok(
      weightHistory.body.some((entry: { id: string }) => entry.id === weightId),
    );

    const bodyMeasurementResponse = await owner
      .post('/api/v1/body-measurements')
      .send({
        chestCm: 98.5,
        waistCm: 82,
        hipCm: 101,
        armCm: 34.5,
        thighCm: 58,
        calfCm: 37,
      });
    assert.equal(bodyMeasurementResponse.status, 201);
    assert.deepEqual(
      {
        chestCm: bodyMeasurementResponse.body.chestCm,
        waistCm: bodyMeasurementResponse.body.waistCm,
        hipCm: bodyMeasurementResponse.body.hipCm,
        armCm: bodyMeasurementResponse.body.armCm,
        thighCm: bodyMeasurementResponse.body.thighCm,
        calfCm: bodyMeasurementResponse.body.calfCm,
      },
      {
        chestCm: 98.5,
        waistCm: 82,
        hipCm: 101,
        armCm: 34.5,
        thighCm: 58,
        calfCm: 37,
      },
    );
    const measurementId = bodyMeasurementResponse.body.id as string;
    const bodyMeasurementHistory = await owner.get('/api/v1/body-measurements');
    assert.ok(
      bodyMeasurementHistory.body.some(
        (entry: { id: string }) => entry.id === measurementId,
      ),
    );
    assert.ok(
      bodyMeasurementHistory.body.every(
        (entry: { userId: string }) => entry.userId === userIds[0],
      ),
    );
    assert.equal(
      (await other.get('/api/v1/body-measurements')).body.some(
        (entry: { id: string }) => entry.id === measurementId,
      ),
      false,
    );
    assert.equal(
      (
        await owner.post('/api/v1/body-measurements').send({
          measuredAt: '2026-11-08T00:00:00Z',
        })
      ).status,
      400,
    );

    const workoutResponse = await owner.post('/api/v1/workouts').send({
      name: 'Entrenamiento de integración',
      routineId,
      exercises: [
        {
          exerciseId: exercise.id,
          position: 0,
          restSeconds: 90,
          sets: [
            { setNumber: 1, reps: 10, weightKg: 20 },
            { setNumber: 2, reps: 8, weightKg: 22.5 },
          ],
        },
      ],
    });
    assert.equal(workoutResponse.status, 201);
    const workoutId = workoutResponse.body.id as string;
    assert.equal(workoutResponse.body.exercises[0].sets[1].weightKg, 22.5);
    const workoutHistory = await owner.get('/api/v1/workouts');
    assert.ok(
      workoutHistory.body.some((workout: { id: string }) => workout.id === workoutId),
    );
    assert.equal((await other.get(`/api/v1/workouts/${workoutId}`)).status, 404);

    assert.equal((await owner.delete(`/api/v1/workouts/${workoutId}`)).status, 204);
    assert.equal((await owner.delete(`/api/v1/weight-entries/${weightId}`)).status, 204);
    assert.equal((await owner.delete(`/api/v1/routines/${routineId}`)).status, 204);
  });
});
