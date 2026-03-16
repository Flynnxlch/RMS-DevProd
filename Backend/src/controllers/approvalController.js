import { prisma } from '../lib/prisma.js';
import { clearCacheByPattern } from '../utils/cache.js';

// Map Prisma userRole enum to display role string stored in RiskApproval
const ROLE_MAP = {
  RISK_CHAMPION: 'Risk Champion',
  RISK_ASSESSMENT: 'Risk Assessment',
};

/**
 * Derive approval status from an array of RiskApproval records.
 * Returns:
 *   'rejected'  — at least one rejection
 *   'approved'  — both Risk Champion AND Risk Assessment have approved
 *   'partial'   — exactly one role has approved
 *   null        — no approvals yet
 */
export function deriveApprovalStatus(approvals) {
  if (!approvals || approvals.length === 0) return null;

  const hasRejection = approvals.some((a) => a.action === 'rejected');
  if (hasRejection) return 'rejected';

  const champApproved = approvals.some(
    (a) => a.role === 'Risk Champion' && a.action === 'approved'
  );
  const assessApproved = approvals.some(
    (a) => a.role === 'Risk Assessment' && a.action === 'approved'
  );

  if (champApproved && assessApproved) return 'approved';
  if (champApproved || assessApproved) return 'partial';
  return null;
}

/** Format a RiskApproval DB record for the API response */
function formatApproval(a) {
  return {
    id: a.id,
    role: a.role,
    action: a.action,
    note: a.note || null,
    userId: a.userId,
    userName: a.user?.name || null,
    createdAt: a.createdAt.toISOString(),
  };
}

export const approvalController = {
  /**
   * POST /api/risks/:riskId/approval
   * Body: { action: "approved" | "rejected", note?: string }
   * Allowed roles: RISK_CHAMPION, RISK_ASSESSMENT
   */
  submitApproval: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const role = ROLE_MAP[user.userRole];
      if (!role) {
        return new Response(
          JSON.stringify({
            error:
              'Access denied. Only Risk Champion and Risk Assessment can approve or reject risks.',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists and fetch current approvals
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: {
          approvals: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Guard: don't allow further action if already fully approved
      const currentStatus = deriveApprovalStatus(risk.approvals);
      if (currentStatus === 'approved') {
        return new Response(
          JSON.stringify({ error: 'This risk has already been fully approved.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const { action, note } = body;

      if (!action || !['approved', 'rejected'].includes(action)) {
        return new Response(
          JSON.stringify({ error: 'action must be "approved" or "rejected"' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'rejected') {
        // Rejection: wipe all approvals for this risk, then record the rejection
        await prisma.$transaction(async (tx) => {
          await tx.riskApproval.deleteMany({ where: { riskId } });
          await tx.riskApproval.create({
            data: {
              riskId,
              role,
              action: 'rejected',
              userId: user.id,
              note: note || null,
            },
          });
        });
      } else {
        // Approval: upsert (remove any previous record by this role, create new)
        await prisma.$transaction(async (tx) => {
          await tx.riskApproval.deleteMany({ where: { riskId, role } });
          await tx.riskApproval.create({
            data: {
              riskId,
              role,
              action: 'approved',
              userId: user.id,
              note: null,
            },
          });
        });
      }

      // Fetch updated approvals with user names
      const updatedApprovals = await prisma.riskApproval.findMany({
        where: { riskId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      const newApprovalStatus = deriveApprovalStatus(updatedApprovals);

      // Clear risk cache so getAll/getById return fresh data
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: action === 'approved' ? 'Risk approved' : 'Risk rejected',
          approvalStatus: newApprovalStatus,
          approvals: updatedApprovals.map(formatApproval),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Submit approval error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
