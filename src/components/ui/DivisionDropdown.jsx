import { useEffect, useMemo, useRef, useState } from 'react';

// Base divisions for KPS (single field)
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

// Map untuk divisi khusus per cabang (single field)
const CABANG_SPECIFIC_DIVISIONS = {
  // SBU Cargo & Warehouse (CGO)
  CGO: [
    'Executive General Manager Strategic Business Cargo & Warehouse',
    'General Manager Cargo & Warehouse',
    'Cargo & Warehouse Operation',
    'Cargo & Warehouse Commercial',
    'Cargo & Warehouse GA Group',
    'Cargo & Warehouse Non GA Group',
    'Human Resources & General Affair Cargo & Warehouse',
    'Finance Cargo & Warehouse',
    'Quality Control Cargo & Warehouse',
    'Operation Cargo & Warehouse',
    'Administration & Finance Cargo & Warehouse',
  ],
  // HUB Soekarno-Hatta (CGK)
  CGK: [
    'Executive General Manager',
    'General Manager',
    'Pre Flight Garuda (GA) Services',
    'Post Flight Garuda (GA) Services',
    'Foreign Airlines (MPA) / Maskapai Penerbangan Asing Services',
    'Maskapai Penerbangan Lain (MPL) & Unscheduled Flight Services',
    'Terminal 1 & 2 Services',
    'Airside Terminal 3 Services',
    'Ground Support Equipment (GSE) Operation',
    'Ground Support Equipment (GSE) Maintenance',
    'Safety, Security & Quality',
    'Human Resources & General Affair',
    'Finance',
    'Ancillary',
  ],
  // HUB Ngurah Rai - DPS
  DPS: [
    'Executive General Manager',
    'General Manager',
    'GA, QG & MPL Services',
    'MPA & Unscheduled Flight Services',
    'Airside Services',
    'GSE Operation & Maintenance',
    'Safety, Security & Quality',
    'Ancillary',
    'Human Resources & General Affair',
    'Finance',
  ],
  // HUB Juanda - SUB
  SUB: [
    'Executive General Manager',
    'General Manager',
    'GSE Operation & Maintenance',
    'Operation Services Terminal 1',
    'Operation Services Terminal 2',
    'Human Resources & General Affair',
    'Finance',
  ],
  // HUB Kualanamu - KNO
  KNO: [
    'Executive General Manager',
    'General Manager',
    'Landside Services',
    'Airside Services',
    'GSE Operation & Maintenance',
    'Human Resources & General Affair',
    'Finance',
  ],
  // HUB Sultan Hasanuddin - UPG
  UPG: [
    'Executive General Manager',
    'General Manager',
    'Operation Services',
    'GSE Operation & Maintenance',
    'Human Resources & General Affair',
    'Administration & Finance',
  ],
  // Default untuk cabang lainnya
  DEFAULT: [
    'General Manager',
    'Operation & GSE Services',
    'Administration & Finance',
  ],
};

/**
 * Get division options based on region code/cabang
 * @param {string} regionCode - The region code or cabang code (e.g., 'KPS', 'CGK', etc.)
 * @returns {Array<string>} Array of division options
 */
export function getDivisionOptions(regionCode) {
  if (!regionCode) {
    return CABANG_SPECIFIC_DIVISIONS.DEFAULT;
  }

  // Normalisasi regionCode agar matching dengan key mapping (uppercase, trim)
  const normalizedRegion = regionCode.trim().toUpperCase();

  // Check if this cabang has specific divisions by code (short code)
  if (CABANG_SPECIFIC_DIVISIONS[normalizedRegion]) {
    return CABANG_SPECIFIC_DIVISIONS[normalizedRegion];
  }

  // If not found by short code, try to find by full name (for backward compatibility)
  // Import CABANG_OPTIONS from CabangDropdown to map full name to short code
  const CABANG_OPTIONS = [
    { code: 'Kantor Pusat', label: 'KPS' },
    { code: 'SBU Cargo & Warehouse', label: 'CGO' },
    { code: 'HUB Bandara Internasional Soekarno-Hatta, Cengkareng', label: 'CGK' },
    { code: 'HUB Bandara Internasional Ngurah Rai, Denpasar', label: 'DPS' },
    { code: 'HUB Bandara Internasional Juanda, Surabaya', label: 'SUB' },
    { code: 'HUB Bandara Internasional Sultan Hasanuddin, Makassar', label: 'UPG' },
    { code: 'HUB Bandara Internasional Kualanamu, Medan', label: 'KNO' },
  ];

  // Try to find by full name (code/description)
  const cabangMatch = CABANG_OPTIONS.find(opt =>
    opt.code.toUpperCase() === normalizedRegion ||
    opt.code === regionCode
  );

  if (cabangMatch && CABANG_SPECIFIC_DIVISIONS[cabangMatch.label]) {
    return CABANG_SPECIFIC_DIVISIONS[cabangMatch.label];
  }

  // Default: KPS uses KPS divisions
  if (normalizedRegion === 'KPS') return DIVISION_OPTIONS_KPS;

  // Jika bukan KPS dan tidak ada mapping spesifik, gunakan DEFAULT
  return CABANG_SPECIFIC_DIVISIONS.DEFAULT;
}

/**
 * Parse a semicolon-separated division string into an array of selected values.
 * @param {string} value - Semicolon-separated string, e.g. "Div A;Div B"
 * @returns {string[]}
 */
function parseValue(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(';').map(v => v.trim()).filter(Boolean);
}

/**
 * DivisionDropdown Component — multi-select checkbox dropdown.
 * value is stored/returned as a semicolon-separated string (e.g. "Div A;Div B").
 *
 * @param {Object} props
 * @param {string} props.value - Semicolon-separated selected divisions
 * @param {Function} props.onChange - Callback with new semicolon-separated string
 * @param {string} props.regionCode - Region code or cabang code (e.g., 'KPS', 'CGK')
 * @param {boolean} props.error - Whether to show error styling
 * @param {boolean} props.openUpward - Whether dropdown should open upward
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Placeholder text
 */
export default function DivisionDropdown({
  value,
  onChange,
  regionCode = 'KPS',
  error = false,
  openUpward = false,
  className = '',
  placeholder = 'Pilih Divisi',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get division options based on regionCode
  const divisionOptions = useMemo(() => getDivisionOptions(regionCode), [regionCode]);

  // Parse value into a Set for O(1) lookup
  const selectedSet = useMemo(() => new Set(parseValue(value)), [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = (division) => {
    const next = new Set(selectedSet);
    if (next.has(division)) {
      next.delete(division);
    } else {
      next.add(division);
    }
    // Preserve order from divisionOptions
    const ordered = divisionOptions.filter(d => next.has(d));
    onChange(ordered.join(';'));
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';
  const borderClass = error ? 'border-red-500 dark:border-red-500' : '';

  // Button label: show selected count or placeholder
  const selectedArray = divisionOptions.filter(d => selectedSet.has(d));
  const buttonLabel = selectedArray.length === 0
    ? placeholder
    : selectedArray.length === 1
      ? selectedArray[0]
      : `${selectedArray.length} divisi dipilih`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${inputBase} ${borderClass} text-left cursor-pointer pr-10`}
        >
          <span className={`block truncate text-sm ${selectedArray.length === 0 ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {buttonLabel}
          </span>
        </button>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <i className={`bi bi-chevron-down text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-50 w-full ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
            {/* Selected count header */}
            {selectedArray.length > 0 && (
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedArray.length} dipilih
                </span>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Hapus semua
                </button>
              </div>
            )}
            <div className="max-h-55 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {divisionOptions.map((division) => {
                const isChecked = selectedSet.has(division);
                return (
                  <button
                    key={division}
                    type="button"
                    onClick={() => handleToggle(division)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isChecked
                        ? 'bg-[#0c9361]/10 dark:bg-[#0c9361]/20'
                        : ''
                    }`}
                  >
                    <span className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-[#0c9361] border-[#0c9361]'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'
                    }`}>
                      {isChecked && <i className="bi bi-check text-white text-xs leading-none" />}
                    </span>
                    <span className={`${isChecked ? 'text-[#0c9361] font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                      {division}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export constants for use in other components if needed
export { CABANG_SPECIFIC_DIVISIONS, DIVISION_OPTIONS_KPS };
