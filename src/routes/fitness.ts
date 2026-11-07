import { MuscleGroup, Prisma } from '../generated/prisma/client.js';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getPrismaClient } from '../db/prisma.js';
import { requireSession } from '../middleware/require-session.js';

export const fitnessRouter = Router();
fitnessRouter.use(
  [
    '/exercises',
    '/routines',
    '/routines/:id',
    '/weight-entries',
    '/weight-entries/:id',
    '/body-measurements',
    '/workouts',
    '/workouts/:id',
  ],
  requireSession,
);

const prisma = getPrismaClient();
const muscleGroupSchema = z.nativeEnum(MuscleGroup);
const idSchema = z.string().trim().min(1).max(128);
const nameSchema = z.string().trim().min(1).max(100);
const weightSchema = z.number().finite().min(0).max(99999.99);

const routineSetSchema = z.object({
  setNumber: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  weightKg: weightSchema.nullable().optional(),
});

const routineExerciseSchema = z.object({
  exerciseId: idSchema,
  position: z.number().int().min(0).max(1000),
  sets: z.array(routineSetSchema).min(1).max(100),
  restSeconds: z.number().int().min(0).max(3600),
});

const routineCreateSchema = z.object({
  name: nameSchema,
  exercises: z.array(routineExerciseSchema).max(100).default([]),
});

const routineUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    exercises: z.array(routineExerciseSchema).max(100).optional(),
  })
  .refine((value) => value.name !== undefined || value.exercises !== undefined, {
    message: 'At least one field must be provided.',
  });

const bodyWeightCreateSchema = z.object({
  weightKg: weightSchema.min(1).max(999.99),
  measuredAt: z.string().datetime({ offset: true }).optional(),
});

const bodyWeightUpdateSchema = z
  .object({
    weightKg: weightSchema.min(1).max(999.99).optional(),
    measuredAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((value) => value.weightKg !== undefined || value.measuredAt !== undefined, {
    message: 'At least one field must be provided.',
  });

const measurementSchema = z.number().finite().min(0.01).max(999.99);
const bodyMeasurementCreateSchema = z
  .object({
    chestCm: measurementSchema.optional(),
    waistCm: measurementSchema.optional(),
    hipCm: measurementSchema.optional(),
    armCm: measurementSchema.optional(),
    thighCm: measurementSchema.optional(),
    calfCm: measurementSchema.optional(),
    measuredAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    ({ chestCm, waistCm, hipCm, armCm, thighCm, calfCm }) =>
      [chestCm, waistCm, hipCm, armCm, thighCm, calfCm].some(
        (measurement) => measurement !== undefined,
      ),
    { message: 'At least one body measurement must be provided.' },
  );

const workoutSetSchema = z.object({
  setNumber: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  weightKg: weightSchema.nullable().optional(),
});

const workoutExerciseSchema = z.object({
  exerciseId: idSchema.nullable().optional(),
  exerciseName: nameSchema.optional(),
  position: z.number().int().min(0).max(1000),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  sets: z.array(workoutSetSchema).min(1).max(100),
});

const workoutCreateSchema = z.object({
  name: nameSchema,
  routineId: idSchema.nullable().optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  exercises: z.array(workoutExerciseSchema).min(1).max(100),
});

function parseBody<T extends z.ZodType>(
  schema: T,
  request: Request,
  response: Response,
): z.output<T> | undefined {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request body is invalid.',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return undefined;
  }

  return result.data;
}

function routeId(request: Request, response: Response): string | undefined {
  const result = idSchema.safeParse(request.params.id);
  if (!result.success) {
    response.status(400).json({
      error: { code: 'INVALID_ID', message: 'A valid record ID is required.' },
    });
    return undefined;
  }

  return result.data;
}

function validatePositions(
  exercises: Array<{ position: number }>,
  response: Response,
): boolean {
  const positions = exercises.map(({ position }) => position);
  if (new Set(positions).size === positions.length) return true;

  response.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Exercise positions must be unique.',
    },
  });
  return false;
}

function validateSetNumbers(
  exercises: Array<{ sets: Array<{ setNumber: number }> }>,
  response: Response,
): boolean {
  for (const exercise of exercises) {
    const setNumbers = exercise.sets.map(({ setNumber }) => setNumber);
    if (new Set(setNumbers).size === setNumbers.length) continue;

    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Set numbers must be unique within each exercise.',
      },
    });
    return false;
  }

  return true;
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

async function validateExerciseIds(
  exercises: Array<{ exerciseId: string }>,
  response: Response,
): Promise<boolean> {
  const ids = [...new Set(exercises.map(({ exerciseId }) => exerciseId))];
  if (ids.length === 0) return true;

  const found = await prisma.exercise.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const foundIds = new Set(found.map(({ id }) => id));
  const missingIds = ids.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    response.status(400).json({
      error: {
        code: 'UNKNOWN_EXERCISE',
        message: 'One or more exercise IDs do not exist.',
        exerciseIds: missingIds,
      },
    });
    return false;
  }

  return true;
}

function mapRoutine<T extends {
  exercises: Array<{
    sets: Array<{ weightKg: Prisma.Decimal | null }>;
    exercise: { muscleGroups: Array<{ muscleGroup: MuscleGroup }> };
  }>;
}>(routine: T) {
  return {
    ...routine,
    exercises: routine.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        weightKg: decimalToNumber(set.weightKg),
      })),
      exercise: {
        ...exercise.exercise,
        muscleGroups: exercise.exercise.muscleGroups.map(
          ({ muscleGroup }) => muscleGroup,
        ),
      },
    })),
  };
}

fitnessRouter.get('/exercises', async (request, response) => {
  const querySchema = z.object({
    muscleGroup: muscleGroupSchema.optional(),
    q: z.string().trim().min(1).max(100).optional(),
  });
  const query = querySchema.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query parameters are invalid.',
        details: query.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  const exercises = await prisma.exercise.findMany({
    where: {
      ...(query.data.muscleGroup && {
        muscleGroups: { some: { muscleGroup: query.data.muscleGroup } },
      }),
      ...(query.data.q && {
        name: { contains: query.data.q, mode: 'insensitive' },
      }),
    },
    include: { muscleGroups: { select: { muscleGroup: true } } },
    orderBy: { name: 'asc' },
  });

  response.json(
    exercises.map((exercise) => ({
      ...exercise,
      muscleGroups: exercise.muscleGroups.map(({ muscleGroup }) => muscleGroup),
    })),
  );
});

fitnessRouter.get('/routines', async (_request, response) => {
  const routines = await prisma.routine.findMany({
    where: { userId: response.locals.userId },
    include: {
      exercises: {
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
          exercise: {
            include: { muscleGroups: { select: { muscleGroup: true } } },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  response.json(routines.map(mapRoutine));
});

fitnessRouter.post('/routines', async (request, response) => {
  const body = parseBody(routineCreateSchema, request, response);
  if (!body) return;
  if (!validatePositions(body.exercises, response)) return;
  if (!validateSetNumbers(body.exercises, response)) return;
  if (!(await validateExerciseIds(body.exercises, response))) return;

  const routine = await prisma.routine.create({
    data: {
      userId: response.locals.userId,
      name: body.name,
      exercises: {
        create: body.exercises.map(({ sets, ...exercise }) => ({
          ...exercise,
          sets: {
            create: sets.map((set) => ({
              ...set,
              weightKg:
                set.weightKg == null ? null : new Prisma.Decimal(set.weightKg),
            })),
          },
        })),
      },
    },
    include: {
      exercises: {
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
          exercise: {
            include: { muscleGroups: { select: { muscleGroup: true } } },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  response.status(201).json(mapRoutine(routine));
});

fitnessRouter.get('/routines/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;

  const routine = await prisma.routine.findFirst({
    where: { id, userId: response.locals.userId },
    include: {
      exercises: {
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
          exercise: {
            include: { muscleGroups: { select: { muscleGroup: true } } },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!routine) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Routine not found.' },
    });
    return;
  }

  response.json(mapRoutine(routine));
});

fitnessRouter.patch('/routines/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const body = parseBody(routineUpdateSchema, request, response);
  if (!body) return;
  if (body.exercises && !validatePositions(body.exercises, response)) return;
  if (body.exercises && !validateSetNumbers(body.exercises, response)) return;
  if (body.exercises && !(await validateExerciseIds(body.exercises, response))) {
    return;
  }

  const existing = await prisma.routine.findFirst({
    where: { id, userId: response.locals.userId },
    select: { id: true },
  });
  if (!existing) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Routine not found.' },
    });
    return;
  }

  const routine = await prisma.routine.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.exercises !== undefined && {
        exercises: {
          deleteMany: {},
          create: body.exercises.map(({ sets, ...exercise }) => ({
            ...exercise,
            sets: {
              create: sets.map((set) => ({
                ...set,
                weightKg:
                  set.weightKg == null ? null : new Prisma.Decimal(set.weightKg),
              })),
            },
          })),
        },
      }),
    },
    include: {
      exercises: {
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
          exercise: {
            include: { muscleGroups: { select: { muscleGroup: true } } },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  response.json(mapRoutine(routine));
});

fitnessRouter.delete('/routines/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;

  const result = await prisma.routine.deleteMany({
    where: { id, userId: response.locals.userId },
  });
  if (result.count === 0) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Routine not found.' },
    });
    return;
  }

  response.status(204).end();
});

fitnessRouter.get('/weight-entries', async (_request, response) => {
  const entries = await prisma.bodyWeightEntry.findMany({
    where: { userId: response.locals.userId },
    orderBy: { measuredAt: 'desc' },
  });
  response.json(
    entries.map((entry) => ({ ...entry, weightKg: Number(entry.weightKg) })),
  );
});

fitnessRouter.post('/weight-entries', async (request, response) => {
  const body = parseBody(bodyWeightCreateSchema, request, response);
  if (!body) return;

  const entry = await prisma.bodyWeightEntry.create({
    data: {
      userId: response.locals.userId,
      weightKg: new Prisma.Decimal(body.weightKg),
      ...(body.measuredAt && { measuredAt: new Date(body.measuredAt) }),
    },
  });
  response.status(201).json({ ...entry, weightKg: Number(entry.weightKg) });
});

fitnessRouter.patch('/weight-entries/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const body = parseBody(bodyWeightUpdateSchema, request, response);
  if (!body) return;

  const result = await prisma.bodyWeightEntry.updateMany({
    where: { id, userId: response.locals.userId },
    data: {
      ...(body.weightKg !== undefined && {
        weightKg: new Prisma.Decimal(body.weightKg),
      }),
      ...(body.measuredAt !== undefined && {
        measuredAt: new Date(body.measuredAt),
      }),
    },
  });
  if (result.count === 0) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Weight entry not found.' },
    });
    return;
  }

  const entry = await prisma.bodyWeightEntry.findUniqueOrThrow({ where: { id } });
  response.json({ ...entry, weightKg: Number(entry.weightKg) });
});

fitnessRouter.delete('/weight-entries/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;

  const result = await prisma.bodyWeightEntry.deleteMany({
    where: { id, userId: response.locals.userId },
  });
  if (result.count === 0) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Weight entry not found.' },
    });
    return;
  }

  response.status(204).end();
});

fitnessRouter.get('/body-measurements', async (_request, response) => {
  const entries = await prisma.bodyMeasurementEntry.findMany({
    where: { userId: response.locals.userId },
    orderBy: { measuredAt: 'desc' },
  });
  response.json(
    entries.map((entry) => ({
      ...entry,
      chestCm: decimalToNumber(entry.chestCm),
      waistCm: decimalToNumber(entry.waistCm),
      hipCm: decimalToNumber(entry.hipCm),
      armCm: decimalToNumber(entry.armCm),
      thighCm: decimalToNumber(entry.thighCm),
      calfCm: decimalToNumber(entry.calfCm),
    })),
  );
});

fitnessRouter.post('/body-measurements', async (request, response) => {
  const body = parseBody(bodyMeasurementCreateSchema, request, response);
  if (!body) return;

  const entry = await prisma.bodyMeasurementEntry.create({
    data: {
      userId: response.locals.userId,
      ...(body.chestCm !== undefined && {
        chestCm: new Prisma.Decimal(body.chestCm),
      }),
      ...(body.waistCm !== undefined && {
        waistCm: new Prisma.Decimal(body.waistCm),
      }),
      ...(body.hipCm !== undefined && { hipCm: new Prisma.Decimal(body.hipCm) }),
      ...(body.armCm !== undefined && { armCm: new Prisma.Decimal(body.armCm) }),
      ...(body.thighCm !== undefined && {
        thighCm: new Prisma.Decimal(body.thighCm),
      }),
      ...(body.calfCm !== undefined && { calfCm: new Prisma.Decimal(body.calfCm) }),
      ...(body.measuredAt && { measuredAt: new Date(body.measuredAt) }),
    },
  });
  response.status(201).json({
    ...entry,
    chestCm: decimalToNumber(entry.chestCm),
    waistCm: decimalToNumber(entry.waistCm),
    hipCm: decimalToNumber(entry.hipCm),
    armCm: decimalToNumber(entry.armCm),
    thighCm: decimalToNumber(entry.thighCm),
    calfCm: decimalToNumber(entry.calfCm),
  });
});

fitnessRouter.get('/workouts', async (_request, response) => {
  const workouts = await prisma.workout.findMany({
    where: { userId: response.locals.userId },
    include: {
      exercises: {
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { completedAt: 'desc' },
  });

  response.json(
    workouts.map((workout) => ({
      ...workout,
      exercises: workout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          weightKg: decimalToNumber(set.weightKg),
        })),
      })),
    })),
  );
});

fitnessRouter.post('/workouts', async (request, response) => {
  const body = parseBody(workoutCreateSchema, request, response);
  if (!body) return;

  if (!validatePositions(body.exercises, response)) return;
  if (!validateSetNumbers(body.exercises, response)) return;

  const routine =
    body.routineId == null
      ? null
      : await prisma.routine.findFirst({
          where: { id: body.routineId, userId: response.locals.userId },
          select: { id: true },
        });
  if (body.routineId != null && !routine) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Routine not found.' },
    });
    return;
  }

  const catalogIds = [
    ...new Set(
      body.exercises.flatMap(({ exerciseId }) =>
        exerciseId ? [exerciseId] : [],
      ),
    ),
  ];
  const catalogExercises = await prisma.exercise.findMany({
    where: { id: { in: catalogIds } },
    select: { id: true, name: true },
  });
  const catalogById = new Map(
    catalogExercises.map((exercise) => [exercise.id, exercise]),
  );
  const missingIds = catalogIds.filter((id) => !catalogById.has(id));
  if (missingIds.length > 0) {
    response.status(400).json({
      error: {
        code: 'UNKNOWN_EXERCISE',
        message: 'One or more exercise IDs do not exist.',
        exerciseIds: missingIds,
      },
    });
    return;
  }

  if (
    body.exercises.some(
      ({ exerciseId, exerciseName }) =>
        exerciseId == null && exerciseName === undefined,
    )
  ) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Custom exercises must include an exerciseName.',
      },
    });
    return;
  }

  const workout = await prisma.workout.create({
    data: {
      userId: response.locals.userId,
      name: body.name,
      ...(body.routineId != null && { routineId: body.routineId }),
      ...(body.startedAt && { startedAt: new Date(body.startedAt) }),
      ...(body.completedAt && { completedAt: new Date(body.completedAt) }),
      ...(body.notes != null && { notes: body.notes }),
      exercises: {
        create: body.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId ?? null,
          exerciseName: exercise.exerciseId
            ? catalogById.get(exercise.exerciseId)!.name
            : exercise.exerciseName!,
          position: exercise.position,
          restSeconds: exercise.restSeconds ?? null,
          sets: {
            create: exercise.sets.map((set) => ({
              ...set,
              weightKg:
                set.weightKg == null
                  ? null
                  : new Prisma.Decimal(set.weightKg),
            })),
          },
        })),
      },
    },
    include: {
      exercises: {
        include: { sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { position: 'asc' },
      },
    },
  });

  response.status(201).json({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        weightKg: decimalToNumber(set.weightKg),
      })),
    })),
  });
});

fitnessRouter.get('/workouts/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;

  const workout = await prisma.workout.findFirst({
    where: { id, userId: response.locals.userId },
    include: {
      exercises: {
        include: { sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!workout) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Workout not found.' },
    });
    return;
  }

  response.json({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        weightKg: decimalToNumber(set.weightKg),
      })),
    })),
  });
});

fitnessRouter.delete('/workouts/:id', async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;

  const result = await prisma.workout.deleteMany({
    where: { id, userId: response.locals.userId },
  });
  if (result.count === 0) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Workout not found.' },
    });
    return;
  }

  response.status(204).end();
});
