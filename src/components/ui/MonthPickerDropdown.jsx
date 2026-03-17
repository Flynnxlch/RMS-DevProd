import { useEffect, useRef, useState } from 'react';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * MonthPickerDropdown — calendar-style month picker.
 * value: "YYYY-MM" string or ''
 * onChange: (yyyyMM) => void
 * min: "YYYY-MM" string (optional) — disables months before this
 */
export default function MonthPickerDropdown({ value, onChange, min, placeholder = 'Pilih bulan', id }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0], 10);
    return new Date().getFullYear();
  });
  const containerRef = useRef(null);

  // Sync viewYear when value changes externally
  useEffect(() => {
    if (value) setViewYear(parseInt(value.split('-')[0], 10));
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedYear = value ? parseInt(value.split('-')[0], 10) : null;
  const selectedMonth = value ? parseInt(value.split('-')[1], 10) : null; // 1-12

  const minYear = min ? parseInt(min.split('-')[0], 10) : null;
  const minMonth = min ? parseInt(min.split('-')[1], 10) : null; // 1-12

  const isDisabled = (monthIndex) => {
    // monthIndex: 0-11
    if (!minYear || !minMonth) return false;
    if (viewYear < minYear) return true;
    if (viewYear === minYear && monthIndex + 1 < minMonth) return true;
    return false;
  };

  const handleSelect = (monthIndex) => {
    if (isDisabled(monthIndex)) return;
    const mm = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  };

  const displayLabel = value
    ? `${MONTHS_ID[selectedMonth - 1]} ${selectedYear}`
    : placeholder;

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputBase} flex items-center justify-between cursor-pointer text-left`}
      >
        <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>
          {displayLabel}
        </span>
        <i className="bi bi-calendar3 text-gray-400 dark:text-gray-500 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 w-64">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <i className="bi bi-chevron-left" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_ID.map((name, idx) => {
              const disabled = isDisabled(idx);
              const selected = selectedYear === viewYear && selectedMonth === idx + 1;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(idx)}
                  className={`px-1 py-2 text-xs rounded-lg font-medium transition-colors
                    ${selected
                      ? 'bg-blue-600 text-white'
                      : disabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                    }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="mt-2 w-full text-xs text-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Hapus pilihan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
