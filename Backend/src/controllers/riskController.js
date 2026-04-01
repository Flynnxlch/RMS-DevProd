import { prisma } from '../lib/prisma.js';
import { clearCacheByPattern, deleteCache, getCache, setCache } from '../utils/cache.js';
import { computeRiskScore, generateRiskId, getRiskLevel } from '../utils/risk.js';
import { deriveApprovalStatus } from './approvalController.js';

/**
 * Risk controller - handles risk-related API endpoints
 */
export const riskController = {
  /**
   * Get all risks (filtered by user role and cabang)
   */
  getAll: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(request.url);
      const regionCode = url.searchParams.get('regionCode');

      // Sorting parameter
      const sortBy = url.searchParams.get('sortBy') || 'highest-risk'; // Default: highest-risk

      // Pagination parameters (cap at 1000 to prevent unbounded queries)
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.min(1000, Math.max(1, parseInt(url.searchParams.get('limit') || '500', 10)));

      // Refresh parameter: if true, bypass cache and fetch fresh data from database
      const forceRefresh = url.searchParams.get('refresh') === 'true';

      if (forceRefresh && process.env.NODE_ENV !== 'production') {
        console.log('[Cache] Force refresh requested - bypassing cache and fetching fresh data from database');
      }

      // Build where clause
      const where = {};
      
      // Filter by user role and region_cabang
      // Special case: If user has region_cabang = 'KPS', show all risks from all region_code
      // Otherwise, filter by user's region_cabang
      if (user.userRole === 'RISK_CHAMPION') {
        // If region_cabang is KPS, don't filter by regionCode (show all)
        // Otherwise, filter by user's region_cabang
        if (user.regionCabang && user.regionCabang !== 'KPS') {
          where.regionCode = user.regionCabang;
        }
        // If region_cabang is KPS, where.regionCode is not set, so all risks are shown
      } else if (user.userRole === 'RISK_OFFICER') {
        // For RISK_OFFICER, also check region_cabang
        if (user.regionCabang && user.regionCabang !== 'KPS') {
          // If region_cabang is not KPS, filter by regionCode
          where.regionCode = user.regionCabang;
        }
        // If region_cabang is KPS, show all risks from all region_code
        // Note: We don't filter by userId here because requirement is to show all risks from all regions if KPS
      }
      // RISK_ASSESSMENT can see all (no filter applied)

      // If regionCode query parameter is provided, it overrides the above filter
      if (regionCode) {
        where.regionCode = regionCode;
      }

      // Cache key includes user role, regionCode filter, and sortBy
      const cacheKey = `risks:${user.userRole}:${user.regionCabang || 'all'}:${regionCode || 'all'}:sort:${sortBy}`;
      
      // Cache Strategy:
      // - Normal request (no refresh): Use cache with 2-minute TTL for optimal performance
      // - Force refresh (refresh=true): Skip cache completely, fetch fresh from database, then cache the result
      if (forceRefresh) {
        // Force refresh: Clear ALL risks cache to ensure fresh data
        // This ensures we get fresh data from database, not from cache
        if (process.env.NODE_ENV !== 'production') console.log(`[Cache] Force refresh - Clearing all risks cache`);
        clearCacheByPattern('risks:');
        // Explicitly delete this specific cache key as well
        deleteCache(cacheKey);
      } else {
        // Normal request: Check cache first
        const cachedData = getCache(cacheKey);
        if (cachedData) {
          if (process.env.NODE_ENV !== 'production') console.log(`[Cache] Returning cached data for key: ${cacheKey}`);
          return new Response(JSON.stringify(cachedData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
        }
        if (process.env.NODE_ENV !== 'production') console.log(`[Cache] Cache miss for key: ${cacheKey} - fetching from database`);
      }

      // Fetch all risks (for sorting by calculated score)
      // We fetch all risks, calculate scores, then sort
      const allRisks = await prisma.risk.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          analysis: true,
          mitigation: true,
          measurement: true,
          evaluations: {
            orderBy: { lastEvaluatedAt: 'desc' },
            take: 1,
          },
          approvals: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Transform and calculate scores
      const risksWithScores = allRisks.map(risk => {
        // Calculate score and level
        // Priority: mitigation.currentScore > measurement.inherentScore > analysis.inherentScore > mitigation.residualScoreFinal
        let score = 0;
        let level = null;
        if (risk.mitigation?.currentScore) {
          score = risk.mitigation.currentScore;
          level = risk.mitigation.currentLevel || getRiskLevel(score)?.label;
        } else if (risk.measurement?.inherentScore) {
          score = risk.measurement.inherentScore;
          level = risk.measurement.inherentLevel || getRiskLevel(score)?.label;
        } else if (risk.analysis?.inherentScore) {
          score = risk.analysis.inherentScore;
          level = risk.analysis.inherentLevel;
        } else if (risk.mitigation?.residualScoreFinal) {
          score = risk.mitigation.residualScoreFinal;
          level = getRiskLevel(score)?.label;
        }
        
        return {
          ...risk,
          calculatedScore: score,
          calculatedLevel: level,
        };
      });

      // Sort based on sortBy parameter
      let sortedRisks = [...risksWithScores];
      switch (sortBy) {
        case 'highest-risk':
          sortedRisks.sort((a, b) => {
            const scoreA = a.calculatedScore || 0;
            const scoreB = b.calculatedScore || 0;
            if (scoreA === scoreB) {
              // If scores are equal, sort by title A-Z
              const titleA = (a.title || a.riskEvent || a.id || '').toLowerCase();
              const titleB = (b.title || b.riskEvent || b.id || '').toLowerCase();
              return titleA.localeCompare(titleB);
            }
            return scoreB - scoreA; // Descending order (highest first)
          });
          break;
        
        case 'lowest-risk':
          sortedRisks.sort((a, b) => {
            const scoreA = a.calculatedScore || 0;
            const scoreB = b.calculatedScore || 0;
            if (scoreA === scoreB) {
              // If scores are equal, sort by title A-Z
              const titleA = (a.title || a.riskEvent || a.id || '').toLowerCase();
              const titleB = (b.title || b.riskEvent || b.id || '').toLowerCase();
              return titleA.localeCompare(titleB);
            }
            return scoreA - scoreB; // Ascending order (lowest first)
          });
          break;
        
        case 'a-to-z':
          sortedRisks.sort((a, b) => {
            const titleA = (a.title || a.riskEvent || a.id || '').toLowerCase();
            const titleB = (b.title || b.riskEvent || b.id || '').toLowerCase();
            return titleA.localeCompare(titleB);
          });
          break;
        
        case 'z-to-a':
          sortedRisks.sort((a, b) => {
            const titleA = (a.title || a.riskEvent || a.id || '').toLowerCase();
            const titleB = (b.title || b.riskEvent || b.id || '').toLowerCase();
            return titleB.localeCompare(titleA);
          });
          break;
        
        default:
          // Default: highest-risk
          sortedRisks.sort((a, b) => {
            const scoreA = a.calculatedScore || 0;
            const scoreB = b.calculatedScore || 0;
            if (scoreA === scoreB) {
              const titleA = (a.title || a.riskEvent || a.id || '').toLowerCase();
              const titleB = (b.title || b.riskEvent || b.id || '').toLowerCase();
              return titleA.localeCompare(titleB);
            }
            return scoreB - scoreA;
          });
      }

      // Paginate the sorted result set
      const totalRisks = sortedRisks.length;
      const offset = (page - 1) * limit;
      const risks = sortedRisks.slice(offset, offset + limit);

      // Transform to frontend format (scores already calculated during sorting)
      const formattedRisks = risks.map(risk => {
        // Use pre-calculated score from sorting step
        const score = risk.calculatedScore || 0;
        const level = risk.calculatedLevel || null;

        // Approval data
        const approvalStatus = deriveApprovalStatus(risk.approvals);
        const formattedApprovals = (risk.approvals || []).map(a => ({
          id: a.id,
          role: a.role,
          action: a.action,
          note: a.note || null,
          userId: a.userId,
          userName: a.user?.name || null,
          createdAt: a.createdAt.toISOString(),
        }));

        return {
          id: risk.id,
          userId: risk.userId,
          riskEvent: risk.riskEvent,
          title: risk.title || risk.riskEvent,
          organization: risk.organization,
          division: risk.division,
          target: risk.target,
          riskEventDescription: risk.riskEventDescription,
          riskCause: risk.riskCause,
          riskImpactExplanation: risk.riskImpactExplanation,
          category: risk.category,
          riskCategoryType: risk.riskCategoryType,
          regionCode: risk.regionCode,
          evaluationRequested: risk.evaluationRequested || false,
          evaluationRequestedAt: risk.evaluationRequestedAt?.toISOString(),
          riskDate: risk.riskDate?.toISOString() || null,
          approvalStatus,
          approvals: formattedApprovals,
          hasMeasurement: !!risk.measurement,
          score,
          level,
          createdAt: risk.createdAt.toISOString(),
          updatedAt: risk.updatedAt.toISOString(),
          // Include measurement data
          ...(risk.measurement && {
            measurement: {
              id: risk.measurement.id,
              treatmentOption: risk.measurement.treatmentOption,
              impactDescription: risk.measurement.impactDescription,
              impactLevel: risk.measurement.impactLevel,
              possibilityType: risk.measurement.possibilityType,
              possibilityDescription: risk.measurement.possibilityDescription,
              inherentScore: risk.measurement.inherentScore,
              inherentLevel: risk.measurement.inherentLevel,
              residualImpactDescription: risk.measurement.residualImpactDescription,
              residualImpactLevel: risk.measurement.residualImpactLevel,
              residualPossibilityType: risk.measurement.residualPossibilityType,
              residualPossibilityDescription: risk.measurement.residualPossibilityDescription,
              residualScore: risk.measurement.residualScore,
              residualLevel: risk.measurement.residualLevel,
              measuredBy: risk.measurement.measuredBy,
              measuredAt: risk.measurement.measuredAt.toISOString(),
            },
          }),
          // Include analysis data
          ...(risk.analysis && {
            existingControl: risk.analysis.existingControl,
            controlType: risk.analysis.controlType,
            controlLevel: risk.analysis.controlLevel,
            controlEffectivenessAssessment: risk.analysis.controlEffectivenessAssessment,
            estimatedExposureDate: risk.analysis.estimatedExposureDate?.toISOString(),
            estimatedExposureDateEnd: risk.analysis.estimatedExposureDateEnd?.toISOString(),
            keyRiskIndicator: risk.analysis.keyRiskIndicator,
            kriUnit: risk.analysis.kriUnit,
            kriValueSafe: risk.analysis.kriValueSafe,
            kriValueCaution: risk.analysis.kriValueCaution,
            kriValueDanger: risk.analysis.kriValueDanger,
            impactDescription: risk.analysis.impactDescription,
            impactLevel: risk.analysis.impactLevel,
            possibilityType: risk.analysis.possibilityType,
            possibilityDescription: risk.analysis.possibilityDescription,
            inherentScore: risk.analysis.inherentScore,
            inherentLevel: risk.analysis.inherentLevel,
            residualImpactDescription: risk.analysis.residualImpactDescription,
            residualImpactLevel: risk.analysis.residualImpactLevel,
            residualPossibilityType: risk.analysis.residualPossibilityType,
            residualPossibilityDescription: risk.analysis.residualPossibilityDescription,
            residualScore: risk.analysis.residualScore,
            residualLevel: risk.analysis.residualLevel,
            analyzedAt: risk.analysis.analyzedAt?.toISOString(),
          }),
          // Include mitigation data
          ...(risk.mitigation && {
            handlingType: risk.mitigation.handlingType,
            mitigationPlan: risk.mitigation.mitigationPlan,
            mitigationOutput: risk.mitigation.mitigationOutput,
            mitigationBudget: risk.mitigation.mitigationBudget,
            mitigationActual: risk.mitigation.mitigationActual,
            progressMitigation: risk.mitigation.progressMitigation,
            realizationTarget: risk.mitigation.realizationTarget,
            targetKpi: risk.mitigation.targetKpi,
            // Prefer mitigation residual values if present, otherwise keep analysis values
            residualImpactDescription: risk.mitigation.residualImpactDescription ?? risk.analysis?.residualImpactDescription,
            residualImpactLevel: risk.mitigation.residualImpactLevel ?? risk.analysis?.residualImpactLevel,
            residualProbabilityDescription: risk.mitigation.residualProbabilityDescription ?? risk.analysis?.residualProbabilityDescription,
            residualProbabilityType: risk.mitigation.residualProbabilityType ?? risk.analysis?.residualPossibilityType,
            residualScore: risk.mitigation.residualScore ?? risk.analysis?.residualScore,
            residualScoreFinal: risk.mitigation.residualScoreFinal ?? risk.analysis?.residualScore,
            // inherentScore should always come from analysis, not mitigation
            // This ensures consistency - inherentScore in risk_mitigations should match risk_analyses
            inherentScore: risk.analysis?.inherentScore ?? risk.mitigation.inherentScore,
            // Current Risk (after mitigation) - kondisi risiko terkini
            currentImpactDescription: risk.mitigation.currentImpactDescription,
            currentImpactLevel: risk.mitigation.currentImpactLevel,
            currentProbabilityDescription: risk.mitigation.currentProbabilityDescription,
            currentProbabilityType: risk.mitigation.currentProbabilityType,
            currentScore: risk.mitigation.currentScore,
            currentLevel: risk.mitigation.currentLevel,
            plannedAt: risk.mitigation.plannedAt?.toISOString(),
          }),
          // Include latest evaluation
          ...(risk.evaluations?.[0] && {
            // Transform evaluationStatus from enum format (UPPERCASE with underscore) to form format (lowercase with dash)
            evaluationStatus: risk.evaluations[0].evaluationStatus === 'EFFECTIVE' ? 'effective' :
                              risk.evaluations[0].evaluationStatus === 'NOT_EFFECTIVE' ? 'ineffective' :
                              risk.evaluations[0].evaluationStatus === 'PARTIALLY_EFFECTIVE' ? 'partially-effective' :
                              risk.evaluations[0].evaluationStatus === 'NOT_STARTED' ? 'not-started' :
                              risk.evaluations[0].evaluationStatus?.toLowerCase() || null,
            evaluationNotes: risk.evaluations[0].evaluationNotes,
            evaluationDate: risk.evaluations[0].evaluationDate?.toISOString(),
            evaluator: risk.evaluations[0].evaluator,
            evaluatorNote: risk.evaluations[0].evaluatorNote,
            lastEvaluatedAt: risk.evaluations[0].lastEvaluatedAt?.toISOString(),
            // Only include descriptions, not levels/types (those come from mitigation)
            currentImpactDescription: risk.evaluations[0].currentImpactDescription,
            currentProbabilityDescription: risk.evaluations[0].currentProbabilityDescription,
          }),
        };
      });

      // Prepare response with pagination metadata
      const responseData = {
        risks: formattedRisks,
        pagination: {
          page,
          limit,
          total: totalRisks,
          totalPages: Math.ceil(totalRisks / limit),
        },
      };

      // Save to cache after query (with 2-minute TTL)
      // This applies to both normal requests and force refresh requests
      // After force refresh, the fresh data is cached for subsequent requests
      setCache(cacheKey, responseData);
      if (forceRefresh && process.env.NODE_ENV !== 'production') {
        console.log(`[Cache] Fresh data fetched and cached for key: ${cacheKey}`);
      }

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // No browser caching — server-side in-memory cache handles performance.
          // Browser caching caused stale data after delete/update operations.
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (error) {
      console.error('Get risks error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Get single risk by ID
   */
  getById: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          analysis: true,
          mitigation: true,
          measurement: true,
          evaluations: {
            orderBy: { lastEvaluatedAt: 'desc' },
          },
          approvals: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check access
      // Special case: If user has region_cabang = 'KPS', allow access to all risks
      if (user.userRole === 'RISK_CHAMPION') {
        // If region_cabang is not KPS, check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // If region_cabang is KPS, allow access (no check needed)
      }
      if (user.userRole === 'RISK_OFFICER') {
        // For RISK_OFFICER with region_cabang = 'KPS', allow access to all risks
        // For RISK_OFFICER with region_cabang != 'KPS', check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Note: We don't check userId here because requirement is to show all risks from all regions if KPS
        // If you want to also check userId for non-KPS users, you can add: && risk.userId !== user.id
      }

      // Calculate score and level
      // Priority: mitigation.currentScore > measurement.inherentScore > analysis.inherentScore > mitigation.residualScoreFinal
      let score = 0;
      let level = null;
      if (risk.mitigation?.currentScore) {
        score = risk.mitigation.currentScore;
        level = risk.mitigation.currentLevel || getRiskLevel(score)?.label;
      } else if (risk.measurement?.inherentScore) {
        score = risk.measurement.inherentScore;
        level = risk.measurement.inherentLevel || getRiskLevel(score)?.label;
      } else if (risk.analysis?.inherentScore) {
        score = risk.analysis.inherentScore;
        level = risk.analysis.inherentLevel;
      } else if (risk.mitigation?.residualScoreFinal) {
        score = risk.mitigation.residualScoreFinal;
        level = getRiskLevel(score)?.label;
      }

      // Approval data
      const approvalStatus = deriveApprovalStatus(risk.approvals);
      const formattedApprovals = (risk.approvals || []).map(a => ({
        id: a.id,
        role: a.role,
        action: a.action,
        note: a.note || null,
        userId: a.userId,
        userName: a.user?.name || null,
        createdAt: a.createdAt.toISOString(),
      }));

      // Format response (similar to getAll)
      const formattedRisk = {
        id: risk.id,
        userId: risk.userId,
        riskEvent: risk.riskEvent,
        title: risk.title || risk.riskEvent,
        organization: risk.organization,
        division: risk.division,
        target: risk.target,
        riskEventDescription: risk.riskEventDescription,
        riskCause: risk.riskCause,
        riskImpactExplanation: risk.riskImpactExplanation,
        category: risk.category,
        riskCategoryType: risk.riskCategoryType,
        regionCode: risk.regionCode,
        evaluationRequested: risk.evaluationRequested || false,
        evaluationRequestedAt: risk.evaluationRequestedAt?.toISOString(),
        riskDate: risk.riskDate?.toISOString() || null,
        approvalStatus,
        approvals: formattedApprovals,
        hasMeasurement: !!risk.measurement,
        score,
        level,
        createdAt: risk.createdAt.toISOString(),
        updatedAt: risk.updatedAt.toISOString(),
        // Include measurement data
        ...(risk.measurement && {
          measurement: {
            id: risk.measurement.id,
            treatmentOption: risk.measurement.treatmentOption,
            impactDescription: risk.measurement.impactDescription,
            impactLevel: risk.measurement.impactLevel,
            possibilityType: risk.measurement.possibilityType,
            possibilityDescription: risk.measurement.possibilityDescription,
            inherentScore: risk.measurement.inherentScore,
            inherentLevel: risk.measurement.inherentLevel,
            residualImpactDescription: risk.measurement.residualImpactDescription,
            residualImpactLevel: risk.measurement.residualImpactLevel,
            residualPossibilityType: risk.measurement.residualPossibilityType,
            residualPossibilityDescription: risk.measurement.residualPossibilityDescription,
            residualScore: risk.measurement.residualScore,
            residualLevel: risk.measurement.residualLevel,
            measuredBy: risk.measurement.measuredBy,
            measuredAt: risk.measurement.measuredAt.toISOString(),
          },
        }),
        ...(risk.analysis && {
          existingControl: risk.analysis.existingControl,
          controlType: risk.analysis.controlType,
          controlLevel: risk.analysis.controlLevel,
          controlEffectivenessAssessment: risk.analysis.controlEffectivenessAssessment,
          estimatedExposureDate: risk.analysis.estimatedExposureDate?.toISOString(),
          estimatedExposureDateEnd: risk.analysis.estimatedExposureDateEnd?.toISOString(),
          keyRiskIndicator: risk.analysis.keyRiskIndicator,
          kriUnit: risk.analysis.kriUnit,
          kriValueSafe: risk.analysis.kriValueSafe,
          kriValueCaution: risk.analysis.kriValueCaution,
          kriValueDanger: risk.analysis.kriValueDanger,
          impactDescription: risk.analysis.impactDescription,
          impactLevel: risk.analysis.impactLevel,
          possibilityType: risk.analysis.possibilityType,
          possibilityDescription: risk.analysis.possibilityDescription,
          inherentScore: risk.analysis.inherentScore,
          inherentLevel: risk.analysis.inherentLevel,
          residualImpactDescription: risk.analysis.residualImpactDescription,
          residualImpactLevel: risk.analysis.residualImpactLevel,
          residualPossibilityType: risk.analysis.residualPossibilityType,
          residualPossibilityDescription: risk.analysis.residualPossibilityDescription,
          residualScore: risk.analysis.residualScore,
          residualLevel: risk.analysis.residualLevel,
          analyzedAt: risk.analysis.analyzedAt?.toISOString(),
        }),
        ...(risk.mitigation && {
          handlingType: risk.mitigation.handlingType,
          mitigationPlan: risk.mitigation.mitigationPlan,
          mitigationOutput: risk.mitigation.mitigationOutput,
          mitigationBudget: risk.mitigation.mitigationBudget,
          mitigationActual: risk.mitigation.mitigationActual,
          progressMitigation: risk.mitigation.progressMitigation,
          realizationTarget: risk.mitigation.realizationTarget,
          targetKpi: risk.mitigation.targetKpi,
          // inherentScore should always come from analysis, not mitigation
          // This ensures consistency - inherentScore in risk_mitigations should match risk_analyses
          inherentScore: risk.analysis?.inherentScore ?? risk.mitigation.inherentScore,
          // Current risk (after mitigation) if available
          currentImpactDescription: risk.mitigation.currentImpactDescription,
          currentImpactLevel: risk.mitigation.currentImpactLevel,
          currentProbabilityDescription: risk.mitigation.currentProbabilityDescription,
          currentProbabilityType: risk.mitigation.currentProbabilityType,
          currentScore: risk.mitigation.currentScore,
          currentLevel: risk.mitigation.currentLevel,
          plannedAt: risk.mitigation.plannedAt?.toISOString(),
        }),
        evaluations: risk.evaluations.map(evaluation => ({
          id: evaluation.id,
          // Transform evaluationStatus from enum format to form format
          evaluationStatus: evaluation.evaluationStatus === 'EFFECTIVE' ? 'effective' :
                            evaluation.evaluationStatus === 'NOT_EFFECTIVE' ? 'ineffective' :
                            evaluation.evaluationStatus === 'PARTIALLY_EFFECTIVE' ? 'partially-effective' :
                            evaluation.evaluationStatus === 'NOT_STARTED' ? 'not-started' :
                            evaluation.evaluationStatus?.toLowerCase() || null,
          evaluationNotes: evaluation.evaluationNotes,
          evaluationDate: evaluation.evaluationDate?.toISOString(),
          evaluator: evaluation.evaluator,
          evaluatorNote: evaluation.evaluatorNote,
          lastEvaluatedAt: evaluation.lastEvaluatedAt?.toISOString(),
          // Only include descriptions, not levels/types (those come from mitigation)
          currentImpactDescription: evaluation.currentImpactDescription,
          currentProbabilityDescription: evaluation.currentProbabilityDescription,
          userId: evaluation.userId,
        })),
      };

      return new Response(JSON.stringify({ risk: formattedRisk }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Get risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create new risk
   */
  create: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const {
        riskEvent,
        organization,
        division,
        target,
        riskEventDescription,
        riskCause,
        riskImpactExplanation,
        category,
        riskCategoryType,
        regionCode,
        riskDate,
      } = body;

      if (!riskEvent) {
        return new Response(
          JSON.stringify({ error: 'Risk event is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Auto-detect cabang from user if not provided
      // For RISK_CHAMPION and RISK_OFFICER, always use their regionCabang (cannot override)
      // For RISK_ASSESSMENT, use provided regionCode or default to user.regionCabang or 'KPS'
      let finalRegionCode;
      if (user.userRole === 'RISK_ASSESSMENT') {
        // RISK_ASSESSMENT can specify any regionCode
        finalRegionCode = regionCode || user.regionCabang || 'KPS';
      } else {
        // RISK_CHAMPION and RISK_OFFICER: always use their regionCabang
        finalRegionCode = user.regionCabang || 'KPS';
        // If they try to send a different regionCode, ignore it and use their regionCabang
        if (regionCode && regionCode !== user.regionCabang && process.env.NODE_ENV !== 'production') {
          console.warn(`User ${user.id} (${user.userRole}) tried to set regionCode to ${regionCode}, but using their regionCabang ${user.regionCabang} instead`);
        }
      }

      // Generate risk ID — uses riskDate if provided so ID reflects the risk's date
      const riskId = generateRiskId(riskDate || null);

      // Check if analysis data (Bagian 1 / Bagian 2) was submitted alongside the risk
      const analysisFields = [
        'existingControl', 'controlType', 'controlLevel',
        'controlEffectivenessAssessment', 'estimatedExposureDate', 'estimatedExposureDateEnd',
        'keyRiskIndicator', 'kriUnit', 'kriValueSafe', 'kriValueCaution', 'kriValueDanger',
      ];
      const hasAnalysisData = analysisFields.some(
        (field) => body[field] !== undefined && body[field] !== null && body[field] !== ''
      );

      // Create risk (and optionally its analysis) in a single transaction
      const risk = await prisma.$transaction(async (tx) => {
        const created = await tx.risk.create({
          data: {
            id: riskId,
            userId: user.id,
            riskEvent: riskEvent.trim(),
            title: riskEvent.trim(),
            organization: organization || null,
            division: division || null,
            target: target || null,
            riskEventDescription: riskEventDescription || null,
            riskCause: riskCause || null,
            riskImpactExplanation: riskImpactExplanation || null,
            category: category || null,
            riskCategoryType: riskCategoryType || null,
            regionCode: finalRegionCode,
            riskDate: riskDate ? new Date(riskDate) : new Date(),
          },
        });

        if (hasAnalysisData) {
          await tx.riskAnalysis.create({
            data: {
              riskId: created.id,
              existingControl: body.existingControl || null,
              controlType: body.controlType || null,
              controlLevel: body.controlLevel || null,
              controlEffectivenessAssessment: body.controlEffectivenessAssessment || null,
              estimatedExposureDate: body.estimatedExposureDate ? new Date(body.estimatedExposureDate) : null,
              estimatedExposureDateEnd: body.estimatedExposureDateEnd ? new Date(body.estimatedExposureDateEnd) : null,
              keyRiskIndicator: body.keyRiskIndicator || null,
              kriUnit: body.kriUnit || null,
              kriValueSafe: body.kriValueSafe || null,
              kriValueCaution: body.kriValueCaution || null,
              kriValueDanger: body.kriValueDanger || null,
            },
          });
        }

        return created;
      });

      // Clear cache when risk is created
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Risk created successfully',
          risk: {
            id: risk.id,
            riskEvent: risk.riskEvent,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Update risk
   */
  update: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if risk exists and user has access
      const existingRisk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!existingRisk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check access
      // Special case: If user has region_cabang = 'KPS', allow access to all risks
      if (user.userRole === 'RISK_CHAMPION') {
        // If region_cabang is not KPS, check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      if (user.userRole === 'RISK_OFFICER') {
        // For RISK_OFFICER with region_cabang = 'KPS', allow access to all risks
        // For RISK_OFFICER with region_cabang != 'KPS', check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Also check userId for RISK_OFFICER (they can only update their own risks)
        if (existingRisk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      const body = await request.json();
      const updateData = {};

      // Only update provided fields (sesuai dengan schema baru)
      if (body.riskEvent !== undefined) updateData.riskEvent = body.riskEvent.trim();
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.riskDate !== undefined) updateData.riskDate = body.riskDate ? new Date(body.riskDate) : null;
      if (body.organization !== undefined) updateData.organization = body.organization;
      if (body.division !== undefined) updateData.division = body.division;
      if (body.target !== undefined) updateData.target = body.target;
      if (body.riskEventDescription !== undefined) updateData.riskEventDescription = body.riskEventDescription;
      if (body.riskCause !== undefined) updateData.riskCause = body.riskCause;
      if (body.riskImpactExplanation !== undefined) updateData.riskImpactExplanation = body.riskImpactExplanation;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.riskCategoryType !== undefined) updateData.riskCategoryType = body.riskCategoryType;
      // Only RISK_ASSESSMENT can reassign a risk to a different region
      if (body.regionCode !== undefined && user.userRole === 'RISK_ASSESSMENT') {
        updateData.regionCode = body.regionCode;
      }
      // Only RISK_CHAMPION and RISK_ASSESSMENT can toggle evaluation request flag
      if (body.evaluationRequested !== undefined && ['RISK_CHAMPION', 'RISK_ASSESSMENT'].includes(user.userRole)) {
        updateData.evaluationRequested = body.evaluationRequested;
      }
      if (body.evaluationRequestedAt !== undefined && ['RISK_CHAMPION', 'RISK_ASSESSMENT'].includes(user.userRole)) {
        updateData.evaluationRequestedAt = body.evaluationRequestedAt ? new Date(body.evaluationRequestedAt) : null;
      }

      const risk = await prisma.risk.update({
        where: { id: riskId },
        data: updateData,
      });

      // Clear cache AFTER the update so stale data is never re-served
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Risk updated successfully',
          risk: {
            id: risk.id,
            riskEvent: risk.riskEvent,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Update risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Delete risk
   */
  delete: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const existingRisk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!existingRisk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check access
      // Special case: If user has region_cabang = 'KPS', allow access to all risks
      if (user.userRole === 'RISK_CHAMPION') {
        // If region_cabang is not KPS, check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      if (user.userRole === 'RISK_OFFICER') {
        // For RISK_OFFICER with region_cabang = 'KPS', allow access to all risks
        // For RISK_OFFICER with region_cabang != 'KPS', check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Also check userId for RISK_OFFICER (they can only delete their own risks)
        if (existingRisk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      await prisma.risk.delete({
        where: { id: riskId },
      });

      // Clear cache when risk is deleted
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({ message: 'Risk deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Delete risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create or update risk analysis
   */
  createOrUpdateAnalysis: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Enforce ownership / region access before allowing analysis writes
      if (user.userRole === 'RISK_OFFICER') {
        if (risk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else if (user.userRole === 'RISK_CHAMPION') {
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      // RISK_ASSESSMENT can write analysis on any risk

      const body = await request.json();
      const {
        existingControl,
        controlType,
        controlLevel,
        controlEffectivenessAssessment,
        estimatedExposureDate,
        estimatedExposureDateEnd,
        keyRiskIndicator,
        kriUnit,
        kriValueSafe,
        kriValueCaution,
        kriValueDanger,
        impactDescription,
        impactLevel,
        possibilityType,
        possibilityDescription,
        residualImpactDescription,
        residualImpactLevel,
        residualPossibilityType,
        residualPossibilityDescription,
      } = body;

      // Server-side score calculation using the same non-linear matrix as the frontend RiskMatrix.
      const parsedImpact = impactLevel !== undefined && impactLevel !== null ? Number(impactLevel) : null;
      const parsedPossibility = possibilityType !== undefined && possibilityType !== null ? Number(possibilityType) : null;
      const inherentScore = (parsedImpact && parsedPossibility) ? computeRiskScore({ possibility: parsedPossibility, impactLevel: parsedImpact }) : null;
      const inherentLevel = inherentScore ? getRiskLevel(inherentScore)?.label ?? null : null;

      const parsedResidualImpact = residualImpactLevel !== undefined && residualImpactLevel !== null ? Number(residualImpactLevel) : null;
      const parsedResidualPossibility = residualPossibilityType !== undefined && residualPossibilityType !== null ? Number(residualPossibilityType) : null;
      const residualScore = (parsedResidualImpact && parsedResidualPossibility) ? computeRiskScore({ possibility: parsedResidualPossibility, impactLevel: parsedResidualImpact }) : null;
      const residualLevel = residualScore ? getRiskLevel(residualScore)?.label ?? null : null;

      // Upsert analysis
      const analysis = await prisma.riskAnalysis.upsert({
        where: { riskId },
        update: {
          existingControl: existingControl !== undefined && existingControl !== '' ? existingControl : null,
          controlType: controlType !== undefined && controlType !== '' ? controlType : null,
          controlLevel: controlLevel !== undefined && controlLevel !== '' ? controlLevel : null,
          controlEffectivenessAssessment: controlEffectivenessAssessment !== undefined && controlEffectivenessAssessment !== '' ? controlEffectivenessAssessment : null,
          estimatedExposureDate: estimatedExposureDate ? new Date(estimatedExposureDate) : null,
          estimatedExposureDateEnd: estimatedExposureDateEnd ? new Date(estimatedExposureDateEnd) : null,
          keyRiskIndicator: keyRiskIndicator || null,
          kriUnit: kriUnit || null,
          kriValueSafe: kriValueSafe || null,
          kriValueCaution: kriValueCaution || null,
          kriValueDanger: kriValueDanger || null,
          impactDescription: impactDescription || null,
          impactLevel: impactLevel !== undefined ? Number(impactLevel) : null,
          possibilityType: possibilityType !== undefined ? Number(possibilityType) : null,
          possibilityDescription: possibilityDescription || null,
          inherentScore: inherentScore !== null ? inherentScore : null,
          inherentLevel,
          residualImpactDescription: residualImpactDescription || null,
          residualImpactLevel: residualImpactLevel !== undefined ? Number(residualImpactLevel) : null,
          residualPossibilityType: residualPossibilityType !== undefined ? Number(residualPossibilityType) : null,
          residualPossibilityDescription: residualPossibilityDescription || null,
          residualScore: residualScore !== null ? residualScore : null,
          residualLevel,
          analyzedAt: new Date(),
        },
        create: {
          riskId,
          existingControl: existingControl !== undefined && existingControl !== '' ? existingControl : null,
          controlType: controlType !== undefined && controlType !== '' ? controlType : null,
          controlLevel: controlLevel !== undefined && controlLevel !== '' ? controlLevel : null,
          controlEffectivenessAssessment: controlEffectivenessAssessment !== undefined && controlEffectivenessAssessment !== '' ? controlEffectivenessAssessment : null,
          estimatedExposureDate: estimatedExposureDate ? new Date(estimatedExposureDate) : null,
          estimatedExposureDateEnd: estimatedExposureDateEnd ? new Date(estimatedExposureDateEnd) : null,
          keyRiskIndicator: keyRiskIndicator || null,
          kriUnit: kriUnit || null,
          kriValueSafe: kriValueSafe || null,
          kriValueCaution: kriValueCaution || null,
          kriValueDanger: kriValueDanger || null,
          impactDescription: impactDescription || null,
          impactLevel: impactLevel !== undefined ? Number(impactLevel) : null,
          possibilityType: possibilityType !== undefined ? Number(possibilityType) : null,
          possibilityDescription: possibilityDescription || null,
          inherentScore: inherentScore !== null ? inherentScore : null,
          inherentLevel,
          residualImpactDescription: residualImpactDescription || null,
          residualImpactLevel: residualImpactLevel !== undefined ? Number(residualImpactLevel) : null,
          residualPossibilityType: residualPossibilityType !== undefined ? Number(residualPossibilityType) : null,
          residualPossibilityDescription: residualPossibilityDescription || null,
          residualScore: residualScore !== null ? residualScore : null,
          residualLevel,
          analyzedAt: new Date(),
        },
      });

      return new Response(
        JSON.stringify({
          message: 'Risk analysis saved successfully',
          analysis: {
            inherentScore: analysis.inherentScore,
            inherentLevel: analysis.inherentLevel,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create/update analysis error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create or update risk mitigation
   */
  createOrUpdateMitigation: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Only RISK_OFFICER and RISK_CHAMPION can create/update mitigations
      if (!['RISK_OFFICER', 'RISK_CHAMPION'].includes(user.userRole)) {
        return new Response(
          JSON.stringify({ error: 'Access denied. Only Risk Officer and Risk Champion can manage mitigation plans.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists and get analysis to ensure inherentScore is from analysis
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: {
          analysis: true,
        },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Enforce ownership / region access before allowing mitigation writes
      if (user.userRole === 'RISK_OFFICER') {
        if (risk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else if (user.userRole === 'RISK_CHAMPION') {
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      const body = await request.json();
      const {
        handlingType,
        mitigationPlan,
        mitigationOutput,
        mitigationBudget,
        mitigationActual,
        progressMitigation,
        realizationTarget,
        targetKpi,
        // current risk (after mitigation)
        currentImpactDescription,
        currentImpactLevel,
        currentProbabilityDescription,
        currentProbabilityType,
        currentScore,
        currentLevel,
      } = body;

      // Always get inherentScore from risk_analyses, not from payload
      // This ensures inherentScore is never affected by current_score or residual_score
      const inherentScore = risk.analysis?.inherentScore ?? null;

      if (!mitigationPlan) {
        return new Response(
          JSON.stringify({ error: 'Mitigation plan is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Upsert mitigation
      const mitigation = await prisma.riskMitigation.upsert({
        where: { riskId },
        update: {
          handlingType: handlingType || null,
          mitigationPlan: mitigationPlan.trim(),
          mitigationOutput: mitigationOutput || null,
          mitigationBudget: mitigationBudget ? Number(mitigationBudget) : null,
          mitigationActual: mitigationActual ? Number(mitigationActual) : null,
          progressMitigation: progressMitigation || null,
          realizationTarget: realizationTarget || null,
          targetKpi: targetKpi || null,
          inherentScore: inherentScore || null,
          currentImpactDescription: currentImpactDescription || null,
          currentImpactLevel: currentImpactLevel !== undefined ? Number(currentImpactLevel) : null,
          currentProbabilityDescription: currentProbabilityDescription || null,
          currentProbabilityType: currentProbabilityType !== undefined ? Number(currentProbabilityType) : null,
          currentScore: currentScore !== undefined ? Number(currentScore) : null,
          currentLevel: currentLevel || null,
          plannedAt: new Date(),
        },
        create: {
          riskId,
          handlingType: handlingType || null,
          mitigationPlan: mitigationPlan.trim(),
          mitigationOutput: mitigationOutput || null,
          mitigationBudget: mitigationBudget ? Number(mitigationBudget) : null,
          mitigationActual: mitigationActual ? Number(mitigationActual) : null,
          progressMitigation: progressMitigation || null,
          realizationTarget: realizationTarget || null,
          targetKpi: targetKpi || null,
          inherentScore: inherentScore || null,
          currentImpactDescription: currentImpactDescription || null,
          currentImpactLevel: currentImpactLevel !== undefined ? Number(currentImpactLevel) : null,
          currentProbabilityDescription: currentProbabilityDescription || null,
          currentProbabilityType: currentProbabilityType !== undefined ? Number(currentProbabilityType) : null,
          currentScore: currentScore !== undefined ? Number(currentScore) : null,
          currentLevel: currentLevel || null,
          plannedAt: new Date(),
        },
      });

      // Clear cache when mitigation is created/updated
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Mitigation plan saved successfully',
          mitigation: {
            id: mitigation.id,
            riskId: mitigation.riskId,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create/update mitigation error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create or update risk evaluation
   */
  createOrUpdateEvaluation: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Enforce ownership / region access before allowing evaluation writes
      if (user.userRole === 'RISK_OFFICER') {
        if (risk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else if (user.userRole === 'RISK_CHAMPION') {
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      // RISK_ASSESSMENT can evaluate any risk

      const body = await request.json();
      const {
        evaluationStatus,
        evaluationNotes,
        evaluationDate,
        evaluator,
        evaluatorNote,
        currentImpactDescription,
        currentProbabilityDescription,
      } = body;

      // Transform evaluationStatus from form format (lowercase with dash) to enum format (UPPERCASE with underscore)
      // Form: 'effective', 'ineffective', 'partially-effective', 'not-started'
      // Enum: 'EFFECTIVE', 'NOT_EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'NOT_STARTED'
      const statusMap = {
        'effective': 'EFFECTIVE',
        'ineffective': 'NOT_EFFECTIVE',
        'partially-effective': 'PARTIALLY_EFFECTIVE',
        'not-started': 'NOT_STARTED',
      };
      const mappedStatus = statusMap[evaluationStatus] || evaluationStatus || 'NOT_STARTED';

      // Create evaluation - only save fields that are input by user
      // Note: currentImpactLevel, currentProbabilityType, and score are NOT saved
      // as they are only for display (calculated from risk mitigation)
      const evaluation = await prisma.riskEvaluation.create({
        data: {
          riskId,
          userId: user.id,
          evaluationStatus: mappedStatus,
          evaluationNotes: evaluationNotes || null,
          evaluationDate: evaluationDate ? new Date(evaluationDate) : new Date(),
          evaluator: evaluator || user.name,
          evaluatorNote: evaluatorNote || null,
          lastEvaluatedAt: new Date(),
          // Only save descriptions, not levels/types/scores (those are for display only)
          currentImpactDescription: currentImpactDescription || null,
          currentProbabilityDescription: currentProbabilityDescription || null,
        },
      });

      // Clear cache when evaluation is created/updated
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Evaluation saved successfully',
          evaluation: {
            id: evaluation.id,
            // Transform evaluationStatus from enum format to form format
            evaluationStatus: evaluation.evaluationStatus === 'EFFECTIVE' ? 'effective' :
                              evaluation.evaluationStatus === 'NOT_EFFECTIVE' ? 'ineffective' :
                              evaluation.evaluationStatus === 'PARTIALLY_EFFECTIVE' ? 'partially-effective' :
                              evaluation.evaluationStatus === 'NOT_STARTED' ? 'not-started' :
                              evaluation.evaluationStatus?.toLowerCase() || null,
            evaluationDate: evaluation.evaluationDate?.toISOString(),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create/update evaluation error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
