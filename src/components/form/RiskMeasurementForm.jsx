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

// Q1=10%, Q2=8%, Q3=7%, Q4=6%
const QUARTER_RATES = [0.10, 0.08, 0.07, 0.06];
const QUARTER_LABELS = [
  'Q1 (Januari – Maret)',
  'Q2 (April – Juni)',
  'Q3 (Juli – September)',
  'Q4 (Oktober – Desember)',
];

function formatRupiahInput(raw) {
  if (!raw || raw === '') return '';
  const parts = raw.split(',');
  const intNum = parseInt(parts[0], 10);
  if (isNaN(intNum)) return raw;
  const formatted = intNum.toLocaleString('id-ID');
  return 'Rp ' + (parts.length > 1 ? formatted + ',' + parts[1] : formatted);
}

function handleRupiahChange(rawValue, setter) {
  const stripped = rawValue.replace(/^Rp\s*/, '').replace(/\./g, '');
  if (stripped === '' || stripped === '-') { setter(stripped); return; }
  const cleaned = stripped.replace(/[^0-9,]/g, '');
  const parts = cleaned.split(',');
  setter(parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : cleaned);
}

function makeQuarter(existing, suffix) {
  return {
    residualImpactLevel:     existing?.[`residualImpactLevel${suffix}`]  || 0,
    residualPossibilityType: existing?.[`residualPossibilityType${suffix}`] || 0,
    nilaiProbabilitas:       existing?.[`nilaiProbabilitas${suffix}`]    ?? '',
  };
}

export default function RiskMeasurementForm({ risk, onSubmit, onCancel, isSubmitting = false }) {
  const existing = risk?.measurement;

  // Section A — Treatment Option
  const [treatmentOption, setTreatmentOption] = useState(existing?.treatmentOption || '');

  const isKualitatif = risk?.riskCategoryType === 'Kualitatif';

  // Asumsi Perhitungan Dampak — shared between Section B and C
  const [unitRisiko, setUnitRisiko] = useState(
    existing?.unitRisiko != null ? String(existing.unitRisiko).replace('.', ',') : ''
  );
  const [limitRisiko, setLimitRisiko] = useState(
    existing?.limitRisiko != null ? String(existing.limitRisiko).replace('.', ',') : ''
  );

  // Section B — Inherent Risk
  const [impactLevel, setImpactLevel] = useState(existing?.impactLevel || 0);
  const [possibilityType, setPossibilityType] = useState(existing?.possibilityType || 0);
  const [nilaiProbabilitasInherent, setNilaiProbabilitasInherent] = useState(
    existing?.nilaiProbabilitasInherent != null ? String(existing.nilaiProbabilitasInherent) : ''
  );

  // Section C — Residual Risk (quarter-based)
  const [quarters, setQuarters] = useState([
    makeQuarter(existing, 'Q1'),
    makeQuarter(existing, 'Q2'),
    makeQuarter(existing, 'Q3'),
    makeQuarter(existing, 'Q4'),
  ]);

  // Computed: inherent score
  const inherentScore = useMemo(() => {
    if (impactLevel > 0 && possibilityType > 0) {
      return computeRiskScore({ impactLevel: Number(impactLevel), possibility: Number(possibilityType) });
    }
    return 0;
  }, [impactLevel, possibilityType]);

  const inherentLevel = useMemo(() => getRiskLevel(inherentScore), [inherentScore]);

  // Computed: inherent nilai dampak / probabilitas / eksposure
  const inherentComputed = useMemo(() => {
    const unitNum = parseFloat(String(unitRisiko).replace(',', '.')) || 0;
    const limitNum = parseFloat(String(limitRisiko).replace(',', '.')) || 0;
    const impLvl = Number(impactLevel);

    // Nilai Dampak always uses unitRisiko * 10%
    const nilaiDampak = unitNum > 0 ? Math.round(unitNum * 0.10) : null;

    const probInput = parseInt(nilaiProbabilitasInherent, 10);
    const probValid = !isNaN(probInput) && probInput >= 1 && probInput <= 12;
    const nilaiProbabilitasDisplay = probValid ? Math.round((probInput / 12) * 100) : null;
    const nilaiProbabilitasRaw = probValid ? probInput / 12 : null;

    // Kualitatif eksposure: 1% * limitRisiko * (prob/12) * tingkatDampak
    // Kuantitatif eksposure: nilaiDampak * (prob/12)
    const nilaiEksposure = probValid
      ? Math.round(isKualitatif && limitNum > 0 && impLvl > 0
          ? 0.01 * limitNum * nilaiProbabilitasRaw * impLvl
          : (nilaiDampak !== null ? nilaiDampak * nilaiProbabilitasRaw : 0))
      : null;

    return { nilaiDampak, nilaiProbabilitasDisplay, nilaiEksposure };
  }, [unitRisiko, limitRisiko, nilaiProbabilitasInherent, isKualitatif, impactLevel]);

  // Per-quarter computed values
  const quarterComputed = useMemo(() => {
    const unitNum = parseFloat(String(unitRisiko).replace(',', '.')) || 0;
    const limitNum = parseFloat(String(limitRisiko).replace(',', '.')) || 0;
    return quarters.map((q, i) => {
      const rate = QUARTER_RATES[i];
      const impLvl = Number(q.residualImpactLevel);
      // Nilai Dampak Residual always uses unitRisiko * rate
      const nilaiDampak = unitNum > 0 ? Math.round(unitNum * rate) : null;

      const probInput = parseInt(q.nilaiProbabilitas, 10);
      const probValid = !isNaN(probInput) && probInput >= 1 && probInput <= 12;
      const nilaiProbabilitasDisplay = probValid ? Math.round(probInput / 12 * 100) : null;
      const nilaiProbabilitasRaw = probValid ? probInput / 12 : null;

      const possLvl = Number(q.residualPossibilityType);
      const score = impLvl > 0 && possLvl > 0
        ? computeRiskScore({ impactLevel: impLvl, possibility: possLvl })
        : null;
      const level = score ? getRiskLevel(score) : null;

      // Kualitatif eksposure: 1% * limitRisiko * (prob/12) * tingkatDampakResidual
      // Kuantitatif eksposure: nilaiDampak * (prob/12)
      const nilaiEksposure = probValid
        ? Math.round(isKualitatif && limitNum > 0 && impLvl > 0
            ? 0.01 * limitNum * nilaiProbabilitasRaw * impLvl
            : (nilaiDampak !== null ? nilaiDampak * nilaiProbabilitasRaw : 0))
        : null;

      return { nilaiDampak, nilaiProbabilitasDisplay, nilaiProbabilitasRaw, score, level, nilaiEksposure };
    });
  }, [unitRisiko, limitRisiko, quarters, isKualitatif]);

  const updateQuarter = (index, field, value) => {
    setQuarters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!treatmentOption || !impactLevel || !possibilityType) return;

    onSubmit?.({
      treatmentOption,
      impactLevel: Number(impactLevel),
      possibilityType: Number(possibilityType),
      nilaiProbabilitasInherent: nilaiProbabilitasInherent !== '' ? Number(nilaiProbabilitasInherent) : null,
      inherentScore,
      inherentLevel: inherentLevel?.label || null,
      unitRisiko: unitRisiko !== '' ? parseFloat(String(unitRisiko).replace(',', '.')) : null,
      limitRisiko: isKualitatif && limitRisiko !== '' ? parseFloat(String(limitRisiko).replace(',', '.')) : null,
      residualQuarters: quarters.map((q, i) => ({
        quarter: i + 1,
        residualImpactLevel:     Number(q.residualImpactLevel)     || null,
        residualPossibilityType: Number(q.residualPossibilityType) || null,
        nilaiProbabilitas:       q.nilaiProbabilitas !== ''        ? Number(q.nilaiProbabilitas) : null,
      })),
    });
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';
  const readonlyBase =
    'rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/60 px-3 py-2 text-sm text-gray-700 dark:text-gray-300';

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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asumsi Perhitungan Dampak — shared, placed between A and B */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Asumsi Perhitungan Dampak</h3>
        <div className="flex flex-col gap-2">
          <label htmlFor="unit-risiko" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Nilai Anggaran / Unit Risiko
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="unit-risiko"
            className={inputBase}
            value={formatRupiahInput(unitRisiko)}
            onChange={(e) => handleRupiahChange(e.target.value, setUnitRisiko)}
            placeholder="Rp 0"
          />
          <p className="text-xs text-gray-400">
            Digunakan untuk menghitung Nilai Dampak Inheren (×10%) dan Nilai Dampak Residual per kuartal.
          </p>
        </div>

        {isKualitatif && (
          <div className="flex flex-col gap-2 mt-4">
            <label htmlFor="limit-risiko" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Limit Risiko
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="limit-risiko"
              className={inputBase}
              value={formatRupiahInput(limitRisiko)}
              onChange={(e) => handleRupiahChange(e.target.value, setLimitRisiko)}
              placeholder="Rp 0"
            />
          </div>
        )}
      </div>

      {/* Section B: Risiko Inherent */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Section B: Pengukuran Risiko — Risiko Inherent
        </h3>

        <div className="border-l-4 border-blue-500 pl-4 space-y-4">
          {/* Tingkat Dampak & Nilai Dampak */}
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
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Nilai Dampak
                <span className="ml-1 text-xs font-normal text-gray-400">(Anggaran × 10%)</span>
              </label>
              <div className={`${readonlyBase} w-full`}>
                {inherentComputed.nilaiDampak !== null
                  ? `Rp ${inherentComputed.nilaiDampak.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
                  : <span className="text-gray-400 italic text-xs">Isi Asumsi Dampak terlebih dahulu</span>}
              </div>
            </div>
          </div>

          {/* Tingkat Kemungkinan & Nilai Probabilitas */}
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
              <label htmlFor="prob-inherent" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Nilai Probabilitas
                <span className="ml-1 text-xs font-normal text-gray-400">(1–12)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="prob-inherent"
                  className={`${inputBase} flex-1`}
                  value={nilaiProbabilitasInherent}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { setNilaiProbabilitasInherent(''); return; }
                    const parsed = parseInt(raw, 10);
                    if (!isNaN(parsed)) {
                      setNilaiProbabilitasInherent(String(Math.min(12, Math.max(1, parsed))));
                    }
                  }}
                  min={1}
                  max={12}
                  placeholder="1–12"
                />
                <div className={`${readonlyBase} w-20 text-center shrink-0`}>
                  {inherentComputed.nilaiProbabilitasDisplay !== null
                    ? `${inherentComputed.nilaiProbabilitasDisplay}%`
                    : <span className="text-gray-400 italic">—</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Tingkat Risiko Inheren */}
          {inherentScore > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tingkat Risiko Inheren</p>
              <div className="flex items-center gap-3">
                <RiskLevelBadge score={inherentScore} />
                <span className="text-lg font-bold text-gray-900 dark:text-white">{inherentScore}/25</span>
              </div>
            </div>
          )}

          {/* Nilai Eksposure Inherent */}
          {inherentComputed.nilaiEksposure !== null && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 gap-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nilai Eksposure</p>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Rp {inherentComputed.nilaiEksposure.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Section C: Risiko Residual */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Section C: Risiko Residual
        </h3>

        {/* Q1–Q4 subsections */}
        <div className="space-y-4">
          {QUARTER_LABELS.map((qLabel, i) => {
            const q = quarters[i];
            const comp = quarterComputed[i];
            return (
              <div key={qLabel} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800/30">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">{qLabel}</h4>

                <div className="space-y-4">
                  {/* Tingkat Dampak & Tingkat Kemungkinan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Tingkat Dampak Residual
                      </label>
                      <select
                        className={inputBase}
                        value={q.residualImpactLevel}
                        onChange={(e) => updateQuarter(i, 'residualImpactLevel', e.target.value)}
                      >
                        <option value={0}>-- Pilih --</option>
                        {IMPACT_LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Tingkat Kemungkinan Residual
                      </label>
                      <select
                        className={inputBase}
                        value={q.residualPossibilityType}
                        onChange={(e) => updateQuarter(i, 'residualPossibilityType', e.target.value)}
                      >
                        <option value={0}>-- Pilih --</option>
                        {POSSIBILITY_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Nilai Dampak (read-only) & Nilai Probabilitas (input → %) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Nilai Dampak Residual
                      </label>
                      <div className={`${readonlyBase} w-full`}>
                        {comp.nilaiDampak !== null
                          ? `Rp ${comp.nilaiDampak.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
                          : <span className="text-gray-400 italic text-xs">Isi Asumsi Dampak terlebih dahulu</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Nilai Probabilitas Residual
                        <span className="ml-1 text-xs font-normal text-gray-400">(1–12)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className={`${inputBase} flex-1`}
                          value={q.nilaiProbabilitas}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              updateQuarter(i, 'nilaiProbabilitas', '');
                              return;
                            }
                            const parsed = parseInt(raw, 10);
                            if (!isNaN(parsed)) {
                              updateQuarter(i, 'nilaiProbabilitas', String(Math.min(12, Math.max(1, parsed))));
                            }
                          }}
                          min={1}
                          max={12}
                          placeholder="1–12"
                        />
                        <div className={`${readonlyBase} w-20 text-center shrink-0`}>
                          {comp.nilaiProbabilitasDisplay !== null
                            ? `${comp.nilaiProbabilitasDisplay}%`
                            : <span className="text-gray-400 italic">—</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tingkat Risiko Residual */}
                  {comp.score !== null && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tingkat Risiko Residual</p>
                      <div className="flex items-center gap-3">
                        <RiskLevelBadge score={comp.score} />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{comp.score}/25</span>
                      </div>
                    </div>
                  )}

                  {/* Nilai Eksposure */}
                  {comp.nilaiEksposure !== null && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 gap-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nilai Eksposure</p>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Rp {comp.nilaiEksposure.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
