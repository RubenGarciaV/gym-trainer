CREATE TYPE "ExerciseCategory" AS ENUM ('STRENGTH', 'CARDIO');

ALTER TABLE "Exercise"
ADD COLUMN "category" "ExerciseCategory" NOT NULL DEFAULT 'STRENGTH';
