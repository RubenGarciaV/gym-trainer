import '../src/env.js';
import { MuscleGroup } from '../src/generated/prisma/client.js';
import { getPrismaClient } from '../src/db/prisma.js';

const exercises: Array<{
  slug: string;
  name: string;
  muscleGroups: MuscleGroup[];
}> = [
  { slug: 'press-banca', name: 'Press de banca', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'press-banca-inclinado', name: 'Press de banca inclinado', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'aperturas-mancuernas', name: 'Aperturas con mancuernas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'cruce-poleas-pecho', name: 'Cruce de poleas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'press-pecho-maquina', name: 'Press de pecho en máquina', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'flexiones', name: 'Flexiones', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'dominadas', name: 'Dominadas', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'jalon-polea', name: 'Jalón al pecho en polea', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-barra', name: 'Remo con barra', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-polea-sentado', name: 'Remo sentado en polea', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-mancuerna', name: 'Remo con mancuerna', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'face-pull', name: 'Face pull', muscleGroups: [MuscleGroup.BACK, MuscleGroup.SHOULDERS] },
  { slug: 'curl-barra', name: 'Curl de bíceps con barra', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-mancuernas', name: 'Curl alterno con mancuernas', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-martillo', name: 'Curl martillo', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-predicador', name: 'Curl predicador', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-polea', name: 'Curl de bíceps en polea', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'sentadilla', name: 'Sentadilla con barra', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'prensa-piernas', name: 'Prensa de piernas', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'peso-muerto-rumano', name: 'Peso muerto rumano', muscleGroups: [MuscleGroup.BACK, MuscleGroup.LEGS] },
  { slug: 'extension-cuadriceps', name: 'Extensión de cuádriceps', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'curl-femoral', name: 'Curl femoral', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'elevacion-gemelos', name: 'Elevación de gemelos', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'press-militar', name: 'Press militar', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'elevacion-lateral', name: 'Elevación lateral', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'elevacion-frontal', name: 'Elevación frontal', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'pajaro-mancuernas', name: 'Pájaros con mancuernas', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'encogimientos-hombros', name: 'Encogimientos de hombros', muscleGroups: [MuscleGroup.SHOULDERS] },
];

const prisma = getPrismaClient();

try {
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      create: {
        slug: exercise.slug,
        name: exercise.name,
        muscleGroups: {
          create: exercise.muscleGroups.map((muscleGroup) => ({ muscleGroup })),
        },
      },
      update: {
        name: exercise.name,
        muscleGroups: {
          deleteMany: {},
          create: exercise.muscleGroups.map((muscleGroup) => ({ muscleGroup })),
        },
      },
    });
  }

  console.log(`Seeded ${exercises.length} exercises.`);
} finally {
  await prisma.$disconnect();
}
