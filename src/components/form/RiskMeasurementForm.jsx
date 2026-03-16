import { useMemo, useState } from 'react';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';

const TREATMENT_OPTIONS = [
  { value: 'Accept / Monitor', label: 'Accept / Monitor' },
  { value: 'Reduce / Mitigate', label: 'Reduce / Mitigate' },
  { value: 'Transfer / Sharing', label: 'Transfer / Sharing' },
  { value: 'Avoid / Hindari', label: 'Avoid / Hindari' },
];

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

export default function RiskMeasurementForm({ risk, onSubmit, onCancel, isSubmitting = false }) {
  const existing = risk?.measurement;

  // Section A — Treatment Option
  const [treatmentOption, setTreatmentOption] = useState(existing?.treatmentOption || '');

  // Section B — Inherent Risk
  const [impactLevel, setImpactLevel] = useState(existing?.impactLevel || 0);
  const [impactDescription, setImpactDescription] = useState(existing?.impactDescription || '');
  const [possibilityType, setPossibilityType] = useState(existing?.possibilityType || 0);
  const [possibilityDescription, setPossibilityDescription] = useState(existing?.possibilityDescription || '');

  // Section B — Residual Risk
  const [residualImpactLevel, setResidualImpactLevel] = useState(existing?.residualImpactLevel || 0);
  const [residualImpactDescription, setResidualImpactDescription] = useState(existing?.residualImpactDescription || '');
  const [residualPossibilityType, setResidualPossibilityType] = useState(existing?.residualPossibilityType || 0);
  const [residualPossibilityDescription, setResidualPossibilityDescription] = useState(existing?.residualPossibilityDescription || '');

  // Computed scores
  const inherentScore = useMemo(() => {
    if (impactLevel > 0 && possibilityType > 0) {
      return computeRiskScore({ impactLevel: Number(impactLevel), possibility: Number(possibilityType) });
    }
    return 0;
  }, [impactLevel, possibilityType]);

  const inherentLevel = useMemo(() => getRiskLevel(inherentScore), [inherentScore]);

  const residualScore = useMemo(() => {
    if (residualImpactLevel > 0 && residualPossibilityType > 0) {
      return computeRiskScore({ impactLevel: Number(residualImpactLevel), possibility: Number(residualPossibilityType) });
    }
    return 0;
  }, [residualImpactLevel, residualPossibilityType]);

  const residualLevel = useMemo(() => getRiskLevel(residualScore), [residualScore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!treatmentOption) return;
    if (!impactLevel || !possibilityType) return;

    onSubmit?.({
      treatmentOption,
      impactLevel: Number(impactLevel),
      impactDescription,
      possibilityType: Number(possibilityType),
      possibilityDescription,
      inherentScore,
      inherentLevel: inherentLevel?.label || null,
      residualImpactLevel: Number(residualImpactLevel) || null,
      residualImpactDescription: residualImpactDescription || null,
      residualPossibilityType: Number(residualPossibilityType) || null,
      residualPossibilityDescription: residualPossibilityDescription || null,
      residualScore: residualScore || null,
      residualLevel: residualLevel?.label || null,
    });
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Risk summary */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ringkasan Risiko</div>
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <div><span className="font-semibold">Peristiwa Risiko:</span> {risk?.riskEvent || risk?.title || 'N/A'}</div>
          <div><span className="font-semibold">Sasaran:</span> {risk?.target || 'N/A'}</div>
          <div><span className="font-semibold">Penyebab:</span> {risk?.riskCause || 'N/A'}</div>
        </div>
      </div>

      {/* Section A: Treatment Option */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Section A: Risk Treatment Option</h3>
        <div className="flex flex-col gap-2">
          <label htmlFor="treatment-option" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Risk Treatment Option <span className="text-red-500">*</span>
          </label>
          <select
            id="treatment-option"
            className={inputBase}
            value={treatmentOption}
            onChange={(e) => setTreatmentOption(e.target.value)}
            required
          >
            <option value="">-- Pilih opsi --</option>
            {TREATMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section B: Pengukuran Risiko */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Section B: Pengukuran Risiko</h3>

        <div className="space-y-6">
          {/* Inherent Risk */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Inherent Risk (Risiko awal sebelum adanya kontrol)
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="impact-level" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Tingkat Dampak <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="impact-level"
                    className={inputBase}
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value)}
                    required
                  >
                    <option value={0}>-- Pilih --</option>
                    {IMPACT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="impact-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Dampak</label>
                  <textarea
                    id="impact-description"
                    className={`${inputBase} min-h-[80px] resize-y`}
                    value={impactDescription}
                    onChange={(e) => setImpactDescription(e.target.value)}
                    placeholder="Jelaskan dampak potensial..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="possibility-type" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Tingkat Kemungkinan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="possibility-type"
                    className={inputBase}
                    value={possibilityType}
                    onChange={(e) => setPossibilityType(e.target.value)}
                    required
                  >
                    <option value={0}>-- Pilih --</option>
                    {POSSIBILITY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="possibility-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Kemungkinan</label>
                  <textarea
                    id="possibility-description"
                    className={`${inputBase} min-h-[80px] resize-y`}
                    value={possibilityDescription}
                    onChange={(e) => setPossibilityDescription(e.target.value)}
                    placeholder="Jelaskan kemungkinan terjadinya risiko..."
                  />
                </div>
              </div>

              {inherentScore > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tingkat Risiko Inheren</p>
                  <div className="flex items-center gap-3">
                    <RiskLevelBadge score={inherentScore} />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{inherentScore}/25</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Residual Risk */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Residual Risk (Risiko yang diharapkan setelah kontrol)
            </h4>

            <div className="space-y-4">
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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="residual-impact-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Dampak Residual</label>
                  <textarea
                    id="residual-impact-description"
                    className={`${inputBase} min-h-[80px] resize-y`}
                    value={residualImpactDescription}
                    onChange={(e) => setResidualImpactDescription(e.target.value)}
                    placeholder="Jelaskan dampak residual..."
                  />
                </div>
              </div>

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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="residual-possibility-description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Kemungkinan Residual</label>
                  <textarea
                    id="residual-possibility-description"
                    className={`${inputBase} min-h-[80px] resize-y`}
                    value={residualPossibilityDescription}
                    onChange={(e) => setResidualPossibilityDescription(e.target.value)}
                    placeholder="Jelaskan kemungkinan residual..."
                  />
                </div>
              </div>

              {residualScore > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tingkat Risiko Residual</p>
                  <div className="flex items-center gap-3">
                    <RiskLevelBadge score={residualScore} />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{residualScore}/25</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !treatmentOption || !impactLevel || !possibilityType}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Pengukuran'}
        </button>
      </div>
    </form>
  );
}
