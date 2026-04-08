-- Migration: Rework Inherent Risk fields in risk_measurements
-- Removes impactDescription and possibilityDescription (replaced by numeric nilai fields)
-- Adds nilaiProbabilitasInherent, nilaiDampakInherent, nilaiProbDisplayInherent, nilaiEksposureInherent

ALTER TABLE "risk_measurements"
  DROP COLUMN IF EXISTS "impact_description",
  DROP COLUMN IF EXISTS "possibility_description",
  ADD COLUMN IF NOT EXISTS "nilai_probabilitas_inherent" INTEGER,
  ADD COLUMN IF NOT EXISTS "nilai_dampak_inherent"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "nilai_prob_display_inherent" INTEGER,
  ADD COLUMN IF NOT EXISTS "nilai_eksposure_inherent"    DOUBLE PRECISION;
