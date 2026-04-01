import { prisma } from '../lib/prisma.js';
import { clearCacheByPattern } from '../utils/cache.js';
import { computeRiskScore, getRiskLevel } from '../utils/risk.js';

/**
 * POST /api/risks/:riskId/measurement
 * Body: { treatmentOption, impactLevel, impactDescription, possibilityType, possibilityDescription,
 *         residualImpactLevel, residualImpactDescription, residualPossibilityType,
 *         residualPossibilityDescription, inherentScore, inherentLevel, residualScore, residualLevel }
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
      // Note: client-sent score/level values are ignored; scores are recomputed server-side.
      const {
        treatmentOption,
        impactLevel,
        impactDescription,
        possibilityType,
        possibilityDescription,
        residualImpactLevel,
        residualImpactDescription,
        residualPossibilityType,
        residualPossibilityDescription,
      } = body;

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

      // Server-side score calculation using the same non-linear matrix as the frontend RiskMatrix.
      const parsedImpact = Number(impactLevel);
      const parsedPossibility = Number(possibilityType);
      const computedInherentScore = computeRiskScore({ possibility: parsedPossibility, impactLevel: parsedImpact });
      const computedInherentLevel = computedInherentScore ? getRiskLevel(computedInherentScore)?.label || null : null;

      const parsedResidualImpact = residualImpactLevel ? Number(residualImpactLevel) : null;
      const parsedResidualPossibility = residualPossibilityType ? Number(residualPossibilityType) : null;
      const computedResidualScore = (parsedResidualImpact && parsedResidualPossibility)
        ? computeRiskScore({ possibility: parsedResidualPossibility, impactLevel: parsedResidualImpact })
        : null;
      const computedResidualLevel = computedResidualScore ? getRiskLevel(computedResidualScore)?.label || null : null;

      // Upsert: one measurement per risk
      const measurement = await prisma.riskMeasurement.upsert({
        where: { riskId },
        create: {
          riskId,
          treatmentOption,
          impactDescription: impactDescription || null,
          impactLevel: parsedImpact,
          possibilityType: parsedPossibility,
          possibilityDescription: possibilityDescription || null,
          inherentScore: computedInherentScore,
          inherentLevel: computedInherentLevel,
          residualImpactDescription: residualImpactDescription || null,
          residualImpactLevel: parsedResidualImpact,
          residualPossibilityType: parsedResidualPossibility,
          residualPossibilityDescription: residualPossibilityDescription || null,
          residualScore: computedResidualScore,
          residualLevel: computedResidualLevel,
          measuredBy: user.id,
        },
        update: {
          treatmentOption,
          impactDescription: impactDescription || null,
          impactLevel: parsedImpact,
          possibilityType: parsedPossibility,
          possibilityDescription: possibilityDescription || null,
          inherentScore: computedInherentScore,
          inherentLevel: computedInherentLevel,
          residualImpactDescription: residualImpactDescription || null,
          residualImpactLevel: parsedResidualImpact,
          residualPossibilityType: parsedResidualPossibility,
          residualPossibilityDescription: residualPossibilityDescription || null,
          residualScore: computedResidualScore,
          residualLevel: computedResidualLevel,
          measuredBy: user.id,
          measuredAt: new Date(),
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
