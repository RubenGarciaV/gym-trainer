-- CreateTable
CREATE TABLE "RoutineSet" (
    "id" TEXT NOT NULL,
    "routineExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DECIMAL(7,2),

    CONSTRAINT "RoutineSet_pkey" PRIMARY KEY ("id")
);

-- Preserve existing routine targets by copying the previous shared values to each set.
INSERT INTO "RoutineSet" ("id", "routineExerciseId", "setNumber", "reps", "weightKg")
SELECT
    routine_exercise."id" || '_set_' || series.set_number,
    routine_exercise."id",
    series.set_number,
    routine_exercise."reps",
    routine_exercise."weightKg"
FROM "RoutineExercise" AS routine_exercise
CROSS JOIN LATERAL generate_series(1, routine_exercise."sets") AS series(set_number);

-- DropColumn
ALTER TABLE "RoutineExercise"
DROP COLUMN "sets",
DROP COLUMN "reps",
DROP COLUMN "weightKg";

-- CreateIndex
CREATE UNIQUE INDEX "RoutineSet_routineExerciseId_setNumber_key"
ON "RoutineSet"("routineExerciseId", "setNumber");

-- AddForeignKey
ALTER TABLE "RoutineSet"
ADD CONSTRAINT "RoutineSet_routineExerciseId_fkey"
FOREIGN KEY ("routineExerciseId") REFERENCES "RoutineExercise"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
