-- AlterTable: add risk_date column to risks, nullable, defaults to NULL (existing rows keep NULL)
ALTER TABLE "risks" ADD COLUMN "risk_date" TIMESTAMP(3);
