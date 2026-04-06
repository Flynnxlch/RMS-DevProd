-- Migration: Rework Residual Risk in risk_measurements
-- Removes old single-row residual fields and replaces with
-- unitRisiko + per-quarter (Q1-Q4) flat columns.

-- Drop old residual columns
ALTER TABLE "risk_measurements"
  DROP COLUMN IF EXISTS "residual_impact_description",
  DROP COLUMN IF EXISTS "residual_impact_level",
  DROP COLUMN IF EXISTS "residual_possibility_type",
  DROP COLUMN IF EXISTS "residual_possibility_description",
  DROP COLUMN IF EXISTS "residual_score",
  DROP COLUMN IF EXISTS "residual_level";

-- Add unit_risiko
ALTER TABLE "risk_measurements"
  ADD COLUMN "unit_risiko" DOUBLE PRECISION;

-- Add Q1 columns (10%)
ALTER TABLE "risk_measurements"
  ADD COLUMN "residual_impact_level_q1"     INTEGER,
  ADD COLUMN "residual_possibility_type_q1" INTEGER,
  ADD COLUMN "nilai_probabilitas_q1"        INTEGER,
  ADD COLUMN "residual_score_q1"            INTEGER,
  ADD COLUMN "residual_level_q1"            VARCHAR(50),
  ADD COLUMN "nilai_dampak_q1"              DOUBLE PRECISION,
  ADD COLUMN "nilai_prob_display_q1"        INTEGER,
  ADD COLUMN "nilai_eksposure_q1"           DOUBLE PRECISION;

-- Add Q2 columns (8%)
ALTER TABLE "risk_measurements"
  ADD COLUMN "residual_impact_level_q2"     INTEGER,
  ADD COLUMN "residual_possibility_type_q2" INTEGER,
  ADD COLUMN "nilai_probabilitas_q2"        INTEGER,
  ADD COLUMN "residual_score_q2"            INTEGER,
  ADD COLUMN "residual_level_q2"            VARCHAR(50),
  ADD COLUMN "nilai_dampak_q2"              DOUBLE PRECISION,
  ADD COLUMN "nilai_prob_display_q2"        INTEGER,
  ADD COLUMN "nilai_eksposure_q2"           DOUBLE PRECISION;

-- Add Q3 columns (7%)
ALTER TABLE "risk_measurements"
  ADD COLUMN "residual_impact_level_q3"     INTEGER,
  ADD COLUMN "residual_possibility_type_q3" INTEGER,
  ADD COLUMN "nilai_probabilitas_q3"        INTEGER,
  ADD COLUMN "residual_score_q3"            INTEGER,
  ADD COLUMN "residual_level_q3"            VARCHAR(50),
  ADD COLUMN "nilai_dampak_q3"              DOUBLE PRECISION,
  ADD COLUMN "nilai_prob_display_q3"        INTEGER,
  ADD COLUMN "nilai_eksposure_q3"           DOUBLE PRECISION;

-- Add Q4 columns (6%)
ALTER TABLE "risk_measurements"
  ADD COLUMN "residual_impact_level_q4"     INTEGER,
  ADD COLUMN "residual_possibility_type_q4" INTEGER,
  ADD COLUMN "nilai_probabilitas_q4"        INTEGER,
  ADD COLUMN "residual_score_q4"            INTEGER,
  ADD COLUMN "residual_level_q4"            VARCHAR(50),
  ADD COLUMN "nilai_dampak_q4"              DOUBLE PRECISION,
  ADD COLUMN "nilai_prob_display_q4"        INTEGER,
  ADD COLUMN "nilai_eksposure_q4"           DOUBLE PRECISION;
