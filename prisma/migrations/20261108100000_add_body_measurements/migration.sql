-- CreateTable
CREATE TABLE "BodyMeasurementEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chestCm" DECIMAL(6,2),
    "waistCm" DECIMAL(6,2),
    "hipCm" DECIMAL(6,2),
    "armCm" DECIMAL(6,2),
    "thighCm" DECIMAL(6,2),
    "calfCm" DECIMAL(6,2),
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurementEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMeasurementEntry_userId_measuredAt_idx" ON "BodyMeasurementEntry"("userId", "measuredAt");

-- AddForeignKey
ALTER TABLE "BodyMeasurementEntry" ADD CONSTRAINT "BodyMeasurementEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
