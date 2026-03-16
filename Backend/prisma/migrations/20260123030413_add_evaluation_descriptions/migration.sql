/*
  Warnings:

  - You are about to drop the column `current_impact_level` on the `risk_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `current_probability_type` on the `risk_evaluations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "risk_evaluations" DROP COLUMN "current_impact_level",
DROP COLUMN "current_probability_type";
