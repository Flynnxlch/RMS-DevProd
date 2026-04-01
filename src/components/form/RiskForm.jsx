import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CabangDropdown from '../ui/CabangDropdown';
import CategoryDropdown from '../ui/CategoryDropdown';
import DivisionDropdown from '../ui/DivisionDropdown';
import { getCabangLabel } from '../../utils/cabang';

// Organization is now fixed as "PT. BVB"
const ORGANIZATION_FIXED = 'PT. Gapura Angkasa';

const DIVISION_OPTIONS_KPS = [
  'Operational Audit Division Head',
  'Enabler Audit Division Head',
  'Quality & Standardization Division Head',
  'Ground Handling & Ancillary QA Division Head',
  'Quality Control Department Head',
  'Head of Inspector Safety, Security & Quality',
  'Stakeholder Relation Division Head',
  'General Affairs Division Head',
  'Corporate Communication Division Head',
  'Maintenance Building Department Head',
  'Corporate Communication Department Head',
  'Marketing Communication Department Head',
  'Corporate Planning Division Head',
  'Corporate Performance Division Head',
  'Corporate Legal Division Head',
  'Business Legal Division Head',
  'Manpower Planning & Organization Development Division Head',
  'Talent Management & Corporate Culture Division Head',
  'Head of Talent Management',
  'Industrial Relations & OS Management Division Head',
  'Human Capital Support Division Head',
  'Head of Payroll & Benefits',
  'Procurement Planning, Control & VM Division Head',
  'Procurement Operation Division Head',
  'Licence Manpower Training & Development Division Head',
  'Non Licence Manpower Training & Development Division Head',
  'Accounting Division Head',
  'Asset Management Division Head',
  'Tax Management Division Head',
  'Budgeting & Cost Control Division Head',
  'Finance Division Head',
  'Risk Management Division Head',
  'Governance & Compliance Division Head',
  'Ground Handling Regional Landside Operation Division Head',
  'Ground Handling Regional Airside Operation Division Head',
  'Warehouse, Logistic & Concierge Operation Division Head',
  'Ground Handling Command Center Department Head',
  'GSE Maintenance Division Head',
  'GSE Spare Parts Engineering Division Head',
  'Full-Service Airlines Service Division Head',
  'LCC Airline Service Division Head',
  'Customer Service Division Head',
  'Information Technology Division Head',
  'Health, Safety, Security & Environment Division Head',
  'Domestic Airlines Account Management Division Head',
  'International Airlines Account Management Division Head',
  'Warehouse Handling & Storage Facility Business Division Head',
  'Concierge Business Division Head',
  'Logistic Business Division Head',
  'Customer Relationship Management Division Head',
];
const DIVISION_OPTIONS_NON_KPS = [...DIVISION_OPTIONS_KPS];

const RISK_TYPE_OPTIONS = [
  'Strategic',
  'Operational',
  'Financial',
  'Compliance',
  'Reputational',
  'Technology',
];

const RISK_CATEGORY_TYPE_OPTIONS = [
  'Kualitatif',
  'Kuantitatif'
];

// Cabang options are now handled by CabangDropdown component

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

export default function RiskForm({
  onSubmit,
  submitLabel = 'Tambah Risiko',
  compact = false,
  simplified = false, // For New Risk Entry - only show basic fields
  wizardMode = false, // For 2-step wizard: changes button to "Continue →"
  initial = {},
}) {
  const { user } = useAuth();
  
  // Determine if user can select cabang (only Risk Assessment can select)
  const canSelectCabang = user?.userRole === 'RISK_ASSESSMENT';

  // Auto-set regionCode from user's regionCabang for Risk Champion and Risk Officer
  const defaultRegionCode = useMemo(() => {
    if (initial.regionCode) {
      return initial.regionCode;
    }
    // For Risk Champion and Risk Officer, use their regionCabang
    if (user?.regionCabang && !canSelectCabang) {
      return user.regionCabang;
    }
    return 'KPS'; // Default fallback
  }, [initial.regionCode, user?.regionCabang, canSelectCabang]);

  // Organization is fixed as "PT. BVB" and cannot be edited
  const organization = ORGANIZATION_FIXED;
  const [division, setDivision] = useState(initial.division || '');
  const [target, setTarget] = useState(initial.target || '');
  const [activity, setActivity] = useState(initial.activity || '');
  const [riskEvent, setRiskEvent] = useState(initial.riskEvent || '');
  const [riskEventDescription, setRiskEventDescription] = useState(initial.riskEventDescription || '');
  const [category, setCategory] = useState(initial.category || '');
  const [riskType] = useState(initial.riskType || RISK_TYPE_OPTIONS[0]);
  const [riskCategoryType, setRiskCategoryType] = useState(initial.riskCategoryType || RISK_CATEGORY_TYPE_OPTIONS[0]);
  const [riskCause, setRiskCause] = useState(initial.riskCause || '');
  const [quantitativeRiskImpact, setQuantitativeRiskImpact] = useState(initial.quantitativeRiskImpact || '');
  const [riskImpactExplanation, setRiskImpactExplanation] = useState(initial.riskImpactExplanation || '');
  // For Risk Champion and Risk Officer, regionCode is locked to user's regionCabang
  // For Risk Assessment, regionCode can be changed via dropdown
  // Use useMemo to get the actual regionCode to use (locked for non-Risk Assessment users)
  const actualRegionCode = useMemo(() => {
    if (!canSelectCabang && user?.regionCabang) {
      // For Risk Champion and Risk Officer, always use their regionCabang
      return user.regionCabang;
    }
    // For Risk Assessment, use the state value (can be changed)
    return defaultRegionCode;
  }, [canSelectCabang, user?.regionCabang, defaultRegionCode]);

  const [regionCode, setRegionCode] = useState(actualRegionCode);
  const [possibility, setPossibility] = useState(initial.possibility || initial.possibilityType || initial.likelihood || 3);
  const [impact, setImpact] = useState(initial.impactLevel || initial.impact || 4);
  const [mitigation, setMitigation] = useState(initial.mitigation || '');

  // riskDate: defaults to today, user can change via date picker
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const [riskDate, setRiskDate] = useState(() => {
    if (initial.riskDate) return new Date(initial.riskDate).toISOString().slice(0, 10);
    return todayIso();
  });
  const dateInputRef = useRef(null);

  // For non-selectable users, ensure regionCode stays in sync with user's regionCabang
  const finalRegionCode = canSelectCabang ? regionCode : (user?.regionCabang || regionCode);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!riskEvent.trim()) return;
    
    const payload = {
      organization,
      division,
      target: target.trim(),
      activity: activity.trim(),
      riskEvent: riskEvent.trim(),
      riskEventDescription: riskEventDescription.trim(),
      category,
      riskType,
      riskCategoryType,
      riskCause: riskCause.trim(),
      quantitativeRiskImpact: quantitativeRiskImpact.trim(),
      riskImpactExplanation: riskImpactExplanation.trim(),
      title: riskEvent.trim(), // Keep title for backward compatibility
      regionCode: finalRegionCode,
      riskDate: riskDate || todayIso(),
    };
    
    // Only include these fields if not simplified
    if (!simplified) {
      payload.possibility = Number(possibility);
      payload.possibilityType = Number(possibility);
      payload.impact = Number(impact);
      payload.impactLevel = Number(impact);
      payload.likelihood = Number(possibility); // Keep for backward compatibility
      payload.mitigation = mitigation.trim();
    }
    
    onSubmit?.(payload);

    // Reset form (compact quick entry)
    if (compact) {
      setTarget('');
      setActivity('');
      setRiskEvent('');
      setRiskEventDescription('');
      setRiskCause('');
      setQuantitativeRiskImpact('');
      setRiskImpactExplanation('');
      setRiskDate(todayIso());
      if (!simplified) {
        setPossibility(3);
        setImpact(4);
        setMitigation('');
      }
    }
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Organization & Division */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nama Perusahaan</label>
          <input
            type="text"
            className={`${inputBase} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600`}
            value={organization}
            readOnly
            disabled
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Divisi</label>
          <DivisionDropdown
            value={division}
            onChange={setDivision}
            regionCode={finalRegionCode}
            placeholder="Pilih Divisi"
          />
        </div>
      </div>

      {/* Sasaran & Cabang */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sasaran</label>
          <input
            className={inputBase}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Contoh: Target Pendapatan Q4"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cabang</label>
          {canSelectCabang ? (
            // Risk Assessment can select cabang
            <CabangDropdown
              value={regionCode}
              onChange={setRegionCode}
              openUpward={false}
            />
          ) : (
            // Risk Champion and Risk Officer: show read-only field with their regionCabang
            <input
              type="text"
              className={`${inputBase} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600`}
              value={getCabangLabel(finalRegionCode) || finalRegionCode || 'N/A'}
              readOnly
              disabled
            />
          )}
        </div>
      </div>

      {/* Tanggal Risiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Tanggal Risiko
          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(otomatis hari ini, dapat diubah)</span>
        </label>
        <div className="relative">
          <input
            ref={dateInputRef}
            type="date"
            className={`${inputBase} pr-10 cursor-pointer`}
            value={riskDate}
            onChange={(e) => setRiskDate(e.target.value)}
            max={todayIso()}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              try { dateInputRef.current?.showPicker(); } catch { dateInputRef.current?.focus(); }
            }}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <i className="bi bi-calendar3 text-sm" />
          </button>
        </div>
      </div>

      {/* Risk Event */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Peristiwa Risiko</label>
        <input
          className={inputBase}
          value={riskEvent}
          onChange={(e) => setRiskEvent(e.target.value)}
          placeholder="Contoh: Gangguan supplier untuk komponen kritis"
          required
        />
      </div>

      {/* Deskripsi Peristiwa Risiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Peristiwa Risiko</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskEventDescription}
          onChange={(e) => setRiskEventDescription(e.target.value)}
          placeholder="Jelaskan peristiwa risiko secara detail..."
        />
      </div>

      {/* Kategori Risiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kategori</label>
        <CategoryDropdown
          value={category}
          onChange={setCategory}
          openUpward={false}
        />
      </div>

      {/* Risk Cause */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Penyebab Risiko</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskCause}
          onChange={(e) => setRiskCause(e.target.value)}
          placeholder="Jelaskan akar penyebab risiko..."
        />
      </div>

      {/* Kategori Resiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kategori Dampak</label>
        <select className={inputBase} value={riskCategoryType} onChange={(e) => setRiskCategoryType(e.target.value)}>
          {RISK_CATEGORY_TYPE_OPTIONS.map((rct) => (
            <option key={rct} value={rct}>{rct}</option>
          ))}
        </select>
      </div>

      {/* Deskripsi Dampak */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Dampak</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskImpactExplanation}
          onChange={(e) => setRiskImpactExplanation(e.target.value)}
          placeholder="Jelaskan dampak potensial secara detail..."
        />
      </div>
      <div className={`flex flex-col sm:flex-row sm:items-center gap-3 pt-1 ${wizardMode ? 'sm:justify-end' : 'sm:justify-between'}`}>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-[#0d6efd] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
        >
          {wizardMode ? (
            <>
              {submitLabel}
              <i className="bi bi-arrow-right ml-2" />
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle mr-2" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

