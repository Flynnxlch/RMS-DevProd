import { useMemo } from 'react';
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

function findImpactPossibilityFromScore(score) {
  const RISK_SCORE_MATRIX = {
    1: { 1: 1, 2: 5, 3: 10, 4: 15, 5: 20 },
    2: { 1: 2, 2: 6, 3: 11, 4: 16, 5: 21 },
    3: { 1: 3, 2: 8, 3: 13, 4: 18, 5: 23 },
    4: { 1: 4, 2: 9, 3: 14, 4: 19, 5: 24 },
    5: { 1: 7, 2: 12, 3: 17, 4: 22, 5: 25 },
  };
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      if (RISK_SCORE_MATRIX[p]?.[i] === score) return { possibility: p, impact: i };
    }
  }
  return null;
}

// scoreMode: 'inherent' | 'current' | 'residual'
function pickScore(risk, scoreMode) {
  if (scoreMode === 'current') {
    return {
      score: Number(risk.currentScore ?? risk.inherentScore ?? risk.score ?? 0),
      impact: risk.currentImpactLevel ?? risk.impactLevel ?? risk.impact ?? 0,
      possibility: risk.currentProbabilityType ?? risk.possibilityType ?? risk.possibility ?? risk.likelihood ?? 0,
    };
  }
  if (scoreMode === 'residual') {
    return {
      score: Number(risk.residualScore ?? risk.measurement?.residualScore ?? 0),
      impact: risk.residualImpactLevel ?? risk.measurement?.residualImpactLevel ?? 0,
      possibility: risk.residualPossibilityType ?? risk.measurement?.residualPossibilityType ?? 0,
    };
  }
  // inherent (default)
  return {
    score: Number(risk.inherentScore ?? risk.measurement?.inherentScore ?? risk.score ?? 0),
    impact: risk.impactLevel ?? risk.measurement?.impactLevel ?? risk.impact ?? 0,
    possibility: risk.possibilityType ?? risk.measurement?.possibilityType ?? risk.possibility ?? risk.likelihood ?? 0,
  };
}

export default function RiskMatrix({ risks = [], onCellClick, scoreMode = 'inherent' }) {
  const matrix = useMemo(() => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(0));

    for (const risk of risks) {
      const { score: actualScore, impact: rawImpact, possibility: rawPossibility } = pickScore(risk, scoreMode);
      if (actualScore <= 0) continue;

      let impact = rawImpact;
      let possibility = rawPossibility;

      if ((impact <= 0 || possibility <= 0) && actualScore > 0) {
        const found = findImpactPossibilityFromScore(actualScore);
        if (found) { impact = found.impact; possibility = found.possibility; }
        else continue;
      }

      const p = Math.max(1, Math.min(5, possibility)) - 1;
      const i = Math.max(1, Math.min(5, impact)) - 1;
      grid[p][i] += 1;
    }

    return grid;
  }, [risks, scoreMode]);

  const possibilityOrder = [5, 4, 3, 2, 1];
  const impactOrder = [1, 2, 3, 4, 5];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top spacer row */}
      <div className="flex border-b border-gray-300 dark:border-gray-600 shrink-0">
        <div className="w-20 shrink-0 border-r border-gray-300 dark:border-gray-600 py-1" />
        {impactOrder.map((impact, idx) => (
          <div
            key={impact}
            className={`flex-1 ${idx < impactOrder.length - 1 ? 'border-r border-gray-300 dark:border-gray-600' : ''}`}
          />
        ))}
      </div>

      {/* Matrix rows */}
      <div className="flex-1 flex flex-col min-h-0">
        {possibilityOrder.map((possibility, rowIdx) => {
          const pIdx = possibility - 1;
          const isLastRow = rowIdx === possibilityOrder.length - 1;

          return (
            <div
              key={possibility}
              className={`flex flex-1 min-h-0 ${!isLastRow ? 'border-b border-gray-300 dark:border-gray-600' : ''}`}
            >
              {/* Possibility label */}
              <div className="w-20 shrink-0 flex flex-col items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200 px-1 py-0.5 border-r border-gray-300 dark:border-gray-600">
                <span className="text-xs">{possibility}</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-1">
                  {POSSIBILITY_LABELS[possibility]}
                </span>
              </div>

              {/* Cells */}
              {impactOrder.map((impact, iIdx) => {
                const count = matrix[pIdx][iIdx];
                const score = computeRiskScore({ possibility, impactLevel: impact });
                const level = getRiskLevel(score);
                const isLastCell = iIdx === impactOrder.length - 1;

                // Always use the risk level color regardless of count
                const cellStyle = { backgroundColor: level?.mapColor ?? '#6b7280' };

                return (
                  <div
                    key={impact}
                    onClick={() => onCellClick?.({ possibility, impact, score, level, count })}
                    className={`flex-1 flex items-center justify-center ${!isLastCell ? 'border-r border-gray-300 dark:border-gray-600' : ''} cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-inset hover:ring-gray-400 dark:hover:ring-gray-500 relative group min-w-0`}
                    style={cellStyle}
                    title={`Kemungkinan: ${possibility} (${POSSIBILITY_LABELS[possibility]}), Dampak: ${impact} (${IMPACT_LABELS[impact]}), Score: ${score}${level ? ` (${level.label})` : ''}, Risiko: ${count}`}
                  >
                    {/* Score number */}
                    <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {score}
                    </span>

                    {/* Count badge */}
                    {count > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-gray-800/80 dark:bg-white/90 text-white dark:text-gray-900 text-[9px] font-bold px-1 py-0 rounded-full shadow-sm">
                        {count}
                      </span>
                    )}

                    {/* Hover label */}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 dark:bg-black/70 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      {level?.label ?? '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom: Impact labels */}
      <div className="flex border-t border-gray-300 dark:border-gray-600 shrink-0">
        <div className="w-20 shrink-0 border-r border-gray-300 dark:border-gray-600 py-1" />
        {impactOrder.map((impact, iIdx) => (
          <div
            key={impact}
            className={`flex-1 flex flex-col items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200 px-0.5 py-1 ${iIdx < impactOrder.length - 1 ? 'border-r border-gray-300 dark:border-gray-600' : ''}`}
          >
            <span className="text-xs">{impact}</span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-1">
              {IMPACT_LABELS[impact]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
