/**
 * Calculate risk status based on risk data
 *
 * Status flow:
 * - "Risiko Baru"        — score is 0/null (not analyzed yet)
 * - "Identifikasi Ulang" — risk was rejected by an approver (risk.approvalStatus === 'rejected')
 * - "Perlu Pengukuran"   — risk was approved by all required approvers (risk.approvalStatus === 'approved')
 * - "Analyzed"           — risk analysis is completed (has score > 0, no mitigation plan)
 * - "Planned"            — mitigation plan created (has mitigationPlan, no evaluation)
 * - "Monitor"            — evaluation effective AND currentScore is Low or Low-to-Moderate (≤ 11)
 * - "Mitigate"           — evaluation effective AND currentScore is Moderate or higher (≥ 12)
 * - "Need Improvement"   — evaluation completed but not effective
 */
export function getRiskStatus(risk) {
  if (!risk) return 'risiko-baru';

  const score = risk.score || 0;
  const hasMitigationPlan = (risk.mitigationPlan || risk.mitigation || '').trim().length > 0;
  const evaluationStatus = risk.evaluationStatus;

  // Risiko Baru: score is 0/null (not analyzed)
  if (score <= 0) {
    return 'risiko-baru';
  }

  // If has evaluation status, determine Monitor / Mitigate / Need Improvement
  if (evaluationStatus) {
    if (evaluationStatus === 'effective') {
      // Determine Monitor vs Mitigate based on current (residual) score after mitigation
      const currentScore = Number(
        risk.currentScore ?? risk.residualScore ?? risk.residualScoreFinal ?? 0
      );
      // Low (1–5) or Low-to-Moderate (6–11) → Monitor
      if (currentScore > 0 && currentScore <= 11) {
        return 'monitor';
      }
      // Moderate (12–15), Moderate-to-High (16–19), High (20+) → Mitigate
      return 'mitigate';
    } else {
      return 'need-improvement';
    }
  }

  // Planned: has mitigation plan but no evaluation yet
  if (hasMitigationPlan) {
    return 'planned';
  }

  // Analyzed: has score but no mitigation plan
  return 'analyzed';
}

/** Canonical status order for dropdowns, filters, and badge renders */
export const RISK_STATUS_ORDER = [
  'risiko-baru',
  'identifikasi-ulang',
  'perlu-pengukuran',
  'analyzed',
  'planned',
  'monitor',
  'mitigate',
  'need-improvement',
];

export const RISK_STATUS_CONFIG = {
  'risiko-baru': {
    label: 'Risiko Baru',
    badgeClass:
      'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200',
    description: 'Risiko belum dianalisis',
  },
  'identifikasi-ulang': {
    label: 'Identifikasi Ulang',
    badgeClass:
      'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-900/30 dark:text-red-300',
    description: 'Risiko ditolak oleh approver, perlu identifikasi ulang',
  },
  'perlu-pengukuran': {
    label: 'Perlu Pengukuran',
    badgeClass:
      'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
    description: 'Risiko disetujui, menunggu pengukuran',
  },
  analyzed: {
    label: 'Analyzed',
    badgeClass:
      'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    description: 'Analisis risiko selesai',
  },
  planned: {
    label: 'Planned',
    badgeClass:
      'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    description: 'Rencana mitigasi telah dibuat',
  },
  monitor: {
    label: 'Monitor',
    badgeClass:
      'bg-teal-100 text-teal-800 ring-1 ring-inset ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
    description: 'Skor residual rendah — lanjut dipantau',
  },
  mitigate: {
    label: 'Mitigate',
    badgeClass:
      'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    description: 'Skor residual tinggi — perlu mitigasi lanjutan',
  },
  'need-improvement': {
    label: 'Need Improvement',
    badgeClass:
      'bg-pink-100 text-pink-800 ring-1 ring-inset ring-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
    description: 'Mitigasi belum efektif',
  },
};
