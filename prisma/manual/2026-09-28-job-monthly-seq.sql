-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "monthlySeq" INTEGER;

-- Backfill: number existing jobs within each Bangkok calendar month, in the
-- order they were created. createdAt is stored as a UTC timestamp.
UPDATE "Job" AS j
SET "monthlySeq" = numbered.seq
FROM (
    SELECT "id",
           ROW_NUMBER() OVER (
               PARTITION BY date_trunc('month', "createdAt" + INTERVAL '7 hours')
               ORDER BY "createdAt", "id"
           ) AS seq
    FROM "Job"
) AS numbered
WHERE j."id" = numbered."id";
