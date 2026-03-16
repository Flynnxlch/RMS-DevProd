import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';

const POSSIBILITY_LABELS = {
  1: 'Very Rarely',
  2: 'Almost Possible',
  3: 'Possible',
  4: 'Likely',
  5: 'Very Likely',
};

const IMPACT_LABELS = {
  1: 'Low',
  2: 'Low to Moderate',
  3: 'Moderate',
  4: 'Moderate to High',
  5: 'High',
};

// Helper function to reverse lookup impact/possibility from score
// This is used as a fallback when we have score but no impact/possibility
function findImpactPossibilityFromScore(score) {
  const RISK_SCORE_MATRIX = {
    1: { 1: 1, 2: 5, 3: 10, 4: 15, 5: 20 },  // P1
    2: { 1: 2, 2: 6, 3: 11, 4: 16, 5: 21 },  // P2
    3: { 1: 3, 2: 8, 3: 13, 4: 18, 5: 23 },  // P3
    4: { 1: 4, 2: 9, 3: 14, 4: 19, 5: 24 },  // P4
    5: { 1: 7, 2: 12, 3: 17, 4: 22, 5: 25 }, // P5
  };
  
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      if (RISK_SCORE_MATRIX[p] && RISK_SCORE_MATRIX[p][i] === score) {
        return { possibility: p, impact: i };
      }
    }
  }
  return null;
}

export default function RiskMatrix({ risks = [], onCellClick }) {
  const { isDark } = useTheme();
  
  // Build matrix: [possibility][impact] = count of risks (5x5)
  // Matrix orientation:
  // - Possibility (rows): 1-5 from bottom to top (left side labels)
  // - Impact (columns): 1-5 from left to right (bottom labels)
  // Uses currentScore/currentImpactLevel/currentProbabilityType if available (from mitigation),
  // otherwise falls back to inherent score/impact/possibility
  const matrix = useMemo(() => {
    const grid = Array(5)
      .fill(null)
      .map(() => Array(5).fill(0));

    for (const risk of risks) {
      // Get the actual score that appears on the Risk Card
      // Priority: currentScore > residualScore > inherentScore > score
      const actualScore = Number(risk.currentScore ?? risk.residualScore ?? risk.inherentScore ?? risk.score ?? 0);
      
      // score=0 means not evaluated; don't include it in the matrix counts
      if (actualScore <= 0) continue;
      
      // Get impact and possibility from current values if available (from mitigation),
      // otherwise use inherent values
      let impact = risk.currentImpactLevel ?? risk.impactLevel ?? risk.impact ?? 0;
      let possibility = risk.currentProbabilityType ?? risk.possibilityType ?? risk.possibility ?? risk.likelihood ?? 0;
      
      // If we have a score but no impact/possibility, we need to reverse lookup
      // This shouldn't normally happen, but handle it gracefully
      if ((impact <= 0 || possibility <= 0) && actualScore > 0) {
        // Try to find the combination that produces this score
        // This is a fallback - normally we should have impact/possibility
        const found = findImpactPossibilityFromScore(actualScore);
        if (found) {
          impact = found.impact;
          possibility = found.possibility;
        } else {
          // Skip this risk if we can't determine its position
          continue;
        }
      }
      
      // Clamp to valid range (1-5) and convert to 0-based index
      // Matrix: grid[possibility][impact] where possibility is row (1-5 from bottom to top)
      // So possibility 1 = index 0 (bottom row), possibility 5 = index 4 (top row)
      const p = Math.max(1, Math.min(5, possibility)) - 1; // 0-4 (possibility: 1->0, 5->4)
      const i = Math.max(1, Math.min(5, impact)) - 1; // 0-4 (impact: 1->0, 5->4)
      grid[p][i] += 1;
    }

    return grid;
  }, [risks]);

  // Color definitions - stronger for light theme, neon for dark theme
  const COLOR_MAP = {
    light: {
      rendah: '#16a34a',        // Stronger green (was #198754)
      'rendah-menengah': '#65a30d', // Stronger lime (was #84cc16)
      menengah: '#eab308',      // Stronger yellow (was #ffc107)
      'menengah-tinggi': '#ea580c', // Stronger orange (was #fd7e14)
      tinggi: '#dc2626',        // Stronger red (was #dc3545)
    },
    dark: {
      rendah: '#22c55e',        // Neon green
      'rendah-menengah': '#84cc16', // Neon lime
      menengah: '#fbbf24',      // Neon yellow
      'menengah-tinggi': '#f97316', // Neon orange
      tinggi: '#ef4444',        // Neon red
    },
  };

  const getCellColor = (possibility, impact) => {
    const score = computeRiskScore({ possibility, impactLevel: impact });
    const level = getRiskLevel(score);
    if (!level) return '#6b7280'; // Gray fallback
    
    // Use theme-specific colors
    const themeColors = isDark ? COLOR_MAP.dark : COLOR_MAP.light;
    return themeColors[level.key] || level.mapColor;
  };

  const getCellOpacity = (count) => {
    // Increased opacity for stronger colors (not pastel)
    const bump = 0.2; // additional strength as requested
    const base = (() => {
      if (count === 0) return isDark ? 0.28 : 0.44;
      if (count === 1) return isDark ? 0.58 : 0.77;
      if (count <= 3) return isDark ? 0.65 : 0.85;
      return isDark ? 0.53 : 0.85;
    })();
    return Math.min(1, base + bump);
  };

  // Possibility: 5 at top, 1 at bottom (rows - left side labels)
  // Impact: 1 at left, 5 at right (columns - bottom labels)
  const possibilityOrder = [5, 4, 3, 2, 1]; // Display order: 5 at top, 1 at bottom
  const impactOrder = [1, 2, 3, 4, 5]; // Display order: 1 at left, 5 at right

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top row: Empty corner only */}
      <div className="flex border-b border-gray-300 dark:border-gray-600 shrink-0">
        <div className="w-20 shrink-0 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 px-1 py-1 border-r border-gray-300 dark:border-gray-600">
        </div>
        {impactOrder.map((impact, idx) => (
          <div
            key={impact}
            className={`flex-1 flex items-center justify-center ${idx < impactOrder.length - 1 ? 'border-r border-gray-300 dark:border-gray-600' : ''}`}
          >
          </div>
        ))}
      </div>

      {/* Matrix rows: Possibility 5 at top, 1 at bottom (left side labels) */}
      <div className="flex-1 flex flex-col min-h-0">
        {possibilityOrder.map((possibility, rowIdx) => {
          // Map display index to matrix index (5->4, 4->3, 3->2, 2->1, 1->0)
          // possibility 5 = index 4 (top row), possibility 1 = index 0 (bottom row)
          const pIdx = possibility - 1; // 0-4 for matrix access
          const isLastRow = rowIdx === possibilityOrder.length - 1;
          
          return (
            <div key={possibility} className={`flex flex-1 min-h-0 ${!isLastRow ? 'border-b border-gray-300 dark:border-gray-600' : ''}`}>
              {/* Possibility label on left */}
              <div className="w-20 shrink-0 flex flex-col items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200 px-1 py-0.5 border-r border-gray-300 dark:border-gray-600">
                <span className="text-xs">{possibility}</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-1">
                  {POSSIBILITY_LABELS[possibility]}
                </span>
              </div>

              {/* Impact cells: 1 at left, 5 at right */}
              {impactOrder.map((impact, iIdx) => {
                const count = matrix[pIdx][iIdx];
                const score = computeRiskScore({ possibility, impactLevel: impact });
                const level = getRiskLevel(score);
                const bgColor = getCellColor(possibility, impact);
                const opacity = getCellOpacity(count);
                const isLastCell = iIdx === impactOrder.length - 1;

                return (
                  <div
                    key={impact}
                    onClick={() => onCellClick?.({ possibility, impact, score, level, count })}
                    className={`flex-1 flex items-center justify-center ${!isLastCell ? 'border-r border-gray-300 dark:border-gray-600' : ''} cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-inset hover:ring-gray-400 dark:hover:ring-gray-500 relative group min-w-0`}
                    style={{
                      backgroundColor: `${bgColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                    }}
                    title={`Kemungkinan: ${possibility} (${POSSIBILITY_LABELS[possibility]}), Dampak: ${impact} (${IMPACT_LABELS[impact]}), Score: ${score} (${level.label}), Risks: ${count}`}
                  >
                    {/* Score */}
                    <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {score}
                    </span>
                    {/* Count badge */}
                    {count > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 text-[9px] font-bold px-1 py-0 rounded-full shadow-sm">
                        {count}
                      </span>
                    )}
                    {/* Level label on hover */}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 dark:bg-black/70 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      {level.label}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom row: Impact labels (1 at left, 5 at right) */}
      <div className="flex border-t border-gray-300 dark:border-gray-600 shrink-0">
        <div className="w-20 shrink-0 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 px-1 py-1 border-r border-gray-300 dark:border-gray-600">
        </div>
        {impactOrder.map((impact, iIdx) => {
          const isLastCell = iIdx === impactOrder.length - 1;
          return (
            <div
              key={impact}
              className={`flex-1 flex flex-col items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200 px-0.5 py-1 ${!isLastCell ? 'border-r border-gray-300 dark:border-gray-600' : ''}`}
            >
              <span className="text-xs">{impact}</span>
              <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-1">
                {IMPACT_LABELS[impact]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

