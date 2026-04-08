-- Migration: Add limit_risiko to risk_measurements
-- Used for Kualitatif risk category formula: 1% * limit_risiko * nilaiProbabilitas * tingkatDampak

ALTER TABLE `risk_measurements`
  ADD COLUMN `limit_risiko` DOUBLE NULL;
