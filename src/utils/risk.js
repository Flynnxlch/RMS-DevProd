export const RISK_LEVELS = [
  {
    key: 'rendah',
    label: 'Low',
    labelEn: 'Low',
    labelId: 'Rendah',
    min: 1,
    max: 5,
    badgeClass: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-900/30 dark:text-green-300',
    dotClass: 'bg-green-600',
    barClass: 'bg-green-600',
    mapColor: '#198754', // Dark green
  },
  {
    key: 'rendah-menengah',
    label: 'Low to Moderate',
    labelEn: 'Low to Moderate',
    labelId: 'Rendah-Menengah',
    min: 6,
    max: 11,
    badgeClass: 'bg-lime-100 text-lime-800 ring-1 ring-inset ring-lime-200 dark:bg-lime-900/30 dark:text-lime-300',
    dotClass: 'bg-lime-500',
    barClass: 'bg-lime-500',
    mapColor: '#84cc16', // Light green
  },
  {
    key: 'menengah',
    label: 'Moderate',
    labelEn: 'Moderate',
    labelId: 'Menengah',
    min: 12,
    max: 15,
    badgeClass: 'bg-yellow-100 text-yellow-900 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    dotClass: 'bg-yellow-400',
    barClass: 'bg-yellow-400',
    mapColor: '#ffc107', // Yellow
  },
  {
    key: 'menengah-tinggi',
    label: 'Moderate to High',
    labelEn: 'Moderate to High',
    labelId: 'Menengah-Tinggi',
    min: 16,
    max: 19,
    badgeClass: 'bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    dotClass: 'bg-orange-500',
    barClass: 'bg-orange-500',
    mapColor: '#fd7e14', // Orange
  },
  {
    key: 'tinggi',
    label: 'High',
    labelEn: 'High',
    labelId: 'Tinggi',
    min: 20,
    max: 25,
    badgeClass: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-900/30 dark:text-red-300',
    dotClass: 'bg-red-500',
    barClass: 'bg-red-500',
    mapColor: '#dc3545', // Red
  },
];

export function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// Custom risk score mapping table
// P = Possibility (1-5), I = Impact (1-5)
const RISK_SCORE_MATRIX = {
  1: { 1: 1, 2: 5, 3: 10, 4: 15, 5: 20 },  // P1
  2: { 1: 2, 2: 6, 3: 11, 4: 16, 5: 21 },  // P2
  3: { 1: 3, 2: 8, 3: 13, 4: 18, 5: 23 },  // P3
  4: { 1: 4, 2: 9, 3: 14, 4: 19, 5: 24 },  // P4
  5: { 1: 7, 2: 12, 3: 17, 4: 22, 5: 25 }, // P5
};

export function computeRiskScore({ likelihood, impact, possibility, impactLevel }) {
  // Support both old (likelihood) and new (possibility) naming
  const p = possibility || likelihood;
  const i = impactLevel || impact;
  
  // If possibility or impact is missing (0, null, undefined), return 0
  if (!p || !i || p === 0 || i === 0) {
    return 0;
  }
  
  const pClamped = clampInt(p, 1, 5);
  const iClamped = clampInt(i, 1, 5);
  
  // Use custom mapping table
  const row = RISK_SCORE_MATRIX[pClamped];
  if (row && row[iClamped] !== undefined) {
    return row[iClamped];
  }
  
  // Fallback to simple multiplication if mapping not found
  return pClamped * iClamped;
}

export function getRiskLevel(score) {
  const n = Number(score);
  // score=0 means "not evaluated" and should not be labeled
  if (!Number.isFinite(n) || n <= 0) return null;
  const s = clampInt(n, 1, 25);
  return RISK_LEVELS.find((lvl) => s >= lvl.min && s <= lvl.max) ?? RISK_LEVELS[0];
}

export function formatRiskId(n) {
  const num = clampInt(n, 1, 9999);
  return `R-${String(num).padStart(4, '0')}`;
}

export function getNextRiskId(risks) {
  const max = (risks || []).reduce((acc, r) => {
    const m = String(r.id || '').match(/(\d+)/);
    const n = m ? Number.parseInt(m[1], 10) : 0;
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return formatRiskId(max + 1);
}

export function sortRisksByScoreDesc(risks) {
  return [...risks].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function getRiskSummary(risks) {
  const total = risks.length;
  const assessed = risks.filter((r) => (r.score || 0) > 0);
  const assessedTotal = assessed.length;
  const unassessedTotal = total - assessedTotal;
  const avgScore = assessedTotal
    ? Math.round((assessed.reduce((sum, r) => sum + (r.score || 0), 0) / assessedTotal) * 10) / 10
    : 0;

  const counts = RISK_LEVELS.reduce((acc, lvl) => {
    acc[lvl.key] = 0;
    return acc;
  }, {});

  for (const r of assessed) {
    const lvl = getRiskLevel(r.score);
    if (!lvl) continue;
    counts[lvl.key] += 1;
  }

  return {
    total,
    assessedTotal,
    unassessedTotal,
    avgScore,
    counts,
    highPlus: (counts['menengah-tinggi'] || 0) + (counts.tinggi || 0),
    extreme: counts.tinggi || 0,
  };
}


