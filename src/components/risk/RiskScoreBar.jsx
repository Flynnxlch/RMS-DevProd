import { getRiskLevel } from '../../utils/risk';

export default function RiskScoreBar({ score, className = '' }) {
  // Don't render if score is invalid, 0, null, undefined, or falsy
  if (score === null || score === undefined || score === '') return null;
  
  const numScore = Number(score);
  // Check if conversion resulted in NaN or if score is <= 0
  if (isNaN(numScore) || numScore <= 0) return null;

  const lvl = getRiskLevel(numScore);
  if (!lvl) return null;

  const pct = Math.round((Math.min(25, Math.max(0, numScore)) / 25) * 100);
  const barClass = lvl?.barClass ?? 'bg-transparent';

  return (
    <div className={`w-full ${className}`} aria-label={`Risk score ${numScore} out of 25`}>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


