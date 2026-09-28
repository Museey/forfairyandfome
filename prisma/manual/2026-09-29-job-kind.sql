-- CreateEnum
CREATE TYPE "JobKind" AS ENUM ('STANDARD', 'FREE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "kind" "JobKind" NOT NULL DEFAULT 'STANDARD';
