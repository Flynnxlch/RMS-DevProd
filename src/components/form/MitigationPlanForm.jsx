import { useMemo, useState } from 'react';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';
import NotificationPopup from '../ui/NotificationPopup';
import HandlingTypeDropdown from '../ui/HandlingTypeDropdown';

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

const CONTROL_EFFECTIVITY_LABELS = {
  'effective': 'Effective',
  'partially-effective': 'Partially Effective',
  'ineffective': 'Ineffective',
  'none': 'No Control',
};

export default function MitigationPlanForm({
  risk,
  onSubmit,
  onCancel,
  onRequestEvaluation,
}) {
  // Notification state
  const [notification, setNotification] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

  // Mitigation Plan fields
  const [handlingType, setHandlingType] = useState(
    risk?.handlingType || risk?.mitigationHandlingType || ''
  );
  const [mitigatePlan, setMitigatePlan] = useState(risk?.mitigationPlan || risk?.mitigation || '');
  const [outputPlan, setOutputPlan] = useState(risk?.mitigationOutput || '');

  // Anggaran & Realisasi biaya
  const formatCurrency = (value) => {
    if (!value || value === '' || value === '0') return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : Number(value);
    if (isNaN(num) || num === 0) return '';
    // Format: Rp 100.000,00 (Indonesian format with dot as thousand separator)
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
    // Ensure format is Rp 100.000,00 (with dot for thousands and comma for decimals)
    return formatted;
  };
  
  // Parse currency from formatted string to number
  const parseCurrency = (value) => {
    if (!value) return '';
    // Remove all non-digit characters (including Rp, spaces, dots, commas)
    return value.replace(/[^\d]/g, '');
  };
  
  const getInitialBudgetDisplay = () => {
    if (risk?.mitigationBudget !== undefined && risk?.mitigationBudget !== null) {
      return formatCurrency(String(risk.mitigationBudget));
    }
    return '';
  };
  const getInitialActualDisplay = () => {
    if (risk?.mitigationActual !== undefined && risk?.mitigationActual !== null) {
      return formatCurrency(String(risk.mitigationActual));
    }
    return '';
  };

  const [mitigationBudgetDisplay, setMitigationBudgetDisplay] = useState(getInitialBudgetDisplay());
  const [mitigationActualDisplay, setMitigationActualDisplay] = useState(getInitialActualDisplay());

  // Deskripsi tindak lanjut
  const [progressMitigation, setProgressMitigation] = useState(risk?.progressMitigation || '');
  const [realizationTarget, setRealizationTarget] = useState(risk?.realizationTarget || '');
  const [targetKpi, setTargetKpi] = useState(risk?.targetKpi || '');

  // Kondisi risiko terkini - menggunakan current fields
  const [currentImpactLevel, setCurrentImpactLevel] = useState(risk?.currentImpactLevel || 0);
  const [currentProbabilityType, setCurrentProbabilityType] = useState(risk?.currentProbabilityType || 0);

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  // Always use inherentScore from analysis, not from score or mitigation
  // This ensures inherentScore is never affected by current_score or residual_score
  const inherentScore = risk?.inherentScore || 0;
  
  // Calculate current score from current impact level and probability type
  const currentScore = useMemo(() => {
    return computeRiskScore({
      possibility: Number(currentProbabilityType) || 0,
      impactLevel: Number(currentImpactLevel) || 0,
    });
  }, [currentProbabilityType, currentImpactLevel]);

  // Calculate current level from current score
  const currentLevel = useMemo(() => {
    if (currentScore > 0) {
      const level = getRiskLevel(currentScore);
      return level?.label || null;
    }
    return null;
  }, [currentScore]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...risk,
      // Mitigation Plan main
      mitigation: mitigatePlan.trim(),
      mitigationPlan: mitigatePlan.trim(),
      handlingType, // align with backend field name
      mitigationOutput: outputPlan.trim(),
      mitigationBudget: mitigationBudgetDisplay === '' ? null : Number(parseCurrency(mitigationBudgetDisplay)),
      mitigationActual: mitigationActualDisplay === '' ? null : Number(parseCurrency(mitigationActualDisplay)),
      progressMitigation: progressMitigation.trim(),
      realizationTarget: realizationTarget.trim(),
      // Preserve evaluationRequested status (don't change it when saving)
      evaluationRequested: risk?.evaluationRequested || false,
      targetKpi: targetKpi.trim(),

      // Save inherent score
      inherentScore: inherentScore,

      // Current Risk (after mitigation) - kondisi risiko terkini
      currentImpactLevel: Number(currentImpactLevel) || null,
      currentProbabilityType: Number(currentProbabilityType) || null,
      currentScore: currentScore > 0 ? currentScore : null,
      currentLevel: currentLevel || null,
    };

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ringkasan Risiko</div>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold">Efektivitas Kontrol yang Ada:</span>{' '}
            {risk?.controlEffectivenessAssessment
              ? CONTROL_EFFECTIVITY_LABELS[risk.controlEffectivenessAssessment] || risk.controlEffectivenessAssessment
              : 'N/A'}
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-gray-800 dark:text-gray-100">Inherent</div>
            <div>
              <span className="font-semibold">Dampak Inheren:</span>{' '}
              {risk?.impactLevel
                ? `${risk.impactLevel} — ${IMPACT_LABELS[risk.impactLevel] || 'N/A'}`
                : 'N/A'}
              {risk?.impactDescription && (
                <div className="mt-1 ml-0 text-gray-600 dark:text-gray-400">{risk.impactDescription}</div>
              )}
            </div>
            <div>
              <span className="font-semibold">Kemungkinan Inheren:</span>{' '}
              {risk?.possibilityType
                ? `${risk.possibilityType} — ${POSSIBILITY_LABELS[risk.possibilityType] || 'N/A'}`
                : 'N/A'}
              {risk?.possibilityDescription && (
                <div className="mt-1 ml-0 text-gray-600 dark:text-gray-400">{risk.possibilityDescription}</div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-gray-800 dark:text-gray-100">Residual</div>
            <div>
              <span className="font-semibold">Dampak Residual:</span>{' '}
              {risk?.residualImpactLevel
                ? `${risk.residualImpactLevel} — ${IMPACT_LABELS[risk.residualImpactLevel] || 'N/A'}`
                : 'N/A'}
              {risk?.residualImpactDescription && (
                <div className="mt-1 ml-0 text-gray-600 dark:text-gray-400">{risk.residualImpactDescription}</div>
              )}
            </div>
            <div>
              <span className="font-semibold">Kemungkinan Residual:</span>{' '}
              {risk?.residualPossibilityType
                ? `${risk.residualPossibilityType} — ${POSSIBILITY_LABELS[risk.residualPossibilityType] || 'N/A'}`
                : 'N/A'}
              {risk?.residualPossibilityDescription && (
                <div className="mt-1 ml-0 text-gray-600 dark:text-gray-400">{risk.residualPossibilityDescription}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Jenis Penanganan</label>
        <HandlingTypeDropdown
          value={handlingType}
          onChange={setHandlingType}
          placeholder="Pilih Jenis Penanganan"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rencana Mitigasi Risiko</label>
        <textarea
          className={`${inputBase} min-h-[110px] resize-y`}
          value={mitigatePlan}
          onChange={(e) => setMitigatePlan(e.target.value)}
          placeholder="Jelaskan rencana mitigasi..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Output Realisasi Mitigasi</label>
        <textarea
          className={`${inputBase} min-h-[90px] resize-y`}
          value={outputPlan}
          onChange={(e) => setOutputPlan(e.target.value)}
          placeholder="Output/hasil yang direalisasikan dari rencana mitigasi..."
        />
      </div>

      {/* Anggaran & Realisasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Anggaran Biaya Mitigasi Risiko</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputBase}
            value={mitigationBudgetDisplay}
            onChange={(e) => {
              const rawValue = parseCurrency(e.target.value);
              if (rawValue === '') {
                setMitigationBudgetDisplay('');
              } else {
                setMitigationBudgetDisplay(formatCurrency(rawValue));
              }
            }}
            onBlur={(e) => {
              const rawValue = parseCurrency(e.target.value);
              if (rawValue === '') {
                setMitigationBudgetDisplay('');
              } else {
                setMitigationBudgetDisplay(formatCurrency(rawValue));
              }
            }}
            placeholder="Rp 0"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Realisasi Biaya Mitigasi Risiko</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputBase}
            value={mitigationActualDisplay}
            onChange={(e) => {
              const rawValue = parseCurrency(e.target.value);
              if (rawValue === '') {
                setMitigationActualDisplay('');
              } else {
                setMitigationActualDisplay(formatCurrency(rawValue));
              }
            }}
            onBlur={(e) => {
              const rawValue = parseCurrency(e.target.value);
              if (rawValue === '') {
                setMitigationActualDisplay('');
              } else {
                setMitigationActualDisplay(formatCurrency(rawValue));
              }
            }}
            placeholder="Rp 0"
          />
        </div>
      </div>

      {/* Persentase realisasi */}
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="w-14 h-14 rounded-full border-4 border-blue-200 dark:border-blue-900/40 flex items-center justify-center relative">
          {(() => {
            const budget = mitigationBudgetDisplay === '' ? 0 : Number(parseCurrency(mitigationBudgetDisplay));
            const actual = mitigationActualDisplay === '' ? 0 : Number(parseCurrency(mitigationActualDisplay));
            const pct = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 0;
            return (
              <>
                <svg className="absolute inset-0" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                  />
                  <path
                    className="text-blue-500 dark:text-blue-400"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${pct},100`}
                    d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{pct}%</span>
              </>
            );
          })()}
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-white">Realisasi Anggaran</div>
          <div>Menunjukkan persentase realisasi terhadap anggaran.</div>
        </div>
      </div>

      {/* Bagian 2: Deskripsi Tindak Lanjut */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Bagian 2: Deskripsi Tindak Lanjut</div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Progress Mitigasi</label>
          <textarea
            className={`${inputBase} min-h-[90px] resize-y`}
            value={progressMitigation}
            onChange={(e) => setProgressMitigation(e.target.value)}
            placeholder="Jelaskan progress mitigasi..."
          />
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Realisasi Terhadap Target</label>
            <textarea
              className={`${inputBase} min-h-[90px] resize-y`}
              value={realizationTarget}
              onChange={(e) => setRealizationTarget(e.target.value)}
              placeholder="Jelaskan realisasi terhadap target..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Target KPI</label>
            <textarea
              className={`${inputBase} min-h-[90px] resize-y`}
              value={targetKpi}
              onChange={(e) => setTargetKpi(e.target.value)}
              placeholder="Jelaskan target KPI..."
            />
          </div>
        </div>
      </div>

      {/* Bagian 3: Kondisi Risiko Terkini */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Bagian 3: Kondisi Risiko Terkini</div>

        {/* Dampak & Kemungkinan Terkini (tanpa deskripsi) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tingkat Dampak Terkini (1–5)</label>
            <select
              className={inputBase}
              value={currentImpactLevel}
              onChange={(e) => setCurrentImpactLevel(e.target.value)}
            >
              <option value={0}>-- Pilih --</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} — {IMPACT_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tingkat Kemungkinan Terkini (1–5)</label>
            <select
              className={inputBase}
              value={currentProbabilityType}
              onChange={(e) => setCurrentProbabilityType(e.target.value)}
            >
              <option value={0}>-- Pilih --</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} — {POSSIBILITY_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Score Risiko Terkini */}
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Score Risiko Terkini</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Score Inheren: {inherentScore}/25 → Score Risiko Terkini: {currentScore > 0 ? currentScore : inherentScore}/25
                {currentLevel && (
                  <span className="ml-2">
                    ({currentLevel})
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentScore > 0 && currentLevel && (
                <RiskLevelBadge score={currentScore} />
              )}
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {currentScore > 0 ? currentScore : inherentScore}/25
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Batal
        </button>
        {onRequestEvaluation && (
          <button
            type="button"
            onClick={() => {
              setNotification({
                isOpen: true,
                type: 'confirm',
                title: 'Konfirmasi Ajukan Evaluasi',
                message: 'Apakah Anda yakin ingin mengajukan evaluasi keberhasilan untuk risiko ini?',
                onConfirm: () => {
                  onRequestEvaluation(risk);
                },
              });
            }}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#ffc107] rounded-lg hover:bg-[#e0a800] transition-colors"
          >
            Ajukan Evaluasi
          </button>
        )}
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors"
        >
          Simpan Rencana Mitigasi
        </button>
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        onConfirm={notification.onConfirm}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        confirmText="Ya"
        cancelText="Tidak"
      />
    </form>
  );
}

