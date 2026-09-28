-- AlterEnum
ALTER TYPE "TaxDocType" ADD VALUE 'PND1';

-- CreateEnum
CREATE TYPE "TaxDocPart" AS ENUM ('FORM', 'RECEIPT');

-- AlterTable
ALTER TABLE "TaxDocument" ADD COLUMN     "part" "TaxDocPart";

-- Every ภ.พ.30 filed so far is the form itself.
UPDATE "TaxDocument" SET "part" = 'FORM' WHERE "type" = 'PP30';
