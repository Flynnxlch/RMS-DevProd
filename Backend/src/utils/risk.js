/**
 * Generate risk ID in format: RISK-YYYYMMDD-XXXX
 */
export function generateRiskId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RISK-${dateStr}-${random}`;
}

/**
 * Compute risk score from possibility and impact
 */
export function computeRiskScore({ possibility, impactLevel }) {
  const p = Number(possibility) || 0;
  const i = Number(impactLevel) || 0;
  return p * i;
}

/**
 * Get risk level label from score
 */
export function getRiskLevel(score) {
  const s = Number(score) || 0;
  if (s <= 5) return { label: 'Sangat Rendah', level: 1 };
  if (s <= 10) return { label: 'Rendah', level: 2 };
  if (s <= 15) return { label: 'Menengah', level: 3 };
  if (s <= 20) return { label: 'Menengah-Tinggi', level: 4 };
  return { label: 'Tinggi', level: 5 };
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
