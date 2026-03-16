import { useMemo, useState } from 'react';
import { computeRiskScore } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';
import RiskScoreBar from '../risk/RiskScoreBar';

const EVALUATION_STATUS_OPTIONS = [
  { value: 'effective', label: 'Effective - Mitigation is working well' },
  { value: 'partially-effective', label: 'Partially Effective - Needs improvement' },
  { value: 'ineffective', label: 'Ineffective - Mitigation not working' },
  { value: 'not-started', label: 'Not Started - Mitigation not yet implemented' },
];

const POSSIBILITY_LABELS = {
  1: 'Sangat Jarang Terjadi',
  2: 'Jarang Terjadi',
  3: 'Bisa Terjadi',
  4: 'Sangat Mungkin Terjadi',
  5: 'Hampir Pasti Terjadi',
};

const IMPACT_LABELS = {
  1: 'Sangat Rendah',
  2: 'Rendah',
  3: 'Moderat',
  4: 'Tinggi',
  5: 'Sangat Tinggi',
};

export default function EvaluationForm({
  risk,
  evaluator = 'Current User',
  onAccept,
  onReject,
  onCancel,
  disabled = false,
}) {
  // Evaluation fields
  const [evaluationStatus, setEvaluationStatus] = useState(
    risk?.evaluationStatus || EVALUATION_STATUS_OPTIONS[0].value
  );
  // evaluationNotes is not used in the form but kept for payload compatibility
  const evaluationNotes = risk?.evaluationNotes || '';
  const [evaluationDate, setEvaluationDate] = useState(
    risk?.evaluationDate || new Date().toISOString().split('T')[0]
  );
  const [evaluatorNote, setEvaluatorNote] = useState(risk?.evaluatorNote || '');

  // Current risk assessment (after mitigation)
  const [currentImpactDescription, setCurrentImpactDescription] = useState(
    risk?.currentImpactDescription || risk?.residualImpactDescription || ''
  );
  const [currentProbabilityDescription, setCurrentProbabilityDescription] = useState(
    risk?.currentProbabilityDescription || risk?.residualProbabilityDescription || ''
  );

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  // Get inherent score (baseline score before mitigation)
  const inherentScore = risk?.inherentScore || risk?.score || 0;
  
  // Use current values from Mitigation Planning for evaluation
  // These are the values that were set during mitigation planning
  const currentImpactLevel = risk?.residualImpactLevel || risk?.currentImpactLevel || risk?.impactLevel || 0;
  const currentProbabilityType = risk?.residualProbabilityType || risk?.currentProbabilityType || risk?.possibilityType || 0;

  // Calculate current score from current impact level and probability type
  // This is the score that represents the current risk state after mitigation
  const currentScore = useMemo(() => {
    // Priority: use currentScore from mitigation if available
    if (risk?.currentScore) {
      return Number(risk.currentScore);
    }
    // Otherwise, calculate from current impact level and probability type
    if (currentImpactLevel > 0 && currentProbabilityType > 0) {
      return computeRiskScore({
        possibility: Number(currentProbabilityType) || 0,
        impactLevel: Number(currentImpactLevel) || 0,
      });
    }
    // Fallback to residual score or inherent score
    return risk?.residualScore || risk?.residualScoreFinal || inherentScore || 0;
  }, [risk?.currentScore, risk?.residualScore, risk?.residualScoreFinal, currentImpactLevel, currentProbabilityType, inherentScore]);
  
  // Evaluated score uses current score (score risiko terkini)
  const evaluatedScore = currentScore;

  const buildPayload = (status) => {
    // Only send fields that should be saved to database
    // Note: evaluatedScore, currentImpactLevel, currentProbabilityType, score, etc.
    // are NOT sent as they are only for display (calculated from risk mitigation)
    return {
      // Evaluation metadata - fields that are input by user
      evaluationStatus: status,
      evaluationNotes: evaluationNotes.trim() || '',
      evaluationDate,
      evaluator,
      evaluatorNote: evaluatorNote.trim() || '',
      
      // Current risk assessment (after mitigation evaluation) - only descriptions
      // Target Yang Tercapai
      currentImpactDescription: currentImpactDescription.trim() || '',
      // Keterangan (opsional)
      currentProbabilityDescription: currentProbabilityDescription.trim() || '',
      
      // Note: evaluatedScore is calculated and displayed but NOT saved
      // It is calculated from currentImpactLevel and currentProbabilityType
      // which come from risk mitigation, not from evaluation form
    };
  };

  const handleAccept = (e) => {
    e.preventDefault();
    const payload = buildPayload('effective');
    onAccept?.(payload);
  };

  const handleReject = (e) => {
    e.preventDefault();
    const payload = buildPayload('ineffective');
    onReject?.(payload);
  };

  return (
    <form className="space-y-4">
      {/* Risk Summary */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ringkasan Risiko & Mitigasi</div>
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold">Peristiwa:</span> {risk?.riskEvent || risk?.title}
          </div>
          <div>
            <span className="font-semibold">Rencana Mitigasi:</span> {risk?.mitigationPlan || risk?.mitigation || 'N/A'}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="font-semibold">Current Score:</span>
            <span>{currentScore}/25</span>
            <div className="w-full sm:w-40">
              <RiskScoreBar score={currentScore} />
            </div>
          </div>
          {inherentScore > 0 && inherentScore !== currentScore && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Skor Inheren: {inherentScore}/25 → Current Score: {currentScore}/25
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Status */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Status Evaluasi</label>
        <select className={inputBase} value={evaluationStatus} onChange={(e) => setEvaluationStatus(e.target.value)}>
          {EVALUATION_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Evaluation Date & Evaluator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tanggal Evaluasi</label>
          <input
            type="date"
            className={inputBase}
            value={evaluationDate}
            onChange={(e) => setEvaluationDate(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Evaluator</label>
          <input
            className={`${inputBase} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
            value={evaluator}
            disabled
            readOnly
          />
        </div>
      </div>

      {/* Evaluator Note */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Catatan Evaluator</label>
        <textarea
          className={`${inputBase} min-h-[100px] resize-y`}
          value={evaluatorNote}
          onChange={(e) => setEvaluatorNote(e.target.value)}
          placeholder="Catatan tambahan dari evaluator..."
        />
      </div>

      {/* Current Risk Assessment (After Mitigation) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Evaluasi Keberhasilan Mitigasi</div>

        {/* Impact */}
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Target Yang Tercapai</label>
            <textarea
              className={`${inputBase} min-h-[90px] resize-y`}
              value={currentImpactDescription}
              onChange={(e) => setCurrentImpactDescription(e.target.value)}
              placeholder="Jelaskan target yang tercapai setelah mitigasi..."
            />
          </div>
        </div>

        {/* Probability */}
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Keterangan (opsional)</label>
            <textarea
              className={`${inputBase} min-h-[90px] resize-y`}
              value={currentProbabilityDescription}
              onChange={(e) => setCurrentProbabilityDescription(e.target.value)}
              placeholder="Keterangan tambahan (opsional)..."
            />
          </div>
        </div>

        {/* Evaluated Risk Level Result */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Risiko yang Dievaluasi</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Berdasarkan Current Score (Score Risiko Terkini)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RiskLevelBadge score={evaluatedScore} />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{evaluatedScore}/25</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors order-3 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors order-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="bi bi-x-circle mr-1.5"></i>
          Ditolak
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#198754] rounded-lg hover:bg-[#157347] transition-colors order-1 sm:order-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="bi bi-check-circle mr-1.5"></i>
          Diterima
        </button>
      </div>
    </form>
  );
}

