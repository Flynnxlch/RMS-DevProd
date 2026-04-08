import { prisma } from '../lib/prisma.js';
import { clearCacheByPattern } from '../utils/cache.js';
import { computeRiskScore, getRiskLevel } from '../utils/risk.js';

// Q1=10%, Q2=8%, Q3=7%, Q4=6%
const QUARTER_RATES = [0.10, 0.08, 0.07, 0.06];

/**
 * POST /api/risks/:riskId/measurement
 * Body: {
 *   treatmentOption,
 *   impactLevel, possibilityType,
 *   nilaiProbabilitasInherent,
 *   unitRisiko,
 *   residualQuarters: [
 *     { quarter, residualImpactLevel, residualPossibilityType, nilaiProbabilitas },
 *     ...  // 4 entries, one per quarter
 *   ]
 * }
 * Only RISK_ASSESSMENT role is allowed.
 */
export const measurementController = {
  submitMeasurement: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (user.userRole !== 'RISK_ASSESSMENT') {
        return new Response(
          JSON.stringify({ error: 'Access denied. Only Risk Assessment can submit measurements.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: { approvals: true },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const {
        treatmentOption,
        impactLevel,
        possibilityType,
        nilaiProbabilitasInherent,
        unitRisiko,
        limitRisiko,
        residualQuarters,
      } = body;

      const isKualitatif = risk.riskCategoryType === 'Kualitatif';

      if (!treatmentOption) {
        return new Response(
          JSON.stringify({ error: 'treatmentOption is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!impactLevel || !possibilityType) {
        return new Response(
          JSON.stringify({ error: 'impactLevel and possibilityType are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Server-side inherent score (same non-linear matrix as frontend)
      const parsedImpact = Number(impactLevel);
      const parsedPossibility = Number(possibilityType);
      const computedInherentScore = computeRiskScore({ possibility: parsedPossibility, impactLevel: parsedImpact });
      const computedInherentLevel = computedInherentScore ? getRiskLevel(computedInherentScore)?.label || null : null;

      // Server-side residual quarter computations
      const unitRisikoNum = unitRisiko != null ? Number(unitRisiko) : null;
      const limitRisikoNum = limitRisiko != null ? Number(limitRisiko) : null;

      // Server-side inherent nilai computations (Nilai Dampak always unitRisiko * 10%)
      const nilaiDampakInherent = (unitRisikoNum != null && unitRisikoNum > 0) ? unitRisikoNum * 0.10 : null;
      const probInherentRaw = nilaiProbabilitasInherent != null ? Number(nilaiProbabilitasInherent) : null;
      const probInherentValid = probInherentRaw != null && probInherentRaw >= 1 && probInherentRaw <= 12;
      const nilaiProbDisplayInherent = probInherentValid ? Math.round((probInherentRaw / 12) * 100) : null;
      // Kualitatif eksposure: 1% * limitRisiko * (nilaiProbabilitas/12) * tingkatDampak
      // Kuantitatif eksposure: nilaiDampak * (nilaiProbabilitas/12)
      const nilaiEksposureInherent = probInherentValid
        ? (isKualitatif && limitRisikoNum != null && limitRisikoNum > 0
            ? 0.01 * limitRisikoNum * (probInherentRaw / 12) * parsedImpact
            : (nilaiDampakInherent != null ? nilaiDampakInherent * (probInherentRaw / 12) : null))
        : null;

      const quarters = Array.isArray(residualQuarters) ? residualQuarters : [];

      function computeQuarter(q, rate) {
        if (!q) return {};

        const impLvl = q.residualImpactLevel ? Number(q.residualImpactLevel) : null;
        const possLvl = q.residualPossibilityType ? Number(q.residualPossibilityType) : null;
        const probRaw = q.nilaiProbabilitas != null ? Number(q.nilaiProbabilitas) : null;

        const score = (impLvl && possLvl)
          ? computeRiskScore({ impactLevel: impLvl, possibility: possLvl })
          : null;
        const level = score ? getRiskLevel(score)?.label || null : null;

        // Nilai Dampak always uses unitRisiko * rate (unchanged for both categories)
        const nilaiDampak = (unitRisikoNum != null && unitRisikoNum > 0) ? unitRisikoNum * rate : null;

        const probValid = probRaw != null && probRaw >= 1 && probRaw <= 12;
        const nilaiProbDisplay = probValid ? Math.round((probRaw / 12) * 100) : null;
        // Kualitatif eksposure: 1% * limitRisiko * (nilaiProbabilitas/12) * tingkatDampakResidual
        // Kuantitatif eksposure: nilaiDampak * (nilaiProbabilitas/12)
        const nilaiEksposure = probValid
          ? (isKualitatif && limitRisikoNum != null && limitRisikoNum > 0 && impLvl != null && impLvl > 0
              ? 0.01 * limitRisikoNum * (probRaw / 12) * impLvl
              : (nilaiDampak != null ? nilaiDampak * (probRaw / 12) : null))
          : null;

        return {
          residualImpactLevel: impLvl,
          residualPossibilityType: possLvl,
          nilaiProbabilitas: probValid ? probRaw : null,
          residualScore: score,
          residualLevel: level,
          nilaiDampak,
          nilaiProbDisplay,
          nilaiEksposure,
        };
      }

      const q1 = computeQuarter(quarters[0], QUARTER_RATES[0]);
      const q2 = computeQuarter(quarters[1], QUARTER_RATES[1]);
      const q3 = computeQuarter(quarters[2], QUARTER_RATES[2]);
      const q4 = computeQuarter(quarters[3], QUARTER_RATES[3]);

      const residualData = {
        unitRisiko: unitRisikoNum,
        limitRisiko: limitRisikoNum,

        residualImpactLevelQ1:     q1.residualImpactLevel     ?? null,
        residualPossibilityTypeQ1: q1.residualPossibilityType ?? null,
        nilaiProbabilitasQ1:       q1.nilaiProbabilitas       ?? null,
        residualScoreQ1:           q1.residualScore           ?? null,
        residualLevelQ1:           q1.residualLevel           ?? null,
        nilaiDampakQ1:             q1.nilaiDampak             ?? null,
        nilaiProbDisplayQ1:        q1.nilaiProbDisplay        ?? null,
        nilaiEksposureQ1:          q1.nilaiEksposure          ?? null,

        residualImpactLevelQ2:     q2.residualImpactLevel     ?? null,
        residualPossibilityTypeQ2: q2.residualPossibilityType ?? null,
        nilaiProbabilitasQ2:       q2.nilaiProbabilitas       ?? null,
        residualScoreQ2:           q2.residualScore           ?? null,
        residualLevelQ2:           q2.residualLevel           ?? null,
        nilaiDampakQ2:             q2.nilaiDampak             ?? null,
        nilaiProbDisplayQ2:        q2.nilaiProbDisplay        ?? null,
        nilaiEksposureQ2:          q2.nilaiEksposure          ?? null,

        residualImpactLevelQ3:     q3.residualImpactLevel     ?? null,
        residualPossibilityTypeQ3: q3.residualPossibilityType ?? null,
        nilaiProbabilitasQ3:       q3.nilaiProbabilitas       ?? null,
        residualScoreQ3:           q3.residualScore           ?? null,
        residualLevelQ3:           q3.residualLevel           ?? null,
        nilaiDampakQ3:             q3.nilaiDampak             ?? null,
        nilaiProbDisplayQ3:        q3.nilaiProbDisplay        ?? null,
        nilaiEksposureQ3:          q3.nilaiEksposure          ?? null,

        residualImpactLevelQ4:     q4.residualImpactLevel     ?? null,
        residualPossibilityTypeQ4: q4.residualPossibilityType ?? null,
        nilaiProbabilitasQ4:       q4.nilaiProbabilitas       ?? null,
        residualScoreQ4:           q4.residualScore           ?? null,
        residualLevelQ4:           q4.residualLevel           ?? null,
        nilaiDampakQ4:             q4.nilaiDampak             ?? null,
        nilaiProbDisplayQ4:        q4.nilaiProbDisplay        ?? null,
        nilaiEksposureQ4:          q4.nilaiEksposure          ?? null,
      };

      // Upsert: one measurement per risk
      const measurement = await prisma.riskMeasurement.upsert({
        where: { riskId },
        create: {
          riskId,
          treatmentOption,
          impactLevel: parsedImpact,
          possibilityType: parsedPossibility,
          inherentScore: computedInherentScore,
          inherentLevel: computedInherentLevel,
          nilaiProbabilitasInherent: probInherentValid ? probInherentRaw : null,
          nilaiDampakInherent,
          nilaiProbDisplayInherent,
          nilaiEksposureInherent,
          measuredBy: user.id,
          ...residualData,
        },
        update: {
          treatmentOption,
          impactLevel: parsedImpact,
          possibilityType: parsedPossibility,
          inherentScore: computedInherentScore,
          inherentLevel: computedInherentLevel,
          nilaiProbabilitasInherent: probInherentValid ? probInherentRaw : null,
          nilaiDampakInherent,
          nilaiProbDisplayInherent,
          nilaiEksposureInherent,
          measuredBy: user.id,
          measuredAt: new Date(),
          ...residualData,
        },
      });

      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Measurement saved successfully',
          measurement,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Submit measurement error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
