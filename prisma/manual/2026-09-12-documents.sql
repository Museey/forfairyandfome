-- CreateEnum
CREATE TYPE "TaxDocType" AS ENUM ('WHT', 'PP30', 'PURCHASE_SALES_TAX', 'PND90');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedFileUrl" TEXT;

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "employeeName" TEXT NOT NULL,
    "position" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "earnings" JSONB NOT NULL,
    "deductions" JSONB NOT NULL,
    "note" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "employeeName" TEXT NOT NULL,
    "position" TEXT,
    "rows" JSONB NOT NULL,
    "ratePerHour" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDocument" (
    "id" TEXT NOT NULL,
    "type" "TaxDocType" NOT NULL,
    "jobId" TEXT,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER,
    "fileUrl" TEXT NOT NULL,
    "note" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_periodYear_periodMonth_key" ON "Payslip"("periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_periodYear_periodMonth_key" ON "Timesheet"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "TaxDocument_type_periodYear_periodMonth_idx" ON "TaxDocument"("type", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "TaxDocument_jobId_idx" ON "TaxDocument"("jobId");

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
