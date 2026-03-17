import { useMemo, useState } from 'react';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';
import ControlEffectivenessDropdown from '../ui/ControlEffectivenessDropdown';
import ControlLevelDropdown from '../ui/ControlLevelDropdown';
import ControlTypeDropdown from '../ui/ControlTypeDropdown';
import MonthPickerDropdown from '../ui/MonthPickerDropdown';
const IMPACT_LEVEL_OPTIONS = [
  { value: 1, label: '1 — Rendah' },
  { value: 2, label: '2 — Rendah - Menengah' },
  { value: 3, label: '3 — Menengah' },
  { value: 4, label: '4 — Menengah - Tinggi' },
  { value: 5, label: '5 — Tinggi' },
];

const POSSIBILITY_TYPE_OPTIONS = [
  { value: 1, label: '1 — Sangat Jarang Terjadi' },
  { value: 2, label: '2 — Jarang Terjadi' },
  { value: 3, label: '3 — Bisa Terjadi' },
  { value: 4, label: '4 — Sangat Mungkin Terjadi' },
  { value: 5, label: '5 — Hampir Pasti Terjadi' },
];

// Convert ISO date string to YYYY-MM (month input format)
const formatMonthForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  } catch {
    return '';
  }
};

// Format YYYY-MM to "Bulan Tahun" display string (e.g. "Januari 2025")
const formatMonthDisplay = (yyyyMM) => {
  if (!yyyyMM) return '';
  try {
    const date = new Date(yyyyMM + '-01T00:00:00');
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

export default function RiskAnalysisForm({
  risk,
  onSubmit,
  onCancel,
  wizardMode = false, // When true: hide Section 3, show "← Back" / "Save Risk" buttons
  isSubmitting = false,
}) {
  // Bagian 1: Kontrol yang Ada
  const [existingControl, setExistingControl] = useState(risk?.existingControl || '');
  const [controlType, setControlType] = useState(risk?.controlType || '');
  const [controlLevel, setControlLevel] = useState(risk?.controlLevel || '');
  const [controlEffectivenessAssessment, setControlEffectivenessAssessment] = useState(
    risk?.controlEffectivenessAssessment || ''
  );
  const [estimatedExposureDate, setEstimatedExposureDate] = useState(formatMonthForInput(risk?.estimatedExposureDate || ''));
  const [estimatedExposureDateEnd, setEstimatedExposureDateEnd] = useState(formatMonthForInput(risk?.estimatedExposureDateEnd || ''));

  // Bagian 2: Key Risk Indicator
  const [keyRiskIndicator, setKeyRiskIndicator] = useState(risk?.keyRiskIndicator || '');
  const [kriUnit, setKriUnit] = useState(risk?.kriUnit || '');
  const [kriValueSafe, setKriValueSafe] = useState(risk?.kriValueSafe || '');
  const [kriValueCaution, setKriValueCaution] = useState(risk?.kriValueCaution || '');
  const [kriValueDanger, setKriValueDanger] = useState(risk?.kriValueDanger || '');

  // Bagian 3: Pengukuran Resiko - Inherent Risk
  const [impactDescription, setImpactDescription] = useState(risk?.impactDescription || '');
  const [impactLevel, setImpactLevel] = useState(risk?.impactLevel || 0);
  const [possibilityType, setPossibilityType] = useState(risk?.possibilityType || 0);
  const [possibilityDescription, setPossibilityDescription] = useState(risk?.possibilityDescription || '');

  // Bagian 3: Pengukuran Resiko - Residual Risk
  const [residualImpactDescription, setResidualImpactDescription] = useState(risk?.residualImpactDescription || '');
  const [residualImpactLevel, setResidualImpactLevel] = useState(risk?.residualImpactLevel || 0);
  const [residualPossibilityType, setResidualPossibilityType] = useState(risk?.residualPossibilityType || 0);
  const [residualPossibilityDescription, setResidualPossibilityDescription] = useState(risk?.residualPossibilityDescription || '');

  // Calculate scores
  const inherentScore = useMemo(() => {
    if (impactLevel > 0 && possibilityType > 0) {
      return computeRiskScore({ possibility: possibilityType, impactLevel });
    }
    return 0;
  }, [possibilityType, impactLevel]);

  const inherentLevel = useMemo(() => {
    return getRiskLevel(inherentScore);
  }, [inherentScore]);

  const residualScore = useMemo(() => {
    if (residualImpactLevel > 0 && residualPossibilityType > 0) {
      return computeRiskScore({ possibility: residualPossibilityType, impactLevel: residualImpactLevel });
    }
    return 0;
  }, [residualPossibilityType, residualImpactLevel]);

  const residualLevel = useMemo(() => {
    if (residualScore > 0) {
      return getRiskLevel(residualScore);
    }
    return null;
  }, [residualScore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!risk) return;

    const payload = {
      ...risk,
      // Bagian 1: Kontrol yang Ada
      existingControl,
      controlType,
      controlLevel,
      controlEffectivenessAssessment,
      estimatedExposureDate: estimatedExposureDate ? estimatedExposureDate + '-01' : null,
      estimatedExposureDateEnd: estimatedExposureDateEnd ? estimatedExposureDateEnd + '-01' : null,
      // Bagian 2: Key Risk Indicator
      keyRiskIndicator,
      kriUnit,
      kriValueSafe,
      kriValueCaution,
      kriValueDanger,
    };

    // Bagian 3 is excluded in wizard mode (moved to Phase 5 "Pengukuran Risiko")
    if (!wizardMode) {
      payload.impactDescription = impactDescription;
      payload.impactLevel = Number(impactLevel);
      payload.impact = Number(impactLevel);
      payload.possibilityType = Number(possibilityType);
      payload.possibility = Number(possibilityType);
      payload.likelihood = Number(possibilityType);
      payload.possibilityDescription = possibilityDescription;
      payload.residualImpactDescription = residualImpactDescription;
      payload.residualImpactLevel = Number(residualImpactLevel) || 0;
      payload.residualPossibilityType = Number(residualPossibilityType) || 0;
      payload.residualPossibilityDescription = residualPossibilityDescription;
      payload.score = inherentScore > 0 ? inherentScore : 0;
      payload.inherentScore = inherentScore > 0 ? inherentScore : 0;
      payload.level = inherentLevel?.label || null;
      payload.inherentLevel = inherentLevel?.label || null;
      payload.residualScore = residualScore > 0 ? residualScore : null;
      payload.residualLevel = residualLevel?.label || null;
    }

    onSubmit?.(payload);
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ringkasan Risiko */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ringkasan Risiko</div>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold">Peristiwa Risiko:</span>{' '}
            {risk?.riskEvent || risk?.title || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Sasaran:</span>{' '}
            {risk?.target || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Penyebab Risiko:</span>{' '}
            {risk?.riskCause || 'N/A'}
          </div>
        </div>
      </div>

      {/* Bagian 1: Kontrol yang Ada */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bagian 1: Kontrol yang Ada</h3>
        
        <div className="space-y-4">
          {/* Kontrol yang Ada */}
          <div className="flex flex-col gap-2">
            <label htmlFor="existing-control" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kontrol yang Ada</label>
            <textarea
              id="existing-control"
              className={`${inputBase} min-h-[100px] resize-y`}
              value={existingControl}
              onChange={(e) => setExistingControl(e.target.value)}
              placeholder="Jelaskan kontrol yang ada..."
            />
          </div>

          {/* Jenis Kontrol & Level Kontrol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="control-type" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Jenis Kontrol</label>
              <ControlTypeDropdown
                id="control-type"
                value={controlType}
                onChange={setControlType}
                openUpward={false}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="control-level" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Level Kontrol</label>
              <ControlLevelDropdown
                id="control-level"
                value={controlLevel}
                onChange={setControlLevel}
                openUpward={false}
              />
            </div>
          </div>

          {/* Pemilik Kontrol */}
          {/* Penilaian Efektivitas Kontrol */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Penilaian Efektivitas Kontrol</label>
            <ControlEffectivenessDropdown
              value={controlEffectivenessAssessment}
              onChange={setControlEffectivenessAssessment}
              placeholder="Pilih penilaian efektivitas"
            />
          </div>

          {/* Perkiraan waktu terpapar resiko */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Perkiraan waktu terpapar resiko
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Dari bulan</span>
                <MonthPickerDropdown
                  id="exposure-date-start"
                  value={estimatedExposureDate}
                  onChange={setEstimatedExposureDate}
                  placeholder="Pilih bulan mulai"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Sampai bulan</span>
                <MonthPickerDropdown
                  id="exposure-date-end"
                  value={estimatedExposureDateEnd}
                  onChange={setEstimatedExposureDateEnd}
                  min={estimatedExposureDate || undefined}
                  placeholder="Pilih bulan akhir"
                />
              </div>
            </div>
            {(estimatedExposureDate || estimatedExposureDateEnd) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Dipilih: {formatMonthDisplay(estimatedExposureDate) || '—'} s/d {formatMonthDisplay(estimatedExposureDateEnd) || '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bagian 2: Key Risk Indicator */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bagian 2: Key Risk Indicator</h3>
        
        <div className="space-y-4">
          {/* Key Risk Indicator */}
          <div className="flex flex-col gap-2">
            <label htmlFor="key-risk-indicator" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Key Risk Indicator</label>
            <input
              id="key-risk-indicator"
              className={inputBase}
              value={keyRiskIndicator}
              onChange={(e) => setKeyRiskIndicator(e.target.value)}
              placeholder="Masukkan Key Risk Indicator..."
            />
          </div>

          {/* Unit Satuan KRI */}
          <div className="flex flex-col gap-2">
            <label htmlFor="kri-unit" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Unit Satuan KRI</label>
            <input
              id="kri-unit"
              className={inputBase}
              value={kriUnit}
              onChange={(e) => setKriUnit(e.target.value)}
              placeholder="Masukkan unit satuan KRI..."
            />
          </div>

          {/* Value Aman, Hati-Hati, Bahaya */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="kri-value-safe" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Value Aman</label>
              <input
                id="kri-value-safe"
                className={inputBase}
                value={kriValueSafe}
                onChange={(e) => setKriValueSafe(e.target.value)}
                placeholder="Value yang aman..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="kri-value-caution" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Value Hati-Hati</label>
              <input
                id="kri-value-caution"
                className={inputBase}
                value={kriValueCaution}
                onChange={(e) => setKriValueCaution(e.target.value)}
                placeholder="Value yang hati-hati..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="kri-value-danger" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Value Bahaya</label>
              <input
                id="kri-value-danger"
                className={inputBase}
                value={kriValueDanger}
                onChange={(e) => setKriValueDanger(e.target.value)}
                placeholder="Value yang bahaya..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bagian 3: Pengukuran Resiko — hidden in wizard mode (moved to Phase 5) */}
      {!wizardMode && <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bagian 3: Pengukuran Resiko</h3>
        
        <div className="space-y-6">
          {/* Inherent Risk */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Inherent Risk (Risiko awal sebelum adanya kontrol)</h4>
            
            <div className="space-y-4">
              {/* Tingkat Dampak & Deskripsi Dampak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="impact-level" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tingkat Dampak</label>
                  <select
                    id="impact-level"
                    className={inputBase}
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value)}
                  >
                    <option value={0}>-- Pilih --</option>
                    {IMPACT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="impact-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Dampak</label>
                  <textarea
                    id="impact-description"
                    className={`${inputBase} min-h-[100px] resize-y`}
                    value={impactDescription}
                    onChange={(e) => setImpactDescription(e.target.value)}
                    placeholder="Jelaskan dampak potensial..."
                  />
                </div>
              </div>

              {/* Tingkat Kemungkinan & Deskripsi Kemungkinan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="possibility-type" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tingkat Kemungkinan</label>
                  <select
                    id="possibility-type"
                    className={inputBase}
                    value={possibilityType}
                    onChange={(e) => setPossibilityType(e.target.value)}
                  >
                    <option value={0}>-- Pilih --</option>
                    {POSSIBILITY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="possibility-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Kemungkinan</label>
                  <textarea
                    id="possibility-description"
                    className={`${inputBase} min-h-[100px] resize-y`}
                    value={possibilityDescription}
                    onChange={(e) => setPossibilityDescription(e.target.value)}
                    placeholder="Jelaskan kemungkinan/kemungkinan..."
                  />
                </div>
              </div>

              {/* Inherent Risk Score */}
              {inherentScore > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Risiko Inheren</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskLevelBadge score={inherentScore} />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {inherentScore}/25
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Residual Risk */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Residual Risk (Risiko yang diharapkan setelah kontrol)</h4>
            
            <div className="space-y-4">
              {/* Tingkat Dampak Residual & Deskripsi Dampak Residual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="residual-impact-level" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tingkat Dampak Residual</label>
                  <select
                    id="residual-impact-level"
                    className={inputBase}
                    value={residualImpactLevel}
                    onChange={(e) => setResidualImpactLevel(e.target.value)}
                  >
                    <option value={0}>-- Pilih --</option>
                    {IMPACT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="residual-impact-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Dampak Residual</label>
                  <textarea
                    id="residual-impact-description"
                    className={`${inputBase} min-h-[100px] resize-y`}
                    value={residualImpactDescription}
                    onChange={(e) => setResidualImpactDescription(e.target.value)}
                    placeholder="Jelaskan dampak residual..."
                  />
                </div>
              </div>

              {/* Tingkat Kemungkinan Residual & Deskripsi Kemungkinan Residual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="residual-possibility-type" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tingkat Kemungkinan Residual</label>
                  <select
                    id="residual-possibility-type"
                    className={inputBase}
                    value={residualPossibilityType}
                    onChange={(e) => setResidualPossibilityType(e.target.value)}
                  >
                    <option value={0}>-- Pilih --</option>
                    {POSSIBILITY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="residual-possibility-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Kemungkinan Residual</label>
                  <textarea
                    id="residual-possibility-description"
                    className={`${inputBase} min-h-[100px] resize-y`}
                    value={residualPossibilityDescription}
                    onChange={(e) => setResidualPossibilityDescription(e.target.value)}
                    placeholder="Jelaskan kemungkinan residual..."
                  />
                </div>
              </div>

              {/* Residual Risk Score */}
              {residualScore > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Risiko Residual</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskLevelBadge score={residualScore} />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {residualScore}/25
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* Submit Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          {wizardMode ? (
            <><i className="bi bi-arrow-left mr-2" />Back</>
          ) : (
            'Batal'
          )}
        </button>
        <button
          type="submit"
          disabled={wizardMode && isSubmitting}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {wizardMode
            ? isSubmitting ? 'Menyimpan...' : 'Save Risk'
            : 'Simpan Evaluasi'}
        </button>
      </div>
    </form>
  );
}
