/**
 * Calculate risk status based on risk data
 *
 * Status flow:
 * - "Risiko Baru"        — not yet approved (no measurement)
 * - "Identifikasi Ulang" — risk was rejected by an approver
 * - "Perlu Pengukuran"   — risk was approved, awaiting Risk Assessment measurement
 * - "Planned"            — Risk Officer/Champion has submitted mitigation plan (awaiting RA review)
 * - "Monitor"            — currentScore set by RA review is low (1–5), or treatmentOption is Accept/Monitor
 * - "Mitigate"           — after measurement with non-accept treatmentOption, or RA review score > 5
 * - "Need Improvement"   — evaluation completed but not effective
 */
export function getRiskStatus(risk) {
  if (!risk) return 'risiko-baru';

  const hasMeasurement = !!(risk.hasMeasurement || risk.measurement);
  const hasMitigationPlan = !!(risk.mitigationPlan && risk.mitigationPlan.trim().length > 0);
  const currentScore = Number(risk.currentScore ?? 0);

  // Phase 1: No measurement yet → check approval state
  if (!hasMeasurement) {
    if (risk.approvalStatus === 'rejected') return 'identifikasi-ulang';
    if (risk.approvalStatus === 'approved') return 'perlu-pengukuran';
    return 'risiko-baru';
  }

  // Phase 2: Has measurement AND Risk Assessment has set a currentScore (post-mitigation review)
  // currentScore 1–5 (low risk) → mitigasi berhasil → Monitor
  // currentScore > 5 → still needs mitigation → Mitigate
  if (currentScore > 0) {
    if (currentScore <= 5) return 'monitor';
    return 'mitigate';
  }

  // Phase 3: Has measurement, no currentScore → check if mitigation plan has been submitted
  if (hasMitigationPlan) {
    return 'planned';
  }

  // Phase 4: Has measurement, no mitigation plan yet → determine from treatmentOption
  const treatmentOption = (risk.measurement?.treatmentOption || '').toLowerCase();
  if (treatmentOption.includes('accept') || treatmentOption.includes('monitor')) {
    return 'monitor';
  }
  // Reduce/Mitigate, Transfer/Sharing, Avoid/Hindari → needs mitigation plan
  return 'mitigate';
}

/** Canonical status order for dropdowns, filters, and badge renders */
export const RISK_STATUS_ORDER = [
  'risiko-baru',
  'identifikasi-ulang',
  'perlu-pengukuran',
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
    label: 'Perlu Mitigasi',
    badgeClass:
      'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    description: 'Skor residual tinggi — perlu mitigasi lanjutan',
  },
  'need-improvement': {
    label: 'Butuh Penyesuaian',
    badgeClass:
      'bg-pink-100 text-pink-800 ring-1 ring-inset ring-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
    description: 'Mitigasi belum efektif',
  },
};
