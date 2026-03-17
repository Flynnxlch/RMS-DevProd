/**
 * Generate risk ID in format: RISK-YYYYMMDD-XXXX
 */
export function generateRiskId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RISK-${dateStr}-${random}`;
}

// Same non-linear matrix used by the frontend RiskMatrix component
// P = Possibility (1-5), I = Impact (1-5)
const RISK_SCORE_MATRIX = {
  1: { 1: 1,  2: 5,  3: 10, 4: 15, 5: 20 },
  2: { 1: 2,  2: 6,  3: 11, 4: 16, 5: 21 },
  3: { 1: 3,  2: 8,  3: 13, 4: 18, 5: 23 },
  4: { 1: 4,  2: 9,  3: 14, 4: 19, 5: 24 },
  5: { 1: 7,  2: 12, 3: 17, 4: 22, 5: 25 },
};

/**
 * Compute risk score using the same matrix as the frontend RiskMatrix component.
 */
export function computeRiskScore({ possibility, impactLevel }) {
  const p = Math.min(5, Math.max(1, Math.round(Number(possibility) || 0)));
  const i = Math.min(5, Math.max(1, Math.round(Number(impactLevel) || 0)));
  if (!possibility || !impactLevel) return null;
  return RISK_SCORE_MATRIX[p]?.[i] ?? null;
}

/**
 * Get risk level label from score — matches frontend RISK_LEVELS thresholds.
 */
export function getRiskLevel(score) {
  const s = Number(score);
  if (!Number.isFinite(s) || s <= 0) return null;
  if (s <= 5)  return { label: 'Sangat Rendah' };
  if (s <= 11) return { label: 'Rendah' };
  if (s <= 15) return { label: 'Menengah' };
  if (s <= 19) return { label: 'Menengah-Tinggi' };
  return { label: 'Tinggi' };
}

/**
 * Map frontend risk status to database enum
 */
export function mapRiskStatus(status) {
  const statusMap = {
    'open-risk': 'OPEN_RISK',
    'analyzed': 'ANALYZED',
    'planned': 'PLANNED',
    'mitigated': 'MITIGATED',
    'not-finished': 'NOT_FINISHED',
  };
  return statusMap[status] || 'OPEN_RISK';
}

/**
 * Map database risk status to frontend format
 */
export function unmapRiskStatus(status) {
  const statusMap = {
    'OPEN_RISK': 'open-risk',
    'ANALYZED': 'analyzed',
    'PLANNED': 'planned',
    'MITIGATED': 'mitigated',
    'NOT_FINISHED': 'not-finished',
  };
  return statusMap[status] || 'open-risk';
}
