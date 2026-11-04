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
  { slug: 'press-banca-declinado', name: 'Press de banca declinado', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'press-inclinado-mancuernas', name: 'Press inclinado con mancuernas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'aperturas-mancuernas', name: 'Aperturas con mancuernas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'aperturas-inclinadas', name: 'Aperturas inclinadas con mancuernas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'cruce-poleas-pecho', name: 'Cruce de poleas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'cruce-poleas-bajo', name: 'Cruce de poleas de abajo hacia arriba', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'press-pecho-maquina', name: 'Press de pecho en máquina', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'aperturas-maquina', name: 'Aperturas en máquina', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'fondos-paralelas', name: 'Fondos en paralelas', muscleGroups: [MuscleGroup.CHEST, MuscleGroup.TRICEPS] },
  { slug: 'flexiones', name: 'Flexiones', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'flexiones-inclinadas', name: 'Flexiones inclinadas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'flexiones-declinadas', name: 'Flexiones declinadas', muscleGroups: [MuscleGroup.CHEST] },
  { slug: 'dominadas', name: 'Dominadas', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'jalon-polea', name: 'Jalón al pecho en polea', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'jalon-agarre-neutro', name: 'Jalón al pecho con agarre neutro', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'jalon-brazos-rectos', name: 'Jalón con brazos rectos', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-barra', name: 'Remo con barra', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-t-barra', name: 'Remo en T', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-polea-sentado', name: 'Remo sentado en polea', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-polea-unilateral', name: 'Remo unilateral en polea', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-mancuerna', name: 'Remo con mancuerna', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-pecho-apoyado', name: 'Remo con pecho apoyado', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'remo-invertido', name: 'Remo invertido', muscleGroups: [MuscleGroup.BACK] },
  { slug: 'peso-muerto-convencional', name: 'Peso muerto convencional', muscleGroups: [MuscleGroup.BACK, MuscleGroup.LEGS, MuscleGroup.GLUTES] },
  { slug: 'hiperextensiones', name: 'Hiperextensiones', muscleGroups: [MuscleGroup.BACK, MuscleGroup.GLUTES] },
  { slug: 'face-pull', name: 'Face pull', muscleGroups: [MuscleGroup.BACK, MuscleGroup.SHOULDERS] },
  { slug: 'curl-barra', name: 'Curl de bíceps con barra', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-barra-z', name: 'Curl con barra Z', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-mancuernas', name: 'Curl alterno con mancuernas', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-inclinado', name: 'Curl inclinado con mancuernas', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-martillo', name: 'Curl martillo', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-predicador', name: 'Curl predicador', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-polea', name: 'Curl de bíceps en polea', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-concentrado', name: 'Curl concentrado', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-bayesiano', name: 'Curl bayesiano en polea', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'curl-inverso', name: 'Curl inverso con barra', muscleGroups: [MuscleGroup.BICEPS] },
  { slug: 'sentadilla', name: 'Sentadilla con barra', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'sentadilla-frontal', name: 'Sentadilla frontal', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'sentadilla-goblet', name: 'Sentadilla goblet', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'sentadilla-hack', name: 'Sentadilla hack', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'prensa-piernas', name: 'Prensa de piernas', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'zancada-atras', name: 'Zancada hacia atrás', muscleGroups: [MuscleGroup.LEGS, MuscleGroup.GLUTES] },
  { slug: 'zancada-caminando', name: 'Zancadas caminando', muscleGroups: [MuscleGroup.LEGS, MuscleGroup.GLUTES] },
  { slug: 'sentadilla-bulgara', name: 'Sentadilla búlgara', muscleGroups: [MuscleGroup.LEGS, MuscleGroup.GLUTES] },
  { slug: 'step-up', name: 'Subida al cajón', muscleGroups: [MuscleGroup.LEGS, MuscleGroup.GLUTES] },
  { slug: 'peso-muerto-rumano', name: 'Peso muerto rumano', muscleGroups: [MuscleGroup.BACK, MuscleGroup.LEGS] },
  { slug: 'extension-cuadriceps', name: 'Extensión de cuádriceps', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'extension-cuadriceps-unilateral', name: 'Extensión unilateral de cuádriceps', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'curl-femoral', name: 'Curl femoral', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'curl-femoral-sentado', name: 'Curl femoral sentado', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'curl-femoral-tumbado', name: 'Curl femoral tumbado', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'aductores-maquina', name: 'Aductores en máquina', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'elevacion-gemelos', name: 'Elevación de gemelos', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'gemelos-sentado', name: 'Elevación de gemelos sentado', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'gemelos-prensa', name: 'Elevación de gemelos en prensa', muscleGroups: [MuscleGroup.LEGS] },
  { slug: 'press-militar', name: 'Press militar', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'press-hombros-mancuernas', name: 'Press de hombros con mancuernas', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'press-arnold', name: 'Press Arnold', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'elevacion-lateral', name: 'Elevación lateral', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'elevacion-lateral-polea', name: 'Elevación lateral en polea', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'elevacion-frontal', name: 'Elevación frontal', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'pajaro-mancuernas', name: 'Pájaros con mancuernas', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'pajaro-maquina', name: 'Pájaros en máquina', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'remo-vertical', name: 'Remo al mentón', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'encogimientos-hombros', name: 'Encogimientos de hombros', muscleGroups: [MuscleGroup.SHOULDERS] },
  { slug: 'extension-triceps-polea', name: 'Extensión de tríceps en polea', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'extension-triceps-cuerda', name: 'Extensión de tríceps con cuerda', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'extension-triceps-sobre-cabeza', name: 'Extensión de tríceps sobre la cabeza', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'extension-triceps-mancuerna', name: 'Extensión de tríceps con mancuerna', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'press-frances', name: 'Press francés', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'press-banca-agarre-cerrado', name: 'Press de banca con agarre cerrado', muscleGroups: [MuscleGroup.CHEST, MuscleGroup.TRICEPS] },
  { slug: 'patada-triceps', name: 'Patada de tríceps', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'extension-triceps-unilateral', name: 'Extensión unilateral de tríceps en polea', muscleGroups: [MuscleGroup.TRICEPS] },
  { slug: 'hip-thrust', name: 'Hip thrust', muscleGroups: [MuscleGroup.GLUTES, MuscleGroup.LEGS] },
  { slug: 'puente-gluteos', name: 'Puente de glúteos', muscleGroups: [MuscleGroup.GLUTES] },
  { slug: 'patada-gluteo-polea', name: 'Patada de glúteo en polea', muscleGroups: [MuscleGroup.GLUTES] },
  { slug: 'abduccion-cadera-maquina', name: 'Abducción de cadera en máquina', muscleGroups: [MuscleGroup.GLUTES] },
  { slug: 'abduccion-cadera-polea', name: 'Abducción de cadera en polea', muscleGroups: [MuscleGroup.GLUTES] },
  { slug: 'peso-muerto-sumo', name: 'Peso muerto sumo', muscleGroups: [MuscleGroup.GLUTES, MuscleGroup.LEGS, MuscleGroup.BACK] },
  { slug: 'frog-pumps', name: 'Frog pumps', muscleGroups: [MuscleGroup.GLUTES] },
  { slug: 'plancha', name: 'Plancha', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'plancha-lateral', name: 'Plancha lateral', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'crunch', name: 'Crunch abdominal', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'crunch-polea', name: 'Crunch en polea', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'elevacion-piernas-colgado', name: 'Elevación de piernas colgado', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'elevacion-rodillas-silla', name: 'Elevación de rodillas en silla romana', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'rueda-abdominal', name: 'Rueda abdominal', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'dead-bug', name: 'Dead bug', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'pallof-press', name: 'Pallof press', muscleGroups: [MuscleGroup.CORE] },
  { slug: 'giros-rusos', name: 'Giros rusos', muscleGroups: [MuscleGroup.CORE] },
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
