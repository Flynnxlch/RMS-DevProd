-- Migration: Rework Inherent Risk fields in risk_measurements
-- Removes impactDescription and possibilityDescription (replaced by numeric nilai fields)
-- Adds nilaiProbabilitasInherent, nilaiDampakInherent, nilaiProbDisplayInherent, nilaiEksposureInherent

ALTER TABLE "risk_measurements"
  DROP COLUMN "impact_description",
  DROP COLUMN "possibility_description",
  ADD COLUMN "nilai_probabilitas_inherent" INTEGER NULL,
  ADD COLUMN "nilai_dampak_inherent"       DOUBLE PRECISION NULL,
  ADD COLUMN "nilai_prob_display_inherent" INTEGER NULL,
  ADD COLUMN "nilai_eksposure_inherent"    DOUBLE PRECISION NULL;
